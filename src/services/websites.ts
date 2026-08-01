import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Website } from '@/types'
import type { WebsiteInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function getWebsiteForBusiness(supabase: DB, businessId: string): Promise<Website | null> {
  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertWebsite(
  supabase: DB,
  businessId: string,
  input: WebsiteInput
): Promise<Website> {
  const { data, error } = await supabase
    .from('websites')
    .upsert(
      {
        business_id: businessId,
        is_published: input.isPublished,
        headline: input.headline || null,
        about: input.about || null,
        theme: input.theme,
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}
