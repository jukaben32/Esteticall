import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { syncHostConnection } from '@/services/channelSync'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

export async function POST(_request: Request, props: { params: Promise<{ hostConnectionId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  try {
    const result = await syncHostConnection(ctx.supabase, ctx.business.id, params.hostConnectionId)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
