import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Business, BusinessSubscription, DashboardAnalytics } from '@/types'

type DB = SupabaseClient<Database>

export async function getBusinessForOwner(supabase: DB, ownerId: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getBusinessBySlug(supabase: DB, slug: string): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function getBusinessById(supabase: DB, businessId: string): Promise<Business | null> {
  const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).maybeSingle()
  if (error) throw error
  return data
}

export async function getSubscription(
  supabase: DB,
  businessId: string
): Promise<BusinessSubscription | null> {
  const { data, error } = await supabase
    .from('business_subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createBusiness(
  supabase: DB,
  input: { ownerId: string; name: string; slug: string }
): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({ owner_id: input.ownerId, name: input.name, slug: input.slug })
    .select('*')
    .single()
  if (error) throw error

  // business_subscriptions is created automatically by the
  // trg_create_default_subscription trigger right after the businesses
  // insert above — no client insert here, since RLS only allows the
  // service-role Stripe webhook to write that table.

  // Seed a default widget row so the public embed/test call works immediately,
  // without requiring a trip through Dashboard > Widget > Guardar first.
  const { error: widgetError } = await supabase.from('widgets').insert({
    business_id: data.id,
    is_enabled: true,
    primary_color: '#0E7C5A',
    greeting_message: '¡Hola! Pregúntame sobre cualquiera de nuestras propiedades.',
    allowed_origins: [],
  })
  if (widgetError) throw widgetError

  return data
}

export async function updateBusiness(
  supabase: DB,
  businessId: string,
  patch: Partial<Business>
): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .update(patch)
    .eq('id', businessId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getDashboardAnalytics(
  supabase: DB,
  businessId: string
): Promise<DashboardAnalytics> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const startOfWeek = new Date(now.getTime() - now.getDay() * 86_400_000)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [convToday, convWeek, convMonth, apptToday, apptWeek] = await Promise.all([
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('started_at', startOfDay),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('started_at', startOfWeek.toISOString()),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('started_at', startOfMonth),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('scheduled_at', startOfDay),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('scheduled_at', startOfWeek.toISOString()),
  ])

  return {
    conversations_today: convToday.count ?? 0,
    conversations_this_week: convWeek.count ?? 0,
    conversations_this_month: convMonth.count ?? 0,
    appointments_today: apptToday.count ?? 0,
    appointments_this_week: apptWeek.count ?? 0,
  }
}
