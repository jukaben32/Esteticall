import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateAgent, deleteAgent } from '@/services/aiAgents'

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

export async function PATCH(request: Request, { params }: { params: { agentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const patch = await request.json()
  const agent = await updateAgent(ctx.supabase, ctx.business.id, params.agentId, patch)
  return NextResponse.json({ agent })
}

export async function DELETE(_request: Request, { params }: { params: { agentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteAgent(ctx.supabase, ctx.business.id, params.agentId)
  return NextResponse.json({ ok: true })
}
