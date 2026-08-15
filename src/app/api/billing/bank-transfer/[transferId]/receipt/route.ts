import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'
import { attachReceiptToBankTransfer } from '@/services/bankTransfers'

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
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'])

// Reuses the `listing-photos` bucket with a `bank-transfers/` prefix — same
// pattern as the preventa-projects photo route. Runs with the admin client
// because the bucket's write policy is service-role-only; ownership (this
// transfer really belongs to this business, and is still pending) is
// enforced explicitly below before anything touches storage or the DB.
export async function POST(request: Request, props: { params: Promise<{ transferId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado (usa PNG, JPG, WEBP, GIF o PDF)' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo no puede pesar más de 8 MB' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: transfer, error: transferError } = await admin
    .from('bank_transfer_payments')
    .select('id, business_id, status')
    .eq('id', params.transferId)
    .eq('business_id', ctx.business.id)
    .maybeSingle()
  if (transferError) throw transferError
  if (!transfer) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (transfer.status !== 'pending') {
    return NextResponse.json({ error: 'Esta solicitud ya fue revisada' }, { status: 409 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `bank-transfers/${ctx.business.id}/${params.transferId}/${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('listing-photos')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = admin.storage.from('listing-photos').getPublicUrl(path)

  const updated = await attachReceiptToBankTransfer(admin, ctx.business.id, params.transferId, publicUrlData.publicUrl)
  return NextResponse.json({ transfer: updated })
}
