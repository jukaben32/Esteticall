import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { AiAgent, PreventaProject, PreventaProjectPhoto, PreventaProjectWithDetails, PreventaUnitType } from '@/types'
import type { PreventaProjectInput, PreventaUnitTypeInput } from '@/validations'

type DB = SupabaseClient<Database>

type PreventaProjectJoinRow = PreventaProject & {
  preventa_unit_types: PreventaUnitType[] | null
  preventa_project_photos: PreventaProjectPhoto[] | null
  preventa_project_agents: { ai_agents: Pick<AiAgent, 'id' | 'name' | 'specialty' | 'status'> | null }[] | null
}

function mapProjectRow(row: PreventaProjectJoinRow): PreventaProjectWithDetails {
  return {
    ...row,
    unitTypes: (row.preventa_unit_types ?? []).sort((a, b) => a.sort_order - b.sort_order),
    photos: row.preventa_project_photos ?? [],
    agents: (row.preventa_project_agents ?? [])
      .map((pa) => pa.ai_agents)
      .filter((a): a is NonNullable<typeof a> => Boolean(a)),
  }
}

const PROJECT_SELECT =
  '*, preventa_unit_types(*), preventa_project_photos(*), preventa_project_agents(ai_agents(id, name, specialty, status))'

export async function listPreventaProjectsForBusiness(
  supabase: DB,
  businessId: string,
  filters?: { status?: PreventaProject['status'] | 'all'; search?: string }
): Promise<PreventaProjectWithDetails[]> {
  let query = supabase
    .from('preventa_projects')
    .select(PROJECT_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,area_name.ilike.%${filters.search}%,city.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as PreventaProjectJoinRow[]).map(mapProjectRow)
}

export async function getPreventaProjectById(
  supabase: DB,
  businessId: string,
  projectId: string
): Promise<PreventaProjectWithDetails | null> {
  const { data, error } = await supabase
    .from('preventa_projects')
    .select(PROJECT_SELECT)
    .eq('business_id', businessId)
    .eq('id', projectId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapProjectRow(data as unknown as PreventaProjectJoinRow)
}

// Same ranking-only semantics as getAssignedListingIds in listings.ts: an
// assignment means an agent leads with this project when browsing is
// unprompted, never that other agents must hide or deny it exists.
export async function getAssignedPreventaProjectIds(
  supabase: DB,
  businessId: string,
  agentId: string
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('preventa_project_agents')
    .select('project_id')
    .eq('business_id', businessId)
    .eq('agent_id', agentId)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.project_id))
}

export async function listAiVisiblePreventaProjects(
  supabase: DB,
  businessId: string,
  agentId?: string | null
): Promise<PreventaProjectWithDetails[]> {
  const { data, error } = await supabase
    .from('preventa_projects')
    .select(PROJECT_SELECT)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .eq('visible_to_ai_agent', true)
  if (error) throw error
  const projects = ((data ?? []) as unknown as PreventaProjectJoinRow[]).map(mapProjectRow)
  if (!agentId) return projects

  const assigned = await getAssignedPreventaProjectIds(supabase, businessId, agentId)
  if (!assigned.size) return projects
  return [...projects].sort((a, b) => Number(assigned.has(b.id)) - Number(assigned.has(a.id)))
}

export async function createPreventaProject(
  supabase: DB,
  businessId: string,
  input: PreventaProjectInput
): Promise<PreventaProject> {
  const { data, error } = await supabase
    .from('preventa_projects')
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      phase: input.phase,
      status: input.status,
      developer_name: input.developerName || null,
      address_line: input.addressLine || null,
      area_name: input.areaName || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      delivery_date: input.deliveryDate || null,
      reservation_amount: input.reservationAmount || null,
      reservation_currency: input.reservationCurrency,
      down_payment_pct: input.downPaymentPct || null,
      financing_notes: input.financingNotes || null,
      finishes_description: input.finishesDescription || null,
      amenities: input.amenities,
      promo_video_url: input.promoVideoUrl || null,
      virtual_tour_url: input.virtualTourUrl || null,
      featured: input.featured,
      visible_to_ai_agent: input.visibleToAiAgent,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePreventaProject(
  supabase: DB,
  businessId: string,
  projectId: string,
  patch: Partial<PreventaProject>
): Promise<PreventaProject> {
  const { data, error } = await supabase
    .from('preventa_projects')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', projectId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePreventaProject(supabase: DB, businessId: string, projectId: string) {
  const { error } = await supabase.from('preventa_projects').delete().eq('business_id', businessId).eq('id', projectId)
  if (error) throw error
}

export async function createPreventaUnitType(
  supabase: DB,
  businessId: string,
  projectId: string,
  input: PreventaUnitTypeInput
): Promise<PreventaUnitType> {
  const { data, error } = await supabase
    .from('preventa_unit_types')
    .insert({
      project_id: projectId,
      business_id: businessId,
      name: input.name,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area_sqft: input.areaSqft,
      parking_spaces: input.parkingSpaces,
      price: input.price,
      currency: input.currency,
      price_display: input.priceDisplay,
      notes: input.notes || null,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePreventaUnitType(
  supabase: DB,
  businessId: string,
  unitTypeId: string,
  patch: Partial<PreventaUnitType>
): Promise<PreventaUnitType> {
  const { data, error } = await supabase
    .from('preventa_unit_types')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', unitTypeId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deletePreventaUnitType(supabase: DB, businessId: string, unitTypeId: string) {
  const { error } = await supabase
    .from('preventa_unit_types')
    .delete()
    .eq('business_id', businessId)
    .eq('id', unitTypeId)
  if (error) throw error
}

// El schema soporta varios agentes por proyecto (N:M), pero la UI usa un
// selector unico — se borra cualquier asignacion previa antes de insertar,
// igual que assignAgentToListing en listings.ts.
export async function assignAgentToPreventaProject(
  supabase: DB,
  businessId: string,
  projectId: string,
  agentId: string
) {
  await supabase.from('preventa_project_agents').delete().eq('business_id', businessId).eq('project_id', projectId)
  const { error } = await supabase
    .from('preventa_project_agents')
    .insert({ business_id: businessId, project_id: projectId, agent_id: agentId })
  if (error) throw error
}

export async function unassignAgentFromPreventaProject(supabase: DB, businessId: string, projectId: string) {
  const { error } = await supabase
    .from('preventa_project_agents')
    .delete()
    .eq('business_id', businessId)
    .eq('project_id', projectId)
  if (error) throw error
}

export async function deletePreventaProjectPhoto(supabase: DB, businessId: string, photoId: string) {
  const { data: photo, error: fetchError } = await supabase
    .from('preventa_project_photos')
    .select('id, project_id, is_cover')
    .eq('id', photoId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!photo) return

  const { error: deleteError } = await supabase
    .from('preventa_project_photos')
    .delete()
    .eq('id', photoId)
    .eq('business_id', businessId)
  if (deleteError) throw deleteError

  if (photo.is_cover) {
    const { data: nextCover } = await supabase
      .from('preventa_project_photos')
      .select('id, url')
      .eq('project_id', photo.project_id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextCover) {
      await supabase.from('preventa_project_photos').update({ is_cover: true }).eq('id', nextCover.id)
    }
    await supabase
      .from('preventa_projects')
      .update({ cover_photo_url: nextCover?.url ?? null })
      .eq('id', photo.project_id)
  }
}

export async function setPreventaProjectCoverPhoto(
  supabase: DB,
  businessId: string,
  projectId: string,
  photoId: string
) {
  const { data: photo, error: fetchError } = await supabase
    .from('preventa_project_photos')
    .select('id, url')
    .eq('id', photoId)
    .eq('project_id', projectId)
    .eq('business_id', businessId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!photo) throw new Error('Foto no encontrada')

  await supabase.from('preventa_project_photos').update({ is_cover: false }).eq('project_id', projectId)
  await supabase.from('preventa_project_photos').update({ is_cover: true }).eq('id', photoId)
  const { error: updateError } = await supabase
    .from('preventa_projects')
    .update({ cover_photo_url: photo.url })
    .eq('id', projectId)
  if (updateError) throw updateError
}
