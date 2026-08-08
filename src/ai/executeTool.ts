import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { findOrCreateClientByPhone } from '@/services/clients'
import { getSubscription } from '@/services/businesses'
import { appendMessage, recordConversationOutcome } from '@/services/conversations'
import { sendAppointmentConfirmationEmail } from '@/services/email'
import type { Client, PlanId } from '@/types'

type DB = SupabaseClient<Database>

// Shared by both transports the AI agent runs over: the OpenAI Realtime relay
// (POST /api/ai/tools, called by the browser widget/voice call) and the
// WhatsApp text-mode agent (src/ai/textAgent.ts, called in-process). Business
// logic — booking a viewing, capturing a lead, etc. — must behave identically
// regardless of which channel the caller used, so it lives here once.
export async function executeAiTool(
  supabase: DB,
  ctx: { conversationId: string; businessId: string; clientSource?: Client['source'] },
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const { conversationId, businessId, clientSource = 'ai_call' } = ctx

  switch (name) {
    case 'search_listings': {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'available')
        .eq('visible_to_ai_agent', true)

      if (args.listingType && args.listingType !== 'any') {
        query = query.eq('listing_type', args.listingType as 'sale' | 'rent' | 'vacation_rental')
      }
      if (args.maxPrice) query = query.lte('price', args.maxPrice as number)
      if (args.minBedrooms) query = query.gte('bedrooms', args.minBedrooms as number)
      if (args.city) query = query.ilike('city', `%${args.city}%`)

      const { data, error: searchError } = await query.limit(5)
      if (searchError) throw searchError

      await appendMessage(
        supabase,
        businessId,
        conversationId,
        'system',
        `search_listings(${JSON.stringify(args)}) -> ${data?.length ?? 0} result(s)`
      )
      return { listings: data }
    }

    case 'get_listing_details': {
      const { data, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('business_id', businessId)
        .eq('listing_code', args.listingCode as string)
        .maybeSingle()
      if (listingError) throw listingError
      return { listing: data ?? null }
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

    case 'book_viewing': {
      const subscription = await getSubscription(supabase, businessId)
      const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

      const client = await findOrCreateClientByPhone(supabase, businessId, {
        name: args.clientName as string,
        phone: args.clientPhone as string,
        source: clientSource,
      })

      let listingId: string | undefined
      let listingTitle: string | undefined
      if (args.listingCode) {
        const { data: listing } = await supabase
          .from('listings')
          .select('id, title')
          .eq('business_id', businessId)
          .eq('listing_code', args.listingCode as string)
          .maybeSingle()
        listingId = listing?.id
        listingTitle = listing?.title
      }

      const appointment = await createAppointment(supabase, businessId, plan, {
        listingId,
        clientId: client.id,
        conversationId,
        scheduledAt: args.datetime as string,
      })

      await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'booked_viewing' })

      if (client.email) {
        const { data: business } = await supabase.from('businesses').select('name').eq('id', businessId).maybeSingle()
        if (business?.name) {
          void sendAppointmentConfirmationEmail({
            to: client.email,
            clientName: client.name,
            businessName: business.name,
            scheduledAt: appointment.scheduled_at,
            listingTitle,
          }).catch(() => {})
        }
      }

      return { booked: true, appointment }
    }

    case 'capture_lead': {
      const client = await findOrCreateClientByPhone(supabase, businessId, {
        name: args.clientName as string,
        phone: args.clientPhone as string,
        budget: args.budget as number | undefined,
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
