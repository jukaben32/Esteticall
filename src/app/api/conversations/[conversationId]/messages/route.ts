import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'
import { appendMessage, getConversationTranscript } from '@/services/conversations'

export async function GET(_request: Request, { params }: { params: { conversationId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  // RLS (business_owner policy on conversation_messages) scopes this to rows
  // whose business_id the caller owns, so a foreign conversationId just 404s.
  const messages = await getConversationTranscript(supabase, params.conversationId)
  return NextResponse.json({ messages })
}

// Called from the browser widget as each Realtime transcript turn finalizes
// (see useRealtimeVoice.ts) — same trust model as /api/ai/tools: the caller
// has no Supabase session (it's a public widget visitor), so the admin
// client resolves conversationId -> business_id server-side instead of
// relying on auth. Persisting turns here is what makes a real transcript
// (and sentiment analysis, which reads it back after the call ends) possible.
export async function POST(request: Request, { params }: { params: { conversationId: string } }) {
  const { role, content } = await request.json()
  if ((role !== 'agent' && role !== 'caller') || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('business_id')
    .eq('id', params.conversationId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!conversation) return NextResponse.json({ error: 'Unknown conversation' }, { status: 404 })

  await appendMessage(supabase, conversation.business_id, params.conversationId, role, content)
  return NextResponse.json({ ok: true })
}
