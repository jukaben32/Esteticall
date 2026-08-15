import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/platformAdmin'
import { rejectBankTransfer } from '@/services/bankTransfers'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isPlatformAdmin(user.email)) return { error: 'Not authorized' as const }
  return { admin: createAdminClient(), reviewerEmail: user.email! }
}

export async function POST(request: Request, props: { params: Promise<{ transferId: string }> }) {
  const params = await props.params
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  try {
    const transfer = await rejectBankTransfer(ctx.admin, params.transferId, ctx.reviewerEmail, body.reason)
    return NextResponse.json({ transfer })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No se pudo rechazar' }, { status: 400 })
  }
}
