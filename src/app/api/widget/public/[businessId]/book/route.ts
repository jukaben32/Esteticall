import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessById, getSubscription } from '@/services/businesses'
import { findOrCreateClientByPhone } from '@/services/clients'
import { createAppointment, BookingLimitError } from '@/services/appointments'
import { listServicesForBusiness } from '@/services/businessServices'
import { sendNewAppointmentOwnerEmail, sendPublicBookingConfirmationEmail } from '@/services/email'
import { publicBookingSchema } from '@/validations'
import type { PlanId } from '@/types'

export const dynamic = 'force-dynamic'

// Public, unauthenticated: the final step of the "Book" tab in the floating
// widget (public site + embed script). Mirrors POST /api/appointments but
// scoped by businessId in the URL instead of an authenticated session, and
// fires both confirmation emails (client + business owner) synchronously so
// the widget's "Viewing Requested" screen only shows once they're queued.
export async function POST(request: Request, props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = createAdminClient()
  const business = await getBusinessById(supabase, params.businessId)
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const body = await request.json().catch(() => null)
  const parsed = publicBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const input = parsed.data

  const client = await findOrCreateClientByPhone(supabase, business.id, {
    name: input.clientName,
    phone: input.clientPhone,
    email: input.clientEmail,
    budget: input.budget ? Number(input.budget.replace(/[^0-9.]/g, '')) || undefined : undefined,
    source: 'website_form',
  })

  const subscription = await getSubscription(supabase, business.id)
  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  let service = null
  if (input.serviceId) {
    const services = await listServicesForBusiness(supabase, business.id)
    service = services.find((s) => s.id === input.serviceId) ?? null
  }

  try {
    const appointment = await createAppointment(supabase, business.id, plan, {
      serviceId: input.serviceId ?? undefined,
      listingId: input.listingId ?? undefined,
      clientId: client.id,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
      notes: input.notes,
    })

    void sendPublicBookingConfirmationEmail({
      to: input.clientEmail,
      clientName: input.clientName,
      businessName: business.name,
      serviceName: service?.name,
      scheduledAt: appointment.scheduled_at,
      budget: input.budget,
      businessAddress: business.address ?? undefined,
      businessPhone: business.phone ?? undefined,
      businessContactEmail: business.contact_email ?? undefined,
      appointmentId: appointment.id,
    }).catch(() => {})

    if (business.contact_email) {
      void sendNewAppointmentOwnerEmail({
        to: business.contact_email,
        businessName: business.name,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        serviceName: service?.name,
        scheduledAt: appointment.scheduled_at,
      }).catch(() => {})
    }

    return NextResponse.json({ appointment })
  } catch (err) {
    if (err instanceof BookingLimitError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    throw err
  }
}
