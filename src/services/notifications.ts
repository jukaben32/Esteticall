import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Notification } from '@/types'

type DB = SupabaseClient<Database>

export async function listNotificationsForBusiness(
  supabase: DB,
  businessId: string,
  filters?: { unreadOnly?: boolean }
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(
  supabase: DB,
  businessId: string,
  notificationId: string
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('business_id', businessId)
    .eq('id', notificationId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function markAllNotificationsRead(supabase: DB, businessId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('business_id', businessId)
    .eq('is_read', false)
  if (error) throw error
}
