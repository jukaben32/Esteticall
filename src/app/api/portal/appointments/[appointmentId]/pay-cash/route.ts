import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedAppointmentForClientUser } from '@/services/clientPortal'
import { updateAppointmentPayment } from '@/services/appointments'
import { sendAppointmentPaidClientEmail, sendAppointmentPaidOwnerEmail } from '@/services/email'

// The client self-declaring "I'll pay in cash at the agency" — same
// end state (payment_status: 'cash') the business side already sets from
// /dashboard/citas, just triggered from the other side of the booking.
export async function POST(_request: Request, props: { params: Promise<{ appointmentId: string }> }) {
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

  const updated = await updateAppointmentPayment(admin, appointment.business_id, params.appointmentId, 'cash')

  const clientEmail = appointment.client?.email
  const clientName = appointment.client?.name ?? 'Cliente'
  const businessName = appointment.business?.name ?? 'la agencia'
  const ownerEmail = appointment.business?.contact_email
  const amount = appointment.payment_amount ?? 0
  if (clientEmail) {
    void sendAppointmentPaidClientEmail({
      to: clientEmail,
      clientName,
      businessName,
      method: 'cash',
      amount,
      scheduledAt: appointment.scheduled_at,
    }).catch(() => {})
  }
  if (ownerEmail) {
    void sendAppointmentPaidOwnerEmail({
      to: ownerEmail,
      businessName,
      clientName,
      method: 'cash',
      amount,
      scheduledAt: appointment.scheduled_at,
    }).catch(() => {})
  }

  await admin.from('notifications').insert({
    business_id: appointment.business_id,
    type: 'system',
    title: 'Pago en efectivo registrado',
    body: `${clientName} indicó que pagará en efectivo en la agencia — $${amount.toLocaleString()}`,
  })

  return NextResponse.json({ appointment: updated })
}
