import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/platformAdmin'
import { listBankTransfersForAdmin } from '@/services/bankTransfers'

// Gated by PLATFORM_ADMIN_EMAILS, same pattern as /api/admin/knowledge — this
// spans every business, so the regular requireBusiness() ownership check
// doesn't apply. Reads through the admin (service-role) client because RLS
// on bank_transfer_payments only grants each business owner SELECT on their
// own rows, not a platform-wide view across businesses.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isPlatformAdmin(user.email)) return { error: 'Not authorized' as const }
  return { admin: createAdminClient() }
}

export async function GET(request: Request) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') === 'all' ? 'all' : 'pending'
  const transfers = await listBankTransfersForAdmin(ctx.admin, status)
  return NextResponse.json({ transfers })
}
