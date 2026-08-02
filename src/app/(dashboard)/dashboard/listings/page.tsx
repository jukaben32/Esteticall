import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listListingsForBusiness } from '@/services/listings'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { ListingsTable } from '@/components/ListingsTable'

export default async function ListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [listings, agents] = await Promise.all([
    listListingsForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])

  const available = listings.filter((l) => l.status === 'available').length
  const pending = listings.filter((l) => l.status === 'pending').length
  const soldOrRented = listings.filter((l) => l.status === 'sold' || l.status === 'rented').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total de propiedades" value={listings.length} />
        <StatCard label="Disponibles" value={available} />
        <StatCard label="Pendientes" value={pending} />
        <StatCard label="Vendidas / rentadas" value={soldOrRented} />
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Propiedades</h1>
            <p className="text-sm text-[var(--text-3)]">
              {listings.length} propiedades · {listings.filter((l) => l.featured).length} destacadas
            </p>
          </div>
        </div>
        <ListingsTable initialListings={listings} agents={agents} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
