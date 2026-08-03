import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Client } from '@/types'

type DB = SupabaseClient<Database>

export async function listClientsForBusiness(supabase: DB, businessId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// Finds-or-creates by phone within a business — an AI call from a returning
// caller should update the same lead, not spawn a duplicate every time.
export async function findOrCreateClientByPhone(
  supabase: DB,
  businessId: string,
  input: {
    name?: string
    phone?: string
    email?: string
    budget?: number
    preApprovalNumber?: string
    source?: Client['source']
  }
): Promise<Client> {
  if (input.phone) {
    const { data: existing, error } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', businessId)
      .eq('phone', input.phone)
      .maybeSingle()
    if (error) throw error
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('clients')
        .update({
          name: input.name ?? existing.name,
          email: input.email ?? existing.email,
          budget: input.budget ?? existing.budget,
          pre_approval_number: input.preApprovalNumber ?? existing.pre_approval_number,
        })
        .eq('id', existing.id)
        .select('*')
        .single()
      if (updateError) throw updateError
      return updated
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      business_id: businessId,
      name: input.name ?? 'Unknown',
      phone: input.phone,
      email: input.email,
      budget: input.budget,
      pre_approval_number: input.preApprovalNumber,
      source: input.source ?? 'ai_call',
    })
    .select('*')
    .single()
  if (error) throw error

  await supabase.from('notifications').insert({
    business_id: businessId,
    type: 'new_lead',
    title: 'New lead captured',
    body: `${data.name}${data.phone ? ` · ${data.phone}` : ''}`,
  })

  return data
}
