import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/platformAdmin'
import { updatePlatformKnowledgeDocument, deletePlatformKnowledgeDocument } from '@/services/knowledge'
import { platformKnowledgeDocumentSchema } from '@/validations'
import type { PlatformKnowledgeDocument } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isPlatformAdmin(user.email)) return { error: 'Not authorized' as const }
  return { admin: createAdminClient() }
}

export async function PATCH(request: Request, { params }: { params: { documentId: string } }) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })

  const body = await request.json()
  const parsed = platformKnowledgeDocumentSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { sourceUrl, ...rest } = parsed.data
  const patch: Partial<PlatformKnowledgeDocument> = { ...rest }
  if (sourceUrl !== undefined) patch.source_url = sourceUrl || null

  const document = await updatePlatformKnowledgeDocument(ctx.admin, params.documentId, patch)
  return NextResponse.json({ document })
}

export async function DELETE(_request: Request, { params }: { params: { documentId: string } }) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })
  await deletePlatformKnowledgeDocument(ctx.admin, params.documentId)
  return NextResponse.json({ ok: true })
}
