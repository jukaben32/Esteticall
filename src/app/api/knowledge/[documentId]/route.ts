import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateKnowledgeDocument, deleteKnowledgeDocument } from '@/services/knowledge'
import { knowledgeDocumentSchema } from '@/validations'
import type { KnowledgeDocument } from '@/types'

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

  const body = await request.json()
  const parsed = knowledgeDocumentSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { sourceUrl, catalogKey, ...rest } = parsed.data
  const patch: Partial<KnowledgeDocument> = { ...rest }
  if (sourceUrl !== undefined) patch.source_url = sourceUrl || null
  if (catalogKey !== undefined) patch.catalog_key = catalogKey || null

  const document = await updateKnowledgeDocument(ctx.supabase, ctx.business.id, params.documentId, patch)
  return NextResponse.json({ document })
}

export async function DELETE(_request: Request, { params }: { params: { documentId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  await deleteKnowledgeDocument(ctx.supabase, ctx.business.id, params.documentId)
  return NextResponse.json({ ok: true })
}
