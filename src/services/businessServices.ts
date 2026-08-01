import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BusinessService } from '@/types'
import type { BusinessServiceInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function listServicesForBusiness(
  supabase: DB,
  businessId: string
): Promise<BusinessService[]> {
  const { data, error } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createService(
  supabase: DB,
  businessId: string,
  input: BusinessServiceInput
): Promise<BusinessService> {
  const { data, error } = await supabase
    .from('business_services')
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      price: input.price ?? null,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateService(
  supabase: DB,
  businessId: string,
  serviceId: string,
  patch: Partial<BusinessService>
): Promise<BusinessService> {
  const { data, error } = await supabase
    .from('business_services')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', serviceId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteService(supabase: DB, businessId: string, serviceId: string) {
  const { error } = await supabase
    .from('business_services')
    .delete()
    .eq('business_id', businessId)
    .eq('id', serviceId)
  if (error) throw error
}
