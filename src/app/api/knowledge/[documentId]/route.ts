import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateKnowledgeDocument, deleteKnowledgeDocument } from '@/services/knowledge'

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

export async function PATCH(request: Request, { params }: { params: { documentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const patch = await request.json()
  const document = await updateKnowledgeDocument(ctx.supabase, ctx.business.id, params.documentId, patch)
  return NextResponse.json({ document })
}

export async function DELETE(_request: Request, { params }: { params: { documentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteKnowledgeDocument(ctx.supabase, ctx.business.id, params.documentId)
  return NextResponse.json({ ok: true })
}
