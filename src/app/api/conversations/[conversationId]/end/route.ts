import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { endConversation, getConversationTranscript, setConversationSentiment } from '@/services/conversations'
import { analyzeSentiment } from '@/services/sentiment'
import { logAiUsage, realtimeVoiceCostUsd } from '@/services/aiUsage'

// Called by the browser when a widget voice call hangs up. Public endpoint
// (no Supabase session — an anonymous website visitor can be the one calling)
// scoped by conversationId, same pattern as /api/ai/tools. Only marks the
// call as finished and records its real duration; client_id/outcome are
// already set progressively by the tool relay as the call happens, so this
// never overwrites them.
export async function POST(_request: Request, props: { params: Promise<{ conversationId: string }> }) {
  const params = await props.params;
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

  const updated = await endConversation(supabase, params.conversationId, { durationSeconds })

  await logAiUsage(supabase, {
    businessId: updated.business_id,
    conversationId: params.conversationId,
    kind: 'realtime_voice',
    durationSeconds,
    costUsd: realtimeVoiceCostUsd(durationSeconds),
  })

  const transcript = await getConversationTranscript(supabase, params.conversationId)
  const sentiment = await analyzeSentiment(transcript, {
    supabase,
    businessId: updated.business_id,
    conversationId: params.conversationId,
  })
  if (sentiment) await setConversationSentiment(supabase, params.conversationId, sentiment)

  return NextResponse.json({ ok: true })
}
