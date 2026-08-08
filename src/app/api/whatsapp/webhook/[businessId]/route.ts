import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findOrCreateClientByPhone } from '@/services/clients'
import { startConversation, appendMessage } from '@/services/conversations'
import { listAiVisibleListings } from '@/services/listings'
import { listKnowledgeDocuments, listPlatformKnowledgeDocuments } from '@/services/knowledge'
import { getWhatsappConnection, sendWhatsappMessage } from '@/services/whatsapp'
import { buildSystemPrompt } from '@/ai/tools'
import { runWhatsappAgentTurn } from '@/ai/textAgent'

// A gap this long between messages from the same client starts a fresh
// conversation row instead of continuing the old one — mirrors how each
// phone call is its own conversation, applied to an async channel that has
// no clean "hang up" signal.
const SESSION_WINDOW_MS = 6 * 60 * 60 * 1000

function extractInboundText(data: Record<string, unknown>): string | null {
  const message = data.message as Record<string, unknown> | undefined
  if (!message) return null
  if (typeof message.conversation === 'string') return message.conversation
  const extended = message.extendedTextMessage as { text?: string } | undefined
  return extended?.text ?? null
}

// No signature verification here — Evolution API's webhook has no built-in
// HMAC signing, so the businessId in the URL (paired with checking the
// connection row exists + is enabled) is the trust boundary. This URL isn't
// guessable without already knowing a valid business_id, and the worst a
// forged POST can do is create a spurious WhatsApp conversation.
export async function POST(request: Request, { params }: { params: { businessId: string } }) {
  const payload = await request.json().catch(() => null)
  if (!payload) return NextResponse.json({ ok: true })

  const event = String(payload.event ?? '').toUpperCase()
  if (event && event !== 'MESSAGES_UPSERT') {
    return NextResponse.json({ ok: true })
  }

  const data = payload.data as Record<string, unknown> | undefined
  const key = data?.key as { remoteJid?: string; fromMe?: boolean } | undefined
  if (!data || !key || key.fromMe) {
    return NextResponse.json({ ok: true })
  }

  const remoteJid = key.remoteJid
  const text = extractInboundText(data)
  if (!remoteJid || remoteJid.endsWith('@g.us') || !text) {
    // No text content, or a group chat — group support is out of scope for now.
    return NextResponse.json({ ok: true })
  }

  const phone = remoteJid.split('@')[0]
  const pushName = typeof data.pushName === 'string' ? data.pushName : undefined
  const businessId = params.businessId
  const supabase = createAdminClient()

  const connection = await getWhatsappConnection(supabase, businessId)
  if (!connection || !connection.is_enabled || !connection.agent_id) {
    return NextResponse.json({ ok: true })
  }

  const [{ data: agent }, { data: business }] = await Promise.all([
    supabase.from('ai_agents').select('*').eq('id', connection.agent_id).maybeSingle(),
    supabase.from('businesses').select('*').eq('id', businessId).maybeSingle(),
  ])
  if (!agent || agent.status !== 'live' || !business) {
    return NextResponse.json({ ok: true })
  }

  const client = await findOrCreateClientByPhone(supabase, businessId, {
    name: pushName || 'WhatsApp',
    phone,
    source: 'whatsapp',
  })

  const { data: recent } = await supabase
    .from('conversations')
    .select('*')
    .eq('business_id', businessId)
    .eq('client_id', client.id)
    .eq('channel', 'whatsapp')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const isSameSession = !!recent && Date.now() - new Date(recent.started_at).getTime() < SESSION_WINDOW_MS

  if (recent && !isSameSession && recent.status === 'in_progress') {
    // Best-effort — close out the stale thread so Call Log doesn't show it as
    // perpetually in progress. Not awaited-critical if it fails.
    await supabase.from('conversations').update({ status: 'completed' }).eq('id', recent.id)
  }

  const conversation = isSameSession
    ? recent!
    : await startConversation(supabase, businessId, { agentId: agent.id, channel: 'whatsapp', clientId: client.id })

  await appendMessage(supabase, businessId, conversation.id, 'caller', text)

  const [listings, knowledgeDocs, platformKnowledgeDocs, historyRes] = await Promise.all([
    listAiVisibleListings(supabase, businessId),
    listKnowledgeDocuments(supabase, businessId),
    listPlatformKnowledgeDocuments(supabase),
    supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true }),
  ])

  const systemPrompt = buildSystemPrompt({
    business,
    agent,
    listings,
    knowledgeDocs,
    platformKnowledgeDocs,
    channel: 'text',
  })

  const chatHistory = (historyRes.data ?? [])
    .filter((m) => m.role === 'caller' || m.role === 'agent')
    .map((m) => ({ role: m.role === 'caller' ? ('user' as const) : ('assistant' as const), content: m.content }))

  // Randomized human-like pause before replying — instant bot replies are an
  // easy automation signal; costs nothing here and lowers ban risk (see the
  // WhatsApp plan in ESTADO.md).
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

  let reply: string
  try {
    reply = await runWhatsappAgentTurn(supabase, {
      businessId,
      conversationId: conversation.id,
      systemPrompt,
      history: chatHistory,
    })
  } catch (err) {
    reply = 'Perdón, tuvimos un problema técnico. En breve te contacta alguien del equipo.'
    console.error('[whatsapp webhook] agent turn failed', err)
  }

  await appendMessage(supabase, businessId, conversation.id, 'agent', reply)

  try {
    await sendWhatsappMessage(connection, phone, reply)
  } catch (err) {
    console.error('[whatsapp webhook] failed to send reply', err)
  }

  return NextResponse.json({ ok: true })
}
