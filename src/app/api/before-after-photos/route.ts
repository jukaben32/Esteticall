import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'
import { listBeforeAfterPhotosForBusiness, createBeforeAfterPhoto, BEFORE_AFTER_BUCKET } from '@/services/beforeAfterPhotos'

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

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

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const admin = createAdminClient()
  const photos = await listBeforeAfterPhotosForBusiness(admin, ctx.business.id)
  return NextResponse.json({ photos })
}

// Uploads to the private "patient-photos" bucket (never public — these are
// patient images) and creates the before_after_photos row in one request.
// Runs on the admin client, same convention as the website photo upload
// route, since Storage writes need a policy the signed-in user's own client
// doesn't have.
export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado (usa PNG, JPG o WEBP)' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen no puede pesar más de 8 MB' }, { status: 400 })
  }

  const clientId = formData.get('clientId')
  const photoType = formData.get('photoType')
  if (typeof clientId !== 'string' || !clientId) {
    return NextResponse.json({ error: 'Falta el cliente' }, { status: 400 })
  }
  if (photoType !== 'before' && photoType !== 'after') {
    return NextResponse.json({ error: 'photoType debe ser "before" o "after"' }, { status: 400 })
  }
  const treatmentRecordIdRaw = formData.get('treatmentRecordId')
  const treatmentRecordId = typeof treatmentRecordIdRaw === 'string' && treatmentRecordIdRaw ? treatmentRecordIdRaw : undefined

  const admin = createAdminClient()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${ctx.business.id}/${clientId}/${photoType}-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from(BEFORE_AFTER_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const photo = await createBeforeAfterPhoto(admin, ctx.business.id, {
    clientId,
    treatmentRecordId,
    photoType,
    path,
  })

  const { data: signedData } = await admin.storage.from(BEFORE_AFTER_BUCKET).createSignedUrl(path, 3600)
  return NextResponse.json({ photo: { ...photo, signedUrl: signedData?.signedUrl ?? null } })
}
