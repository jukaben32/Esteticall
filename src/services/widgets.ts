import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Widget, WidgetWithAgent } from '@/types'
import type { WidgetInput, WidgetUpdateInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function listWidgetsForBusiness(supabase: DB, businessId: string): Promise<WidgetWithAgent[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*, ai_agents(name)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => {
    const { ai_agents, ...widget } = row
    return { ...widget, agent_name: ai_agents?.name ?? null }
  })
}

export async function getWidgetById(supabase: DB, businessId: string, widgetId: string): Promise<Widget | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .eq('id', widgetId)
    .maybeSingle()
  if (error) throw error
  return data
}

// Kept for callers that still expect "the" widget for a business (e.g. legacy
// single-widget demo pages) — returns the most recently created one.
export async function getWidgetForBusiness(supabase: DB, businessId: string): Promise<Widget | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

// Public-safe read for the embed script — no auth, so only non-sensitive
// columns are ever returned. Matches by business + the agent baked into the
// <script data-agent-id="..."> tag; falls back to the first active widget
// for the business when no agent is specified.
export async function getPublicWidgetConfig(supabase: DB, businessId: string, agentId?: string | null) {
  let query = supabase
    .from('widgets')
    .select('id, name, position, theme, primary_color, greeting_message, allowed_origins, agent_id')
    .eq('business_id', businessId)
    .eq('is_enabled', true)

  query = agentId ? query.eq('agent_id', agentId) : query.order('created_at', { ascending: false })

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function createWidget(supabase: DB, businessId: string, input: WidgetInput): Promise<Widget> {
  const { data, error } = await supabase
    .from('widgets')
    .insert({
      business_id: businessId,
      name: input.name,
      agent_id: input.agentId,
      position: input.position,
      theme: input.theme,
      is_enabled: input.isEnabled,
      primary_color: input.primaryColor,
      greeting_message: input.greetingMessage,
      allowed_origins: input.allowedOrigins,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateWidget(
  supabase: DB,
  businessId: string,
  widgetId: string,
  input: WidgetUpdateInput
): Promise<Widget> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.agentId !== undefined) patch.agent_id = input.agentId
  if (input.position !== undefined) patch.position = input.position
  if (input.theme !== undefined) patch.theme = input.theme
  if (input.isEnabled !== undefined) patch.is_enabled = input.isEnabled
  if (input.primaryColor !== undefined) patch.primary_color = input.primaryColor
  if (input.greetingMessage !== undefined) patch.greeting_message = input.greetingMessage
  if (input.allowedOrigins !== undefined) patch.allowed_origins = input.allowedOrigins

  const { data, error } = await supabase
    .from('widgets')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', widgetId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteWidget(supabase: DB, businessId: string, widgetId: string): Promise<void> {
  const { error } = await supabase.from('widgets').delete().eq('business_id', businessId).eq('id', widgetId)
  if (error) throw error
}

// Called by the public config route every time the embed script loads on a
// third-party page — one row-per-pageview, so this is a raw increment rather
// than a read-modify-write to avoid clobbering concurrent hits.
export async function incrementWidgetImpressions(supabase: DB, widgetId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_widget_counter', { widget_id: widgetId, column_name: 'impressions' })
  if (error) throw error
}

export async function incrementWidgetInteractions(supabase: DB, widgetId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_widget_counter', { widget_id: widgetId, column_name: 'interactions' })
  if (error) throw error
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) return true // no allow-list configured yet = open during setup
  return allowedOrigins.includes(origin)
}
