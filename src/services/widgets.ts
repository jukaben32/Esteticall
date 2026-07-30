import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Widget } from '@/types'
import type { WidgetInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function getWidgetForBusiness(supabase: DB, businessId: string): Promise<Widget | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Public-safe read for the embed script — no auth, so only used with the
// admin client from the widget config route, never exposed to RLS-less access.
export async function getPublicWidgetConfig(supabase: DB, businessId: string) {
  const { data, error } = await supabase
    .from('widgets')
    .select('is_enabled, primary_color, greeting_message, allowed_origins')
    .eq('business_id', businessId)
    .eq('is_enabled', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertWidget(
  supabase: DB,
  businessId: string,
  input: WidgetInput
): Promise<Widget> {
  const { data, error } = await supabase
    .from('widgets')
    .upsert(
      {
        business_id: businessId,
        is_enabled: input.isEnabled,
        primary_color: input.primaryColor,
        greeting_message: input.greetingMessage,
        allowed_origins: input.allowedOrigins,
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true // no allow-list configured yet = open during setup
  return allowedOrigins.includes(origin)
}
