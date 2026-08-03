import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { findOrCreateClientByPhone } from '@/services/clients'
import { createAppointment, BookingLimitError } from '@/services/appointments'
import { sendAppointmentConfirmationEmail } from '@/services/email'
import { appointmentSchema } from '@/validations'
import type { PlanId } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  const body = await request.json()
  const parsed = appointmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const input = parsed.data

  const client = await findOrCreateClientByPhone(supabase, business.id, {
    name: input.clientName,
    phone: input.clientPhone,
    email: input.clientEmail || undefined,
    budget: input.budget,
    preApprovalNumber: input.preApprovalNumber,
    source: 'manual',
  })

  const subscription = await getSubscription(supabase, business.id)
  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  try {
    const appointment = await createAppointment(supabase, business.id, plan, {
      listingId: input.listingId,
      serviceId: input.serviceId,
      clientId: client.id,
      scheduledAt: input.scheduledAt,
      status: input.status,
      notes: input.notes,
    })

    if (appointment.status === 'scheduled' && client.email) {
      void sendAppointmentConfirmationEmail({
        to: client.email,
        clientName: client.name,
        businessName: business.name,
        scheduledAt: appointment.scheduled_at,
      })
    }

    return NextResponse.json({ appointment })
  } catch (err) {
    if (err instanceof BookingLimitError) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    throw err
  }
}
