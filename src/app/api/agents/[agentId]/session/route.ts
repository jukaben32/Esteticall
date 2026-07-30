import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startConversation } from '@/services/conversations'
import { listAiVisibleListings } from '@/services/listings'
import { buildSystemPrompt, REALTIME_TOOLS } from '@/ai/tools'
import { OPENAI_REALTIME_MODEL } from '@/constants'

// Public endpoint — hit by the embeddable widget with no Supabase session, so
// it uses the admin client and only ever returns an OpenAI *ephemeral* secret,
// never OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY itself.
export async function POST(request: Request, { params }: { params: { agentId: string } }) {
  const { listingId } = await request.json().catch(() => ({ listingId: undefined }))
  const supabase = createAdminClient()

  const { data: agent, error: agentError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', params.agentId)
    .eq('status', 'live')
    .maybeSingle()
  if (agentError) return NextResponse.json({ error: agentError.message }, { status: 500 })
  if (!agent) return NextResponse.json({ error: 'Agent not found or not live' }, { status: 404 })

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', agent.business_id)
    .single()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })

  const listings = await listAiVisibleListings(supabase, business.id)
  const conversation = await startConversation(supabase, business.id, {
    agentId: agent.id,
    listingId,
    channel: 'widget_voice',
  })

  const systemPrompt = buildSystemPrompt({ business, agent, listings })

  const openaiResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_REALTIME_MODEL,
      voice: agent.voice,
      instructions: systemPrompt,
      tools: REALTIME_TOOLS,
      turn_detection: {
        type: 'server_vad',
        threshold: Number(agent.sensitivity) || 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    }),
  })

  if (!openaiResponse.ok) {
    const detail = await openaiResponse.text()
    return NextResponse.json({ error: `OpenAI Realtime error: ${detail}` }, { status: 502 })
  }

  const session = await openaiResponse.json()

  return NextResponse.json({
    conversationId: conversation.id,
    agentName: agent.name,
    voice: agent.voice,
    model: OPENAI_REALTIME_MODEL,
    systemPrompt,
    tools: REALTIME_TOOLS,
    turnDetection: {
      type: 'server_vad',
      threshold: Number(agent.sensitivity) || 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
    },
    clientSecret: session.client_secret.value,
    expiresAt: session.client_secret.expires_at,
  })
}
