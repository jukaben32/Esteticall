import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getListingById } from '@/services/listings'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { PropertyDetailView } from '@/components/PropertyDetailView'

export default async function PropertyDetailPage({ params }: { params: { listingId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [listing, agents] = await Promise.all([
    getListingById(supabase, business.id, params.listingId),
    listAgentsForBusiness(supabase, business.id),
  ])

  if (!listing) notFound()

  return <PropertyDetailView initialListing={listing} agents={agents} />
}
