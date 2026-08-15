import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import {
  assignAgentToPreventaProject,
  deletePreventaProject,
  getPreventaProjectById,
  unassignAgentFromPreventaProject,
  updatePreventaProject,
} from '@/services/preventaProjects'

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

export async function PATCH(request: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const { agentId, ...patch } = body as { agentId?: string | null; [key: string]: unknown }

  if (agentId !== undefined) {
    if (agentId) {
      await assignAgentToPreventaProject(ctx.supabase, ctx.business.id, params.projectId, agentId)
    } else {
      await unassignAgentFromPreventaProject(ctx.supabase, ctx.business.id, params.projectId)
    }
  }

  if (Object.keys(patch).length) {
    await updatePreventaProject(ctx.supabase, ctx.business.id, params.projectId, patch)
  }

  const project = await getPreventaProjectById(ctx.supabase, ctx.business.id, params.projectId)
  return NextResponse.json({ project, agentId: agentId ?? null })
}

export async function DELETE(_request: Request, props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deletePreventaProject(ctx.supabase, ctx.business.id, params.projectId)
  return NextResponse.json({ ok: true })
}
