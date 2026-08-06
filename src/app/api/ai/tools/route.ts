import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots, createAppointment } from '@/services/appointments'
import { findOrCreateClientByPhone } from '@/services/clients'
import { getSubscription } from '@/services/businesses'
import { appendMessage, recordConversationOutcome } from '@/services/conversations'
import { sendAppointmentConfirmationEmail } from '@/services/email'
import type { PlanId } from '@/types'

// Single relay endpoint for every OpenAI Realtime function call. The browser
// never talks to Supabase directly — it only knows a conversationId, and this
// route resolves conversationId -> business_id server-side (admin client)
// before touching any tenant data, so a caller can't spoof another business.
export async function POST(request: Request) {
  const { conversationId, name, arguments: args } = await request.json()
  const supabase = createAdminClient()

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  if (error || !conversation) {
    return NextResponse.json({ error: 'Unknown conversation' }, { status: 404 })
  }

  const businessId = conversation.business_id

  try {
    switch (name) {
      case 'search_listings': {
        let query = supabase
          .from('listings')
          .select('*')
          .eq('business_id', businessId)
          .eq('status', 'available')
          .eq('visible_to_ai_agent', true)

        if (args.listingType && args.listingType !== 'any') query = query.eq('listing_type', args.listingType)
        if (args.maxPrice) query = query.lte('price', args.maxPrice)
        if (args.minBedrooms) query = query.gte('bedrooms', args.minBedrooms)
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
        return NextResponse.json({ listings: data })
      }

      case 'get_listing_details': {
        const { data, error: listingError } = await supabase
          .from('listings')
          .select('*')
          .eq('business_id', businessId)
          .eq('listing_code', args.listingCode)
          .maybeSingle()
        if (listingError) throw listingError
        return NextResponse.json({ listing: data ?? null })
      }

      case 'check_availability': {
        const slots = await getAvailableSlots(supabase, businessId, {
          fromDate: args.preferredDate ? new Date(args.preferredDate) : undefined,
        })
        return NextResponse.json({ slots: slots.slice(0, 10) })
      }

      case 'book_viewing': {
        const subscription = await getSubscription(supabase, businessId)
        const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

        const client = await findOrCreateClientByPhone(supabase, businessId, {
          name: args.clientName,
          phone: args.clientPhone,
          source: 'ai_call',
        })

        let listingId: string | undefined
        let listingTitle: string | undefined
        if (args.listingCode) {
          const { data: listing } = await supabase
            .from('listings')
            .select('id, title')
            .eq('business_id', businessId)
            .eq('listing_code', args.listingCode)
            .maybeSingle()
          listingId = listing?.id
          listingTitle = listing?.title
        }

        const appointment = await createAppointment(supabase, businessId, plan, {
          listingId,
          clientId: client.id,
          conversationId,
          scheduledAt: args.datetime,
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

        return NextResponse.json({ booked: true, appointment })
      }

      case 'capture_lead': {
        const client = await findOrCreateClientByPhone(supabase, businessId, {
          name: args.clientName,
          phone: args.clientPhone,
          budget: args.budget,
          source: 'ai_call',
        })

        await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'qualified_lead' })

        return NextResponse.json({ captured: true, clientId: client.id })
      }

      case 'request_callback': {
        const client = await findOrCreateClientByPhone(supabase, businessId, {
          name: args.clientName,
          phone: args.clientPhone,
          source: 'ai_call',
        })

        // 'escalated' is the outcome the dashboard's "Callbacks solicitados" stat
        // counts — see recordConversationOutcome / OUTCOME_RANK.
        await recordConversationOutcome(supabase, conversationId, { clientId: client.id, outcome: 'escalated' })

        const bodyParts = [client.phone ? `Tel: ${client.phone}` : null, args.reason ?? null, args.preferredTime ? `Prefiere: ${args.preferredTime}` : null]
        await supabase.from('notifications').insert({
          business_id: businessId,
          type: 'system',
          title: `Callback solicitado — ${client.name}`,
          body: bodyParts.filter(Boolean).join(' · ') || null,
        })

        return NextResponse.json({ requested: true, clientId: client.id })
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${name}` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed'
    // The AI just apologizes and moves on when a tool call fails, so without
    // this the failure is invisible everywhere — nothing else logs it.
    console.error(`[ai/tools] ${name} failed for conversation ${conversationId}:`, err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
