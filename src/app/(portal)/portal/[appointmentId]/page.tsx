import { notFound } from 'next/navigation'
import { CheckCircle2, Calendar, Phone, Mail, MapPin, Wallet } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppointmentPublic } from '@/services/appointments'

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Confirmed',
  pending_confirmation: 'Pending confirmation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
}

// Public, unauthenticated — the appointment id in the URL is the access
// token, same as the "View in Client Portal" link in the confirmation email.
export default async function ClientPortalPage({ params }: { params: { appointmentId: string } }) {
  const supabase = createAdminClient()
  const appointment = await getAppointmentPublic(supabase, params.appointmentId)
  if (!appointment) notFound()

  const when = new Date(appointment.scheduled_at).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Santo_Domingo',
  })

  return (
    <main className="min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-8">
      <div className="card-raised w-full max-w-lg overflow-hidden">
        <div className="gradient-teal text-white p-6 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
          <p className="text-lg font-display font-semibold">
            {appointment.status === 'cancelled' ? 'Booking Cancelled' : 'Viewing Confirmed'}
          </p>
          <p className="text-sm opacity-90 mt-1">{appointment.business?.name ?? 'Your appointment'}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-3)]">Status</span>
            <span className="badge">{STATUS_LABEL[appointment.status] ?? appointment.status}</span>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
              <div>
                <p className="text-[var(--text-3)] text-xs">Date &amp; Time</p>
                <p className="font-medium text-[var(--text-1)]">{when}</p>
              </div>
            </div>
            {appointment.service && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
                <div>
                  <p className="text-[var(--text-3)] text-xs">Property / Service</p>
                  <p className="font-medium text-[var(--text-1)]">{appointment.service.name}</p>
                </div>
              </div>
            )}
            {appointment.client?.budget && (
              <div className="flex items-start gap-3">
                <Wallet className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
                <div>
                  <p className="text-[var(--text-3)] text-xs">Budget Range</p>
                  <p className="font-medium text-[var(--text-1)]">${appointment.client.budget.toLocaleString()}</p>
                </div>
              </div>
            )}
            {appointment.business?.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
                <div>
                  <p className="text-[var(--text-3)] text-xs">Agency Location</p>
                  <p className="font-medium text-[var(--text-1)]">{appointment.business.address}</p>
                </div>
              </div>
            )}
            {(appointment.business?.phone || appointment.business?.contact_email) && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
                <div>
                  <p className="text-[var(--text-3)] text-xs">Contact</p>
                  <p className="font-medium text-[var(--text-1)]">
                    {appointment.business?.phone}
                    {appointment.business?.phone && appointment.business?.contact_email ? ' · ' : ''}
                    {appointment.business?.contact_email}
                  </p>
                </div>
              </div>
            )}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 text-[var(--teal-700)]" />
                <div>
                  <p className="text-[var(--text-3)] text-xs">Notes</p>
                  <p className="font-medium text-[var(--text-1)]">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[var(--text-3)] border-t border-[var(--border)] pt-4">
            If you need to reschedule or cancel, please contact us at least 24 hours in advance — or manage it
            yourself from your Client Portal account.
          </p>
          <a href="/portal/signup" className="btn-primary w-full justify-center">
            Create Client Account
          </a>
        </div>
      </div>
    </main>
  )
}
