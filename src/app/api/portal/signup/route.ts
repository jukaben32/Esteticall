import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUnlinkedClientsByEmail, linkClientRowsToUser } from '@/services/clientPortal'
import { portalSignupSchema } from '@/validations'

// Gate: unlike the business /signup, a Client Portal account can't be
// created out of thin air — it only makes sense linked to a clients row the
// AI agent (or a public booking) already created. Creating the auth user
// with the admin client (email_confirm: true) instead of the regular
// signUp() flow means this works the same whether or not the project has
// Supabase's own email-confirmation setting on, and skips a confirmation
// round trip the reference video's flow doesn't actually need here — the
// booking itself was already the "hey, is this really you" proof.
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = portalSignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }
  const { name, email, phone, password } = parsed.data

  const admin = createAdminClient()

  const unlinked = await findUnlinkedClientsByEmail(admin, email)
  if (unlinked.length === 0) {
    return NextResponse.json(
      {
        error:
          'No encontramos ninguna reserva hecha con este correo. Debes haber agendado una visita con nuestro agente de IA (o ya tener una cuenta — intenta iniciar sesión).',
      },
      { status: 404 }
    )
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone: phone || undefined, portal_client: true },
  })
  if (createError) {
    const isDuplicate = createError.message.toLowerCase().includes('already been registered')
    return NextResponse.json(
      { error: isDuplicate ? 'Ya existe una cuenta con este correo. Intenta iniciar sesión.' : createError.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  await linkClientRowsToUser(
    admin,
    unlinked.map((c) => c.id),
    created.user.id
  )

  return NextResponse.json({ ok: true })
}
