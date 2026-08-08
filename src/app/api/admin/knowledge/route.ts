import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformAdmin } from '@/lib/platformAdmin'
import { listPlatformKnowledgeDocuments, createPlatformKnowledgeDocument } from '@/services/knowledge'
import { platformKnowledgeDocumentSchema } from '@/validations'

// Gated by PLATFORM_ADMIN_EMAILS, not business ownership — this data has no
// business_id, so the regular requireBusiness() pattern doesn't apply. Writes
// go through the admin (service-role) client because RLS on
// platform_knowledge_documents only grants public SELECT.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isPlatformAdmin(user.email)) return { error: 'Not authorized' as const }
  return { admin: createAdminClient() }
}

export async function GET() {
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })
  const documents = await listPlatformKnowledgeDocuments(ctx.admin)
  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 403 })

  const body = await request.json()
  const parsed = platformKnowledgeDocumentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const document = await createPlatformKnowledgeDocument(ctx.admin, parsed.data)
  return NextResponse.json({ document })
}
