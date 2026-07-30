import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { createAgent, listAgentsForBusiness, AgentLimitError } from '@/services/aiAgents'
import { aiAgentSchema } from '@/validations'
import type { PlanId } from '@/types'

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

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const agents = await listAgentsForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ agents })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = aiAgentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const subscription = await getSubscription(ctx.supabase, ctx.business.id)
  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'

  try {
    const agent = await createAgent(ctx.supabase, ctx.business.id, plan, parsed.data)
    return NextResponse.json({ agent })
  } catch (err) {
    if (err instanceof AgentLimitError) {
      return NextResponse.json({ error: err.message }, { status: 402 })
    }
    throw err
  }
}
