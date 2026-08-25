import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Package, ClientPackageCredit, ClientPackageCreditWithDetails, Client } from '@/types'
import type { PackageInput } from '@/validations'

type DB = SupabaseClient<Database>

export async function listPackagesForBusiness(supabase: DB, businessId: string): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createPackage(supabase: DB, businessId: string, input: PackageInput): Promise<Package> {
  const { data, error } = await supabase
    .from('packages')
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      service_id: input.serviceId || null,
      session_count: input.sessionCount,
      price: input.price,
      validity_days: input.validityDays ?? null,
      is_active: input.isActive,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updatePackage(
  supabase: DB,
  businessId: string,
  packageId: string,
  patch: Partial<Package>
): Promise<Package> {
  const { data, error } = await supabase
    .from('packages')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', packageId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

type ClientPackageCreditJoinRow = ClientPackageCredit & {
  clients: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  packages: Pick<Package, 'id' | 'name' | 'session_count' | 'price'> | null
}

export async function listClientPackageCreditsForBusiness(
  supabase: DB,
  businessId: string
): Promise<ClientPackageCreditWithDetails[]> {
  const { data, error } = await supabase
    .from('client_package_credits')
    .select('*, clients(id, name, phone, email), packages(id, name, session_count, price)')
    .eq('business_id', businessId)
    .order('purchased_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as ClientPackageCreditJoinRow[]).map((row) => {
    const { clients, packages, ...rest } = row
    return { ...rest, client: clients, package: packages }
  })
}

export async function sellPackageToClient(
  supabase: DB,
  businessId: string,
  input: { clientId: string; packageId: string; sessionsTotal: number; validityDays?: number | null }
): Promise<ClientPackageCredit> {
  const expiresAt = input.validityDays
    ? new Date(Date.now() + input.validityDays * 86_400_000).toISOString()
    : null

  const { data, error } = await supabase
    .from('client_package_credits')
    .insert({
      business_id: businessId,
      client_id: input.clientId,
      package_id: input.packageId,
      sessions_total: input.sessionsTotal,
      expires_at: expiresAt,
      payment_status: 'pending',
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateClientPackageCredit(
  supabase: DB,
  businessId: string,
  creditId: string,
  patch: Partial<ClientPackageCredit>
): Promise<ClientPackageCredit> {
  const { data, error } = await supabase
    .from('client_package_credits')
    .update(patch)
    .eq('business_id', businessId)
    .eq('id', creditId)
    .select('*')
    .single()
  if (error) throw error
  return data
}
