import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { findOrCreateClientByPhone } from '@/services/clients'
import { getSubscription } from '@/services/businesses'
import { getAssignedListingIds } from '@/services/listings'
import { getAssignedPreventaProjectIds } from '@/services/preventaProjects'
import { appendMessage, recordConversationOutcome } from '@/services/conversations'
import { sendAppointmentConfirmationEmail, sendNewAppointmentOwnerEmail } from '@/services/email'
import type { Client, PlanId } from '@/types'

type DB = SupabaseClient<Database>

// Shared by both transports the AI agent runs over: the OpenAI Realtime relay
// (POST /api/ai/tools, called by the browser widget/voice call) and the
// WhatsApp text-mode agent (src/ai/textAgent.ts, called in-process). Business
// logic — booking a viewing, capturing a lead, etc. — must behave identically
// regardless of which channel the caller used, so it lives here once.
export async function executeAiTool(
  supabase: DB,
  ctx: { conversationId: string; businessId: string; agentId?: string | null; clientSource?: Client['source'] },
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const { conversationId, businessId, agentId, clientSource = 'ai_call' } = ctx

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
      if (args.confoturOnly) query = query.eq('confotur_eligible', true)

      // A specialty portfolio only ranks matches — it never removes one.
      // Fetch a little headroom so, when the agent has a portfolio, its own
      // listings can be sorted first among equally valid results, without
      // ever dropping a real match the caller asked for.
      const assigned = agentId ? await getAssignedListingIds(supabase, businessId, agentId) : null
      const { data, error: searchError } = await query.limit(assigned?.size ? 20 : 5)
      if (searchError) throw searchError
      const results = assigned?.size
        ? [...(data ?? [])].sort((a, b) => Number(assigned.has(b.id)) - Number(assigned.has(a.id))).slice(0, 5)
        : (data ?? [])

      await appendMessage(
        supabase,
        businessId,
        conversationId,
        'system',
        `search_listings(${JSON.stringify(args)}) -> ${results.length} result(s)`
      )
      return { listings: results }
    }

    case 'get_listing_details': {
      // A caller naming a specific listing_code is a specific, real
      // inquiry — always answer it in full, regardless of which agent's
      // specialty portfolio it falls under. See buildSystemPrompt for why.
      const { data, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('business_id', businessId)
        .eq('listing_code', args.listingCode as string)
        .maybeSingle()
      if (listingError) throw listingError
      return { listing: data ?? null }
    }

    case 'calculate_roi': {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('listing_code, title, listing_type, price, rental_period')
        .eq('business_id', businessId)
        .eq('listing_code', args.listingCode as string)
        .maybeSingle()
      if (listingError) throw listingError
      if (!listing) return { error: 'Listing not found' }
      if (listing.listing_type !== 'vacation_rental') {
        return { error: 'ROI can only be calculated for vacation_rental listings' }
      }

      const purchasePrice = args.purchasePrice as number
      if (!purchasePrice || purchasePrice <= 0) {
        return { error: 'purchasePrice must be a positive number' }
      }

      const PERIODS_PER_YEAR: Record<string, number> = { night: 365, week: 52, month: 12 }
      const periodsPerYear = listing.rental_period ? PERIODS_PER_YEAR[listing.rental_period] : undefined
      if (!periodsPerYear) return { error: 'This listing has no rental_period set — cannot annualize its rate' }

      // Both assumptions are deliberately conservative, and always echoed back
      // in the result so the caller (and buildSystemPrompt's instruction) can
      // state them explicitly instead of presenting the ROI as a guaranteed
      // number — the caller only ever gave us a purchase price, the rest is
      // this tool's own estimate, not fact.
      const DEFAULT_OCCUPANCY_PCT = 65
      const DEFAULT_EXPENSES_PCT = 25
      const occupancyPct = Math.min(100, Math.max(0, (args.occupancyPct as number) ?? DEFAULT_OCCUPANCY_PCT))
      const expensesPct = Math.min(100, Math.max(0, (args.annualExpensesPct as number) ?? DEFAULT_EXPENSES_PCT))

      const grossAnnualRevenue = listing.price * periodsPerYear * (occupancyPct / 100)
      const netAnnualRevenue = grossAnnualRevenue * (1 - expensesPct / 100)

      return {
        listingCode: listing.listing_code,
        purchasePrice,
        assumptions: { occupancyPct, annualExpensesPct: expensesPct },
        grossAnnualRevenue: Math.round(grossAnnualRevenue),
        netAnnualRevenue: Math.round(netAnnualRevenue),
        grossRoiPercent: Math.round((grossAnnualRevenue / purchasePrice) * 1000) / 10,
        netRoiPercent: Math.round((netAnnualRevenue / purchasePrice) * 1000) / 10,
      }
    }

    case 'search_presale_projects': {
      let query = supabase
        .from('preventa_projects')
        .select('*, preventa_unit_types(*)')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .eq('visible_to_ai_agent', true)

      if (args.city) query = query.ilike('city', `%${args.city}%`)
      if (args.phase && args.phase !== 'any') {
        query = query.eq('phase', args.phase as 'lanzamiento' | 'en_construccion' | 'entrega')
      }

      const { data, error: searchError } = await query
      if (searchError) throw searchError
      const projectRows = (data ?? []) as unknown as (Database['public']['Tables']['preventa_projects']['Row'] & {
        preventa_unit_types: { price: number; bedrooms: number }[] | null
      })[]

      // maxPrice/minBedrooms describe a unit type within the project, not the
      // project row itself — a project matches if any of its unit types does.
      const maxPrice = args.maxPrice as number | undefined
      const minBedrooms = args.minBedrooms as number | undefined
      const matched = projectRows.filter((p) => {
        const unitTypes = p.preventa_unit_types ?? []
        if (!unitTypes.length) return !maxPrice && !minBedrooms
        return unitTypes.some(
          (u) => (!maxPrice || u.price <= maxPrice) && (!minBedrooms || u.bedrooms >= minBedrooms)
        )
      })

      const assigned = agentId ? await getAssignedPreventaProjectIds(supabase, businessId, agentId) : null
      const results = assigned?.size
        ? [...matched].sort((a, b) => Number(assigned.has(b.id)) - Number(assigned.has(a.id))).slice(0, 5)
        : matched.slice(0, 5)

      await appendMessage(
        supabase,
        businessId,
        conversationId,
        'system',
        `search_presale_projects(${JSON.stringify(args)}) -> ${results.length} result(s)`
      )
      return { projects: results }
    }

    case 'get_presale_project_details': {
      // Same rule as get_listing_details: a caller naming a specific project
      // code is a real inquiry — always answer in full regardless of agent.
      const { data, error: projectError } = await supabase
        .from('preventa_projects')
        .select('*, preventa_unit_types(*)')
        .eq('business_id', businessId)
        .eq('project_code', args.projectCode as string)
        .maybeSingle()
      if (projectError) throw projectError
      return { project: data ?? null }
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
          listingTitle,
        }).catch(() => {})
      }

      if (business?.contact_email && business?.name) {
        void sendNewAppointmentOwnerEmail({
          to: business.contact_email,
          businessName: business.name,
          clientName: client.name,
          clientPhone: client.phone ?? undefined,
          clientEmail: client.email ?? undefined,
          serviceName: listingTitle,
          scheduledAt: appointment.scheduled_at,
        }).catch(() => {})
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
