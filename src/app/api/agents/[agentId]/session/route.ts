import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startConversation } from '@/services/conversations'
import { listAiVisibleListings, getAssignedListingIds } from '@/services/listings'
import { listAiVisiblePreventaProjects, getAssignedPreventaProjectIds } from '@/services/preventaProjects'
import { listKnowledgeDocuments, listPlatformKnowledgeDocuments } from '@/services/knowledge'
import { buildSystemPrompt, REALTIME_TOOLS } from '@/ai/tools'
import { OPENAI_REALTIME_MODEL } from '@/constants'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'
import { getVoiceMinutesAvailability } from '@/services/aiUsage'
import type { PlanId } from '@/types'

// This endpoint mints a real OpenAI Realtime session on every call, so an
// unthrottled loop against it is a direct line to a large OpenAI bill —
// hence two layers of limiting below, not just one.
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_SESSIONS_PER_IP = 4 // per IP, per minute — in-memory, immediate
const MAX_SESSIONS_PER_AGENT = 8 // per agent, per minute — via Postgres, cross-instance

// Public endpoint — hit by the embeddable widget with no Supabase session, so
// it uses the admin client and only ever returns an OpenAI *ephemeral* secret,
// never OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY itself.
export async function POST(request: Request, props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  const ip = getClientIp(request)
  if (isRateLimited(`voice-session:ip:${ip}`, { windowMs: RATE_LIMIT_WINDOW_MS, max: MAX_SESSIONS_PER_IP })) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.' },
      { status: 429 }
    )
  }

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

  // Cross-instance guard: caps how many sessions this agent can start per
  // minute regardless of which serverless instance/region handled the
  // request. Uses `conversations`, which is already written on every call —
  // no new table needed.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count: recentSessions, error: countError } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .gte('started_at', windowStart)
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((recentSessions ?? 0) >= MAX_SESSIONS_PER_AGENT) {
    return NextResponse.json(
      { error: 'Este agente está recibiendo demasiadas llamadas ahora mismo. Intenta de nuevo en un minuto.' },
      { status: 429 }
    )
  }

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', agent.business_id)
    .single()
  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 })

  // Checked before minting anything from OpenAI — a call rejected here never
  // costs a cent, one rejected only after connecting already would have.
  // Included minutes reset monthly; once those and any purchased recharge
  // credits are both exhausted, the widget falls back to WhatsApp instead
  // (see FloatingWidgetLauncher's handling of this error).
  const { data: subscription } = await supabase
    .from('business_subscriptions')
    .select('plan, voice_credit_seconds_balance')
    .eq('business_id', business.id)
    .maybeSingle()
  const plan: PlanId = (subscription?.plan as PlanId) ?? 'free'
  const availability = await getVoiceMinutesAvailability(
    supabase,
    business.id,
    plan,
    subscription?.voice_credit_seconds_balance ?? 0
  )
  if (availability.availableSeconds <= 0) {
    return NextResponse.json(
      {
        error: 'no_voice_minutes',
        message:
          'Este negocio agotó sus minutos de voz disponibles este mes. Puede escribir por WhatsApp, o el negocio puede recargar minutos desde su panel.',
      },
      { status: 402 }
    )
  }

  const [listings, assignedListingIds, preventaProjects, assignedPreventaProjectIds, knowledgeDocs, platformKnowledgeDocs] =
    await Promise.all([
      listAiVisibleListings(supabase, business.id, agent.id),
      getAssignedListingIds(supabase, business.id, agent.id),
      listAiVisiblePreventaProjects(supabase, business.id, agent.id),
      getAssignedPreventaProjectIds(supabase, business.id, agent.id),
      listKnowledgeDocuments(supabase, business.id),
      listPlatformKnowledgeDocuments(supabase),
    ])
  const conversation = await startConversation(supabase, business.id, {
    agentId: agent.id,
    listingId,
    channel: 'widget_voice',
  })

  const systemPrompt = buildSystemPrompt({
    business,
    agent,
    listings,
    assignedListingIds,
    preventaProjects,
    assignedPreventaProjectIds,
    knowledgeDocs,
    platformKnowledgeDocs,
  })
  const turnDetection = {
    type: 'server_vad',
    threshold: Number(agent.sensitivity) || 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
  }

  // OpenAI retired /v1/realtime/sessions in favor of /v1/realtime/client_secrets,
  // which nests the session config under `session` and moves voice/turn_detection
  // under `session.audio.output`/`session.audio.input`.
  const openaiResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: OPENAI_REALTIME_MODEL,
        instructions: systemPrompt,
        tools: REALTIME_TOOLS,
        audio: {
          output: { voice: agent.voice },
          // transcription defaults to off in the GA API — without it, the
          // caller's side of the conversation is never transcribed, so
          // conversation.item.input_audio_transcription.completed never fires.
          // whisper-1, not gpt-4o-mini-transcribe: only whisper-1 officially
          // accepts a `language` hint. Without it, Spanish audio gets
          // transcribed with an English bias — the same bug DriveIA/
          // Beauty-Barber/Healthcare already hit and fixed this way.
          input: {
            turn_detection: turnDetection,
            transcription: { model: 'whisper-1', language: agent.language || undefined },
          },
        },
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
    turnDetection,
    clientSecret: session.value,
    expiresAt: session.expires_at,
  })
}
