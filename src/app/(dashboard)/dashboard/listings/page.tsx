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
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-semibold text-lg">Property Listings</h1>
          <p className="text-sm text-[var(--text-3)]">
            {listings.length} listings · {listings.filter((l) => l.featured).length} featured
          </p>
        </div>
      </div>
      <ListingsTable initialListings={listings} />
    </div>
  )
}
