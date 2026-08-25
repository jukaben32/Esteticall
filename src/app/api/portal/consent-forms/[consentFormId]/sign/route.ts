import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnedConsentFormForClientUser, signOwnedConsentForm } from '@/services/clientPortal'
import { consentFormSignSchema } from '@/validations'

export async function PATCH(request: Request, props: { params: Promise<{ consentFormId: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = consentFormSignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const consentForm = await getOwnedConsentFormForClientUser(admin, user.id, params.consentFormId)
  if (!consentForm) return NextResponse.json({ error: 'Consentimiento no encontrado' }, { status: 404 })
  if (consentForm.status !== 'pending') {
    return NextResponse.json({ error: 'Este consentimiento ya fue procesado' }, { status: 409 })
  }

  await signOwnedConsentForm(admin, params.consentFormId, parsed.data.signatureName)

  await admin.from('notifications').insert({
    business_id: consentForm.business_id,
    type: 'system',
    title: 'Consentimiento firmado por el cliente',
    body: `${parsed.data.signatureName} firmó "${consentForm.title}"`,
  })

  return NextResponse.json({
    consentForm: { ...consentForm, status: 'signed', signature_name: parsed.data.signatureName, signed_at: new Date().toISOString() },
  })
}
