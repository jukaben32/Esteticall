import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { business }
}

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

// Runs with the service-role client (createAdminClient) because Storage
// writes need the bucket's write policy, which is service-role-only —
// ownership is enforced above, before this ever touches storage.
export async function POST(request: Request, { params }: { params: { listingId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado (usa PNG, JPG, WEBP o GIF)' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen no puede pesar más de 8 MB' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Ownership check: the listing must belong to this business.
  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('id, business_id')
    .eq('id', params.listingId)
    .eq('business_id', ctx.business.id)
    .maybeSingle()
  if (listingError) throw listingError
  if (!listing) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${ctx.business.id}/${params.listingId}/${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('listing-photos')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = admin.storage.from('listing-photos').getPublicUrl(path)
  const url = publicUrlData.publicUrl

  await admin.from('listing_photos').update({ is_cover: false }).eq('listing_id', params.listingId)
  const { error: photoInsertError } = await admin
    .from('listing_photos')
    .insert({ listing_id: params.listingId, business_id: ctx.business.id, url, is_cover: true })
  if (photoInsertError) throw photoInsertError

  const { data: updatedListing, error: updateError } = await admin
    .from('listings')
    .update({ cover_photo_url: url })
    .eq('id', params.listingId)
    .select('*')
    .single()
  if (updateError) throw updateError

  return NextResponse.json({ listing: updatedListing, url })
}
