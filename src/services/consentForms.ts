import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ConsentForm, Client, BusinessService } from '@/types'
import { encryptSecret, decryptSecret } from '@/lib/encryption'

type DB = SupabaseClient<Database>

type ConsentFormJoinRow = ConsentForm & {
  clients: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  business_services: Pick<BusinessService, 'id' | 'name'> | null
}

export interface ConsentFormWithDetails extends Omit<ConsentForm, 'content_encrypted'> {
  content: string
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  service: Pick<BusinessService, 'id' | 'name'> | null
}

function mapRow(row: ConsentFormJoinRow): ConsentFormWithDetails {
  const { clients, business_services, content_encrypted, ...rest } = row
  return {
    ...rest,
    content: decryptSecret(content_encrypted),
    client: clients,
    service: business_services,
  }
}

export async function listConsentFormsForBusiness(supabase: DB, businessId: string): Promise<ConsentFormWithDetails[]> {
  const { data, error } = await supabase
    .from('consent_forms')
    .select('*, clients(id, name, phone, email), business_services(id, name)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as ConsentFormJoinRow[]).map(mapRow)
}

export async function createConsentForm(
  supabase: DB,
  businessId: string,
  input: { clientId: string; serviceId?: string; appointmentId?: string; title: string; content: string }
): Promise<ConsentForm> {
  const { data, error } = await supabase
    .from('consent_forms')
    .insert({
      business_id: businessId,
      client_id: input.clientId,
      service_id: input.serviceId || null,
      appointment_id: input.appointmentId || null,
      title: input.title,
      content_encrypted: encryptSecret(input.content),
      status: 'pending',
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function markConsentFormSigned(
  supabase: DB,
  businessId: string,
  consentFormId: string,
  signatureName: string
): Promise<ConsentForm> {
  const { data, error } = await supabase
    .from('consent_forms')
    .update({ status: 'signed', signature_name: signatureName, signed_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('id', consentFormId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
