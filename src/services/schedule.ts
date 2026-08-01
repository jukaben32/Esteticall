import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BusinessAvailability } from '@/types'
import type { AvailabilityInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function listAvailabilityForBusiness(
  supabase: DB,
  businessId: string
): Promise<BusinessAvailability[]> {
  const { data, error } = await supabase
    .from('business_availability')
    .select('*')
    .eq('business_id', businessId)
    .order('day_of_week', { ascending: true })
  if (error) throw error
  return data ?? []
}

// One row per day_of_week (unique constraint in the schema) — upsert keeps
// the weekly editor idempotent whether the caller is adding or updating a day.
export async function upsertAvailabilityDay(
  supabase: DB,
  businessId: string,
  input: AvailabilityInput
): Promise<BusinessAvailability> {
  const { data, error } = await supabase
    .from('business_availability')
    .upsert(
      {
        business_id: businessId,
        day_of_week: input.dayOfWeek,
        start_time: input.startTime,
        end_time: input.endTime,
        slot_minutes: input.slotMinutes,
        is_active: input.isActive,
      },
      { onConflict: 'business_id,day_of_week' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteAvailabilityDay(supabase: DB, businessId: string, dayOfWeek: number) {
  const { error } = await supabase
    .from('business_availability')
    .delete()
    .eq('business_id', businessId)
    .eq('day_of_week', dayOfWeek)
  if (error) throw error
}
