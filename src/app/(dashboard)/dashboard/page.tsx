import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getDashboardAnalytics } from '@/services/businesses'
import { listListingsForBusiness } from '@/services/listings'
import { listAppointmentsForBusiness } from '@/services/appointments'

export default async function OverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [analytics, listings, appointments] = await Promise.all([
    getDashboardAnalytics(supabase, business.id),
    listListingsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
  ])

  const available = listings.filter((l) => l.status === 'available')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-1)]">Inicio</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Datos en vivo de {business.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Propiedades disponibles" value={available.length} />
        <StatCard label="Conversaciones hoy" value={analytics.conversations_today} />
        <StatCard label="Conversaciones esta semana" value={analytics.conversations_this_week} />
        <StatCard label="Citas hoy" value={analytics.appointments_today} />
        <StatCard label="Citas esta semana" value={analytics.appointments_this_week} />
      </div>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Propiedades</h2>
            <p className="text-sm text-[var(--text-3)]">
              {listings.length} en total · {available.length} disponibles
            </p>
          </div>
          <Link href="/dashboard/listings" className="btn-secondary">
            Administrar
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listings.slice(0, 4).map((listing) => (
            <div key={listing.id} className="card-surface p-3">
              {listing.cover_photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.cover_photo_url}
                  alt={listing.title}
                  className="rounded-lg mb-2 aspect-video object-cover w-full"
                />
              )}
              <p className="text-sm font-medium truncate">{listing.title}</p>
              <p className="text-xs text-[var(--text-3)]">{listing.city ?? listing.area_name}</p>
              <p className="text-sm font-semibold mt-1 text-[var(--teal-700)]">
                ${listing.price.toLocaleString()}
                {listing.listing_type === 'rent' ? '/mes' : ''}
              </p>
            </div>
          ))}
          {listings.length === 0 && (
            <p className="col-span-full text-sm text-[var(--text-3)]">Todavía no hay propiedades.</p>
          )}
        </div>
      </section>

      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-[var(--text-1)]">Próximas citas</h2>
          <Link href="/dashboard/viewings" className="btn-secondary">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {appointments.slice(0, 5).map((appt) => (
            <li key={appt.id} className="py-3 flex items-center justify-between text-sm">
              <span className="text-[var(--text-1)]">{new Date(appt.scheduled_at).toLocaleString('es-DO')}</span>
              <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)] capitalize">
                {STATUS_LABELS[appt.status] ?? appt.status}
              </span>
            </li>
          ))}
          {appointments.length === 0 && (
            <li className="py-2 text-sm text-[var(--text-3)]">Todavía no hay citas agendadas.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
