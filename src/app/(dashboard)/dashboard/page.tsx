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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Available Listings" value={available.length} />
        <StatCard label="Conversations Today" value={analytics.conversations_today} />
        <StatCard label="Conversations This Week" value={analytics.conversations_this_week} />
        <StatCard label="Appointments Today" value={analytics.appointments_today} />
        <StatCard label="Appointments This Week" value={analytics.appointments_this_week} />
      </div>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Property Listings</h2>
            <p className="text-sm text-[var(--text-3)]">
              {listings.length} total · {available.length} available
            </p>
          </div>
          <Link href="/dashboard/listings" className="btn-secondary">
            Manage
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
              <p className="text-sm font-semibold mt-1">
                ${listing.price.toLocaleString()}
                {listing.listing_type === 'rent' ? '/mo' : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Viewings</h2>
          <Link href="/dashboard/viewings" className="btn-secondary">
            View All
          </Link>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {appointments.slice(0, 5).map((appt) => (
            <li key={appt.id} className="py-2 flex items-center justify-between text-sm">
              <span>{new Date(appt.scheduled_at).toLocaleString()}</span>
              <span className="capitalize">{appt.status}</span>
            </li>
          ))}
          {appointments.length === 0 && (
            <li className="py-2 text-sm text-[var(--text-3)]">No viewings booked yet.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
