import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { endConversation } from '@/services/conversations'

// Called by the browser when a widget voice call hangs up. Public endpoint
// (no Supabase session — an anonymous website visitor can be the one calling)
// scoped by conversationId, same pattern as /api/ai/tools. Only marks the
// call as finished and records its real duration; client_id/outcome are
// already set progressively by the tool relay as the call happens, so this
// never overwrites them.
export async function POST(_request: Request, { params }: { params: { conversationId: string } }) {
  const supabase = createAdminClient()

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, started_at, status')
    .eq('id', params.conversationId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!conversation) return NextResponse.json({ error: 'Unknown conversation' }, { status: 404 })
  if (conversation.status === 'completed') return NextResponse.json({ ok: true })

  const durationSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(conversation.started_at).getTime()) / 1000)
  )

  await endConversation(supabase, params.conversationId, { durationSeconds })
  return NextResponse.json({ ok: true })
}
