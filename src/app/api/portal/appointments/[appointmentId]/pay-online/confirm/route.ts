import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedAppointmentForClientUser } from '@/services/clientPortal'
import { updateAppointmentPayment } from '@/services/appointments'
import { sendAppointmentPaidClientEmail, sendAppointmentPaidOwnerEmail } from '@/services/email'

// There's no per-business Stripe webhook set up (each business has its own
// account, and the platform only has one webhook endpoint wired to its own
// account for subscriptions) — so instead of a webhook, the success_url
// redirect itself hands back the session id and this route verifies it
// server-side against the business's own Stripe account before trusting it.
// Idempotent: re-hitting this with an already-confirmed session is a no-op,
// not a duplicate charge or duplicate email — the checkout already happened,
// this route only records that fact.
export async function POST(request: Request, { params }: { params: { appointmentId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null
  if (!sessionId) return NextResponse.json({ error: 'Falta el identificador de la sesión de pago' }, { status: 400 })

  const admin = createAdminClient()
  const appointment = await getOwnedAppointmentForClientUser(admin, user.id, params.appointmentId)
  if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })

  if (appointment.payment_status === 'paid') {
    return NextResponse.json({ appointment })
  }
  if (appointment.stripe_checkout_session_id !== sessionId) {
    return NextResponse.json({ error: 'Esta sesión de pago no corresponde a esta cita' }, { status: 409 })
  }

  const { data: business } = await admin
    .from('businesses')
    .select('stripe_secret_key, name')
    .eq('id', appointment.business_id)
    .maybeSingle()
  if (!business?.stripe_secret_key) {
    return NextResponse.json({ error: 'Esta agencia ya no tiene pagos en línea configurados' }, { status: 409 })
  }

  const stripe = new Stripe(business.stripe_secret_key)
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.metadata?.appointmentId !== params.appointmentId || session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'El pago todavía no se ha completado' }, { status: 409 })
  }

  const updated = await updateAppointmentPayment(admin, appointment.business_id, params.appointmentId, 'paid')
  await admin
    .from('appointments')
    .update({ stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null })
    .eq('id', params.appointmentId)

  const clientEmail = appointment.client?.email
  const clientName = appointment.client?.name ?? 'Cliente'
  const businessName = appointment.business?.name ?? business.name ?? 'la agencia'
  const ownerEmail = appointment.business?.contact_email
  const amount = appointment.payment_amount ?? 0
  if (clientEmail) {
    void sendAppointmentPaidClientEmail({
      to: clientEmail,
      clientName,
      businessName,
      method: 'card',
      amount,
      scheduledAt: appointment.scheduled_at,
    }).catch(() => {})
  }
  if (ownerEmail) {
    void sendAppointmentPaidOwnerEmail({
      to: ownerEmail,
      businessName,
      clientName,
      method: 'card',
      amount,
      scheduledAt: appointment.scheduled_at,
    }).catch(() => {})
  }

  await admin.from('notifications').insert({
    business_id: appointment.business_id,
    type: 'system',
    title: 'Pago en línea recibido',
    body: `${clientName} pagó en línea — $${amount.toLocaleString()}`,
  })

  return NextResponse.json({ appointment: updated })
}
