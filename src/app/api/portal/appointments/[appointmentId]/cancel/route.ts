import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedAppointmentForClientUser } from '@/services/clientPortal'
import { updateAppointmentStatus } from '@/services/appointments'
import { sendAppointmentCancelledEmail, sendAppointmentCancelledOwnerEmail } from '@/services/email'
import { portalCancelSchema } from '@/validations'

export async function PATCH(request: Request, { params }: { params: { appointmentId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = portalCancelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const appointment = await getOwnedAppointmentForClientUser(admin, user.id, params.appointmentId)
  if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (appointment.status === 'cancelled') {
    return NextResponse.json({ error: 'Esta cita ya está cancelada' }, { status: 409 })
  }

  const updated = await updateAppointmentStatus(admin, appointment.business_id, params.appointmentId, 'cancelled', {
    cancellationReason: parsed.data.reason,
    cancelledBy: 'client',
  })

  const clientEmail = appointment.client?.email
  const clientName = appointment.client?.name ?? 'Cliente'
  const businessName = appointment.business?.name ?? 'la agencia'
  if (clientEmail) {
    void sendAppointmentCancelledEmail({
      to: clientEmail,
      clientName,
      businessName,
      scheduledAt: appointment.scheduled_at,
      listingTitle: appointment.listing?.title,
      reason: parsed.data.reason,
    }).catch(() => {})
  }
  const ownerEmail = appointment.business?.contact_email
  if (ownerEmail) {
    void sendAppointmentCancelledOwnerEmail({
      to: ownerEmail,
      businessName,
      clientName,
      scheduledAt: appointment.scheduled_at,
      listingTitle: appointment.listing?.title,
      reason: parsed.data.reason,
    }).catch(() => {})
  }

  await admin.from('notifications').insert({
    business_id: appointment.business_id,
    type: 'appointment_cancelled',
    title: 'Cita cancelada por el cliente',
    body: `${clientName} canceló su cita del ${new Date(appointment.scheduled_at).toLocaleString('es-DO', {
      timeZone: 'America/Santo_Domingo',
    })}${parsed.data.reason ? ` — Motivo: ${parsed.data.reason}` : ''}`,
  })

  return NextResponse.json({ appointment: updated })
}
