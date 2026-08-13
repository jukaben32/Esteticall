import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedAppointmentForClientUser } from '@/services/clientPortal'

// Card payments for a viewing/consultation go straight to the BUSINESS's own
// Stripe account (business.stripe_secret_key, set from /dashboard/settings —
// StripePaymentsForm), never the platform's STRIPE_SECRET_KEY, which is only
// ever used for SaaS subscription billing. Each business is its own Stripe
// merchant here, so this session is created with their key.
export async function POST(request: Request, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const appointment = await getOwnedAppointmentForClientUser(admin, user.id, params.appointmentId)
  if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (appointment.payment_status !== 'pending') {
    return NextResponse.json({ error: 'Esta cita no tiene un pago pendiente' }, { status: 409 })
  }

  const { data: business } = await admin
    .from('businesses')
    .select('stripe_secret_key, stripe_connected, name')
    .eq('id', appointment.business_id)
    .maybeSingle()
  if (!business?.stripe_connected || !business.stripe_secret_key) {
    return NextResponse.json({ error: 'Esta agencia todavía no acepta pagos en línea' }, { status: 409 })
  }

  const amount = appointment.payment_amount
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'No hay un monto definido para esta cita' }, { status: 409 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const stripe = new Stripe(business.stripe_secret_key)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: appointment.payment_currency || 'usd',
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: appointment.service?.name ?? `Cita con ${business.name}`,
          },
        },
      },
    ],
    metadata: { appointmentId: params.appointmentId },
    success_url: `${appUrl}/portal?paid=${params.appointmentId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/portal`,
  })

  await admin
    .from('appointments')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', params.appointmentId)

  return NextResponse.json({ url: session.url })
}
