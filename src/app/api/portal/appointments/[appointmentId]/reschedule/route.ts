import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedAppointmentForClientUser } from '@/services/clientPortal'
import { updateAppointment } from '@/services/appointments'
import { sendAppointmentRescheduleRequestedEmail, sendAppointmentRescheduleReceivedEmail } from '@/services/email'
import { portalRescheduleSchema } from '@/validations'

// Reschedules go to 'pending_confirmation', not straight to the new time —
// matches the reference video: the business has to confirm it (by setting
// the status back to 'scheduled' from /dashboard/citas, which already
// emails the client) before it's final.
export async function PATCH(request: Request, props: { params: Promise<{ appointmentId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json()
  const parsed = portalRescheduleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const appointment = await getOwnedAppointmentForClientUser(admin, user.id, params.appointmentId)
  if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    return NextResponse.json({ error: 'Esta cita ya no se puede reprogramar' }, { status: 409 })
  }

  const previousScheduledAt = appointment.scheduled_at
  const updated = await updateAppointment(admin, appointment.business_id, params.appointmentId, {
    scheduled_at: parsed.data.scheduledAt,
    status: 'pending_confirmation',
    rescheduled_from: previousScheduledAt,
    reschedule_requested_at: new Date().toISOString(),
  })

  const businessEmail = appointment.business?.contact_email
  const clientEmail = appointment.client?.email
  const clientName = appointment.client?.name ?? 'Cliente'
  const businessName = appointment.business?.name ?? 'la agencia'
  if (businessEmail) {
    void sendAppointmentRescheduleRequestedEmail({
      to: businessEmail,
      businessName,
      clientName,
      previousScheduledAt,
      requestedScheduledAt: updated.scheduled_at,
    }).catch(() => {})
  }
  if (clientEmail) {
    void sendAppointmentRescheduleReceivedEmail({
      to: clientEmail,
      clientName,
      businessName,
      requestedScheduledAt: updated.scheduled_at,
    }).catch(() => {})
  }

  await admin.from('notifications').insert({
    business_id: appointment.business_id,
    type: 'system',
    title: 'Reprogramación solicitada por el cliente',
    body: `${clientName} solicitó mover su cita al ${new Date(updated.scheduled_at).toLocaleString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    })}`,
  })

  return NextResponse.json({ appointment: updated })
}
