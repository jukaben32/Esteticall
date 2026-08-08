import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AiAgent, Listing, ListingPhoto, ListingWithPhotos } from '@/types'
import type { ListingInput } from '@/validations'

type DB = SupabaseClient<Database>

type ListingJoinRow = Listing & {
  listing_photos: ListingPhoto[] | null
  agent_listings: { ai_agents: Pick<AiAgent, 'id' | 'name' | 'specialty' | 'status'> | null }[] | null
}

function mapListingRow(row: ListingJoinRow): ListingWithPhotos {
  return {
    ...row,
    photos: row.listing_photos ?? [],
    agents: (row.agent_listings ?? [])
      .map((al) => al.ai_agents)
      .filter((a): a is NonNullable<typeof a> => Boolean(a)),
  }
}

export async function listListingsForBusiness(
  supabase: DB,
  businessId: string,
  filters?: { status?: Listing['status'] | 'all'; search?: string }
): Promise<ListingWithPhotos[]> {
  let query = supabase
    .from('listings')
    .select('*, listing_photos(*), agent_listings(ai_agents(id, name, specialty, status))')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,address_line.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as unknown as ListingJoinRow[]).map(mapListingRow)
}

export async function getListingById(
  supabase: DB,
  businessId: string,
  listingId: string
): Promise<ListingWithPhotos | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, listing_photos(*), agent_listings(ai_agents(id, name, specialty, status))')
    .eq('business_id', businessId)
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return mapListingRow(data as unknown as ListingJoinRow)
}

// Listings the AI agent is allowed to discuss on a call — feeds the Realtime
// system prompt and the `search_listings` tool the model can invoke.
export async function listAiVisibleListings(supabase: DB, businessId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'available')
    .eq('visible_to_ai_agent', true)
  if (error) throw error
  return data ?? []
}

export async function createListing(
  supabase: DB,
  businessId: string,
  input: ListingInput
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      business_id: businessId,
      title: input.title,
      description: input.description,
      listing_type: input.listingType,
      property_type: input.propertyType,
      status: input.status,
      price: input.price,
      currency: input.currency,
      price_display: input.priceDisplay,
      confotur_eligible: input.confoturEligible,
      delivery_date: input.deliveryDate || null,
      rental_period: input.listingType === 'vacation_rental' ? input.rentalPeriod ?? null : null,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area_sqft: input.areaSqft,
      parking_spaces: input.parkingSpaces,
      year_built: input.yearBuilt,
      address_line: input.addressLine,
      area_name: input.areaName,
      city: input.city,
      state: input.state,
      zip: input.zip,
      amenities: input.amenities,
      featured: input.featured,
      visible_to_ai_agent: input.visibleToAiAgent,
      virtual_tour_url: input.virtualTourUrl || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateListing(
  supabase: DB,
  businessId: string,
  listingId: string,
  patch: Partial<Listing>
): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', listingId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteListing(supabase: DB, businessId: string, listingId: string) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('business_id', businessId)
    .eq('id', listingId)
  if (error) throw error
}

// El schema soporta varios agentes por listing (agent_listings es N:M), pero
// la UI (como el video de referencia) usa un selector único por propiedad —
// se borra cualquier asignación previa antes de insertar la nueva, para que
// el dropdown de "un solo agente" no deje filas huérfanas.
export async function assignAgentToListing(
  supabase: DB,
  businessId: string,
  listingId: string,
  agentId: string
) {
  await supabase.from('agent_listings').delete().eq('business_id', businessId).eq('listing_id', listingId)
  const { error } = await supabase
    .from('agent_listings')
    .insert({ business_id: businessId, listing_id: listingId, agent_id: agentId })
  if (error) throw error
}

export async function unassignAgentFromListing(supabase: DB, businessId: string, listingId: string) {
  const { error } = await supabase
    .from('agent_listings')
    .delete()
    .eq('business_id', businessId)
    .eq('listing_id', listingId)
  if (error) throw error
}

export async function deleteListingPhoto(supabase: DB, businessId: string, photoId: string) {
  const { data: photo, error: fetchError } = await supabase
    .from('listing_photos')
    .select('id, listing_id, is_cover')
    .eq('id', photoId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!photo) return

  const { error: deleteError } = await supabase
    .from('listing_photos')
    .delete()
    .eq('id', photoId)
    .eq('business_id', businessId)
  if (deleteError) throw deleteError

  if (photo.is_cover) {
    const { data: nextCover } = await supabase
      .from('listing_photos')
      .select('id, url')
      .eq('listing_id', photo.listing_id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextCover) {
      await supabase.from('listing_photos').update({ is_cover: true }).eq('id', nextCover.id)
    }
    await supabase
      .from('listings')
      .update({ cover_photo_url: nextCover?.url ?? null })
      .eq('id', photo.listing_id)
  }
}

export async function setListingCoverPhoto(supabase: DB, businessId: string, listingId: string, photoId: string) {
  const { data: photo, error: fetchError } = await supabase
    .from('listing_photos')
    .select('id, url')
    .eq('id', photoId)
    .eq('listing_id', listingId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!photo) throw new Error('Foto no encontrada')

  await supabase.from('listing_photos').update({ is_cover: false }).eq('listing_id', listingId)
  await supabase.from('listing_photos').update({ is_cover: true }).eq('id', photoId)
  const { error: updateError } = await supabase
    .from('listings')
    .update({ cover_photo_url: photo.url })
    .eq('id', listingId)
  if (updateError) throw updateError
}
