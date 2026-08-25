import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BeforeAfterPhoto, Client } from '@/types'

type DB = SupabaseClient<Database>

// Private bucket — before/after photos are patient images and must never be
// reachable by a guessable public URL the way website/listing photos are.
// Create this bucket as PRIVATE in the Supabase dashboard (Storage → New
// bucket → "patient-photos", Public: off) before this feature is used.
export const BEFORE_AFTER_BUCKET = 'patient-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour, regenerated on every page load

type BeforeAfterPhotoJoinRow = BeforeAfterPhoto & {
  clients: Pick<Client, 'id' | 'name'> | null
}

export interface BeforeAfterPhotoWithUrl extends BeforeAfterPhoto {
  client: Pick<Client, 'id' | 'name'> | null
  signedUrl: string | null
}

// `url` stores the private bucket's object path (not a public URL) — a
// signed URL is minted fresh here every time the dashboard reads the list,
// so nothing long-lived or guessable is ever persisted or sent to the client.
export async function listBeforeAfterPhotosForBusiness(
  supabase: DB,
  businessId: string
): Promise<BeforeAfterPhotoWithUrl[]> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .select('*, clients(id, name)')
    .eq('business_id', businessId)
    .order('taken_at', { ascending: false })
  if (error) throw error

  const rows = (data ?? []) as unknown as BeforeAfterPhotoJoinRow[]
  const signed = await Promise.all(
    rows.map(async (row) => {
      const { data: signedData } = await supabase.storage
        .from(BEFORE_AFTER_BUCKET)
        .createSignedUrl(row.url, SIGNED_URL_TTL_SECONDS)
      const { clients, ...rest } = row
      return { ...rest, client: clients, signedUrl: signedData?.signedUrl ?? null }
    })
  )
  return signed
}

export async function listBeforeAfterPhotosForClient(
  supabase: DB,
  businessId: string,
  clientId: string
): Promise<BeforeAfterPhotoWithUrl[]> {
  const all = await listBeforeAfterPhotosForBusiness(supabase, businessId)
  return all.filter((p) => p.client_id === clientId)
}

export async function createBeforeAfterPhoto(
  supabase: DB,
  businessId: string,
  input: { clientId: string; treatmentRecordId?: string; photoType: 'before' | 'after'; path: string }
): Promise<BeforeAfterPhoto> {
  const { data, error } = await supabase
    .from('before_after_photos')
    .insert({
      business_id: businessId,
      client_id: input.clientId,
      treatment_record_id: input.treatmentRecordId || null,
      photo_type: input.photoType,
      url: input.path,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteBeforeAfterPhoto(supabase: DB, businessId: string, photoId: string): Promise<void> {
  const { data: photo, error: fetchError } = await supabase
    .from('before_after_photos')
    .select('url')
    .eq('business_id', businessId)
    .eq('id', photoId)
    .maybeSingle()
  if (fetchError) throw fetchError
  if (!photo) return

  const { error: deleteError } = await supabase.from('before_after_photos').delete().eq('business_id', businessId).eq('id', photoId)
  if (deleteError) throw deleteError

  await supabase.storage.from(BEFORE_AFTER_BUCKET).remove([photo.url])
}
