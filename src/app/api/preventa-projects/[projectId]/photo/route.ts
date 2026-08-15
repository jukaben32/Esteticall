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

// Reutiliza el bucket `listing-photos` con prefijo `projects/` — mismo patron
// que /api/listings/[listingId]/photo, corre con el cliente admin porque el
// bucket solo acepta escrituras con el service role.
export async function POST(request: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
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

  const { data: project, error: projectError } = await admin
    .from('preventa_projects')
    .select('id, business_id')
    .eq('id', params.projectId)
    .eq('business_id', ctx.business.id)
    .maybeSingle()
  if (projectError) throw projectError
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `projects/${ctx.business.id}/${params.projectId}/${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('listing-photos')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = admin.storage.from('listing-photos').getPublicUrl(path)
  const url = publicUrlData.publicUrl

  const { count: existingCount } = await admin
    .from('preventa_project_photos')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', params.projectId)
  const isFirstPhoto = (existingCount ?? 0) === 0

  const { data: insertedPhoto, error: photoInsertError } = await admin
    .from('preventa_project_photos')
    .insert({ project_id: params.projectId, business_id: ctx.business.id, url, is_cover: isFirstPhoto })
    .select('*')
    .single()
  if (photoInsertError) throw photoInsertError

  let updatedProject = project
  if (isFirstPhoto) {
    const { data, error: updateError } = await admin
      .from('preventa_projects')
      .update({ cover_photo_url: url })
      .eq('id', params.projectId)
      .select('*')
      .single()
    if (updateError) throw updateError
    updatedProject = data
  }

  return NextResponse.json({ project: updatedProject, url, photo: insertedPhoto })
}
