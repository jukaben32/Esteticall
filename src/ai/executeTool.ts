import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { findOrCreateClientByPhone } from '@/services/clients'
import { getSubscription } from '@/services/businesses'
import { listServiceIdsForAgent } from '@/services/agentServices'
import { appendMessage, recordConversationOutcome } from '@/services/conversations'
import { sendAppointmentConfirmationEmail, sendNewAppointmentOwnerEmail } from '@/services/email'
import { encryptSecret } from '@/lib/encryption'
import type { Client, PlanId } from '@/types'

type DB = SupabaseClient<Database>

// Shared by both transports the AI agent runs over: the OpenAI Realtime relay
// (POST /api/ai/tools, called by the browser widget/voice call) and the
// WhatsApp text-mode agent (src/ai/textAgent.ts, called in-process). Business
// logic — booking an appointment, capturing a lead, etc. — must behave
// identically regardless of which channel the caller used, so it lives here
// once.
export async function executeAiTool(
  supabase: DB,
  ctx: { conversationId: string; businessId: string; agentId?: string | null; clientSource?: Client['source'] },
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const { conversationId, businessId, agentId, clientSource = 'ai_call' } = ctx

  switch (name) {
    case 'search_treatments': {
      let query = supabase.from('business_services').select('*').eq('business_id', businessId).eq('is_active', true)

      if (args.maxPrice) query = query.lte('price', args.maxPrice as number)
      if (args.query) query = query.ilike('name', `%${args.query as string}%`)

      // A specialty portfolio only ranks matches — it never removes one.
      // Fetch a little headroom so, when the agent has assigned treatments,
      // its own catalog can be sorted first among equally valid results,
      // without ever dropping a real match the caller asked for.
      const assignedIds = agentId ? new Set(await listServiceIdsForAgent(supabase, agentId)) : null
      const { data, error: searchError } = await query.limit(assignedIds?.size ? 20 : 5)
      if (searchError) throw searchError
      const results = assignedIds?.size
        ? [...(data ?? [])].sort((a, b) => Number(assignedIds.has(b.id)) - Number(assignedIds.has(a.id))).slice(0, 5)
        : (data ?? [])

      await appendMessage(
        supabase,
        businessId,
        conversationId,
        'system',
        `search_treatments(${JSON.stringify(args)}) -> ${results.length} result(s)`
      )
      return { treatments: results }
    }

    case 'get_treatment_details': {
      const { data, error: serviceError } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', args.treatmentName as string)
        .maybeSingle()
      if (serviceError) throw serviceError
      return { treatment: data ?? null }
    }

    case 'recommend_package': {
      let query = supabase.from('packages').select('*').eq('business_id', businessId).eq('is_active', true)

      if (args.treatmentName) {
        const { data: service } = await supabase
          .from('business_services')
          .select('id')
          .eq('business_id', businessId)
          .ilike('name', args.treatmentName as string)
          .maybeSingle()
        if (service) query = query.eq('service_id', service.id)
      }

      const { data, error: packagesError } = await query.limit(10)
      if (packagesError) throw packagesError
      return { packages: data ?? [] }
    }

    case 'check_availability': {
      // The model is instructed to convert relative dates ("mañana") to
      // YYYY-MM-DD itself, but it's still free-text from a live voice/WhatsApp
      // conversation — an unparseable value (e.g. it passes "mañana" verbatim)
      // must not crash the whole request, just fall back to "starting now".
      const parsedDate = args.preferredDate ? new Date(args.preferredDate as string) : undefined
      const fromDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined
      const slots = await getAvailableSlots(supabase, businessId, { fromDate })
      return { slots: slots.slice(0, 10) }
    }

    case 'book_appointment': {
      const subscription = await getSubscription(supabase, businessId)
      const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

      const client = await findOrCreateClientByPhone(supabase, businessId, {
        name: args.clientName as string,
        phone: args.clientPhone as string,
        source: clientSource,
      })

      let serviceId: string | undefined
      let serviceName: string | undefined
      if (args.treatmentName) {
        const { data: service } = await supabase
          .from('business_services')
          .select('id, name')
          .eq('business_id', businessId)
          .ilike('name', args.treatmentName as string)
          .maybeSingle()
        serviceId = service?.id
        serviceName = service?.name
      }

      const healthScreeningNotes = args.healthScreeningNotes as string | undefined
      const needsReview = Boolean(args.needsReview)

      const appointment = await createAppointment(supabase, businessId, plan, {
        serviceId,
        clientId: client.id,
        conversationId,
        scheduledAt: args.datetime as string,
        status: needsReview ? 'pending_confirmation' : undefined,
        notes: healthScreeningNotes,
      })

      // A flagged screening leaves a treatment record for staff to review
      // before the visit — content is encrypted the same way as every other
      // clinical note (see src/lib/encryption.ts).
      if (needsReview && healthScreeningNotes) {
        await supabase.from('treatment_records').insert({
          business_id: businessId,
          client_id: client.id,
          appointment_id: appointment.id,
          service_id: serviceId,
          contraindications_flagged: true,
          notes_encrypted: encryptSecret(healthScreeningNotes),
        })
      }

      await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'appointment_booked' })

      const { data: business } = await supabase
        .from('businesses')
        .select('name, contact_email')
        .eq('id', businessId)
        .maybeSingle()

      if (client.email && business?.name) {
        void sendAppointmentConfirmationEmail({
          to: client.email,
          clientName: client.name,
          businessName: business.name,
          scheduledAt: appointment.scheduled_at,
          serviceName,
        }).catch(() => {})
      }

      if (business?.contact_email && business?.name) {
        void sendNewAppointmentOwnerEmail({
          to: business.contact_email,
          businessName: business.name,
          clientName: client.name,
          clientPhone: client.phone ?? undefined,
          clientEmail: client.email ?? undefined,
          serviceName,
          scheduledAt: appointment.scheduled_at,
        }).catch(() => {})
      }

      return { booked: true, needsReview, appointment }
    }

    case 'capture_lead': {
      const client = await findOrCreateClientByPhone(supabase, businessId, {
        name: args.clientName as string,
        phone: args.clientPhone as string,
        source: clientSource,
      })

      await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'qualified_lead' })

      return { captured: true, clientId: client.id }
    }

    case 'request_callback': {
      const client = await findOrCreateClientByPhone(supabase, businessId, {
        name: args.clientName as string,
        phone: args.clientPhone as string,
        source: clientSource,
      })

      // 'escalated' is the outcome the dashboard's "Callbacks solicitados" stat
      // counts — see recordConversationOutcome / OUTCOME_RANK.
      await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'escalated' })

      const bodyParts = [
        client.phone ? `Tel: ${client.phone}` : null,
        (args.reason as string | undefined) ?? null,
        args.preferredTime ? `Prefiere: ${args.preferredTime}` : null,
      ]
      await supabase.from('notifications').insert({
        business_id: businessId,
        type: 'system',
        title: `Callback solicitado — ${client.name}`,
        body: bodyParts.filter(Boolean).join(' · ') || null,
      })

      return { requested: true, clientId: client.id }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
