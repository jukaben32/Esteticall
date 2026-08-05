import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { updateAgent, deleteAgent, duplicateAgent, AgentLimitError } from '@/services/aiAgents'
import { setAgentServices } from '@/services/agentServices'
import { aiAgentSchema } from '@/validations'
import type { AiAgent, PlanId } from '@/types'

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

// Accepts the same camelCase shape as POST /api/agents (aiAgentSchema) — the
// UI never has to know ai_agents' actual (snake_case) column names, and both
// callers (AgentEditModal, AgentStudio) send one consistent wire format.
export async function PATCH(request: Request, { params }: { params: { agentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const { serviceIds, ...rest } = await request.json()
  const parsed = aiAgentSchema.partial().safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { greetingMessage, systemPrompt, ...simple } = parsed.data
  const patch: Partial<AiAgent> = { ...simple }
  if (greetingMessage !== undefined) patch.greeting_message = greetingMessage
  if (systemPrompt !== undefined) patch.system_prompt = systemPrompt

  try {
    const agent = await updateAgent(ctx.supabase, ctx.business.id, params.agentId, patch)
    if (Array.isArray(serviceIds)) {
      await setAgentServices(ctx.supabase, ctx.business.id, params.agentId, serviceIds)
    }
    return NextResponse.json({ agent })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo guardar el agente'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { agentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteAgent(ctx.supabase, ctx.business.id, params.agentId)
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request, { params }: { params: { agentId: string } }) {
  // Reused for the "duplicate agent" action — the only POST this route needs.
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  if (body.action !== 'duplicate') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  }
  const subscription = await getSubscription(ctx.supabase, ctx.business.id)
  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'
  try {
    const agent = await duplicateAgent(ctx.supabase, ctx.business.id, plan, params.agentId)
    return NextResponse.json({ agent })
  } catch (err) {
    if (err instanceof AgentLimitError) {
      return NextResponse.json({ error: err.message }, { status: 402 })
    }
    throw err
  }
}
