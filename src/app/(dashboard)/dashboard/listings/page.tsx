import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listListingsForBusiness } from '@/services/listings'
import { ListingsTable } from '@/components/ListingsTable'

export default async function ListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const listings = await listListingsForBusiness(supabase, business.id)

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Propiedades</h1>
          <p className="text-sm text-[var(--text-3)]">
            {listings.length} propiedades · {listings.filter((l) => l.featured).length} destacadas
          </p>
        </div>
      </div>
      <ListingsTable initialListings={listings} />
    </div>
  )
}
