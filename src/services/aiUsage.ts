import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { PlanId } from '@/types'
import { PLAN_LIMITS } from '@/constants'

type DB = SupabaseClient<Database>

// OpenAI pricing (per developers.openai.com/api/docs/pricing, checked Aug 2026).
const CHAT_MODEL_PRICING_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
}
const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'

// gpt-realtime audio pricing: $32/1M input tokens, $64/1M output tokens.
// A minute of input (caller) audio is ~600 tokens; a minute of generated (agent) speech is ~1200 tokens.
// Voice calls only record total duration, not separate input/output time, so this estimates both
// channels running for the full call duration — a reasonable upper-bound proxy, not exact metering.
// Plus gpt-4o-mini-transcribe (used for input transcription on this repo's realtime sessions): ~$0.003/min.
const REALTIME_VOICE_COST_PER_SECOND_USD = (600 / 60) * (32 / 1_000_000) + (1200 / 60) * (64 / 1_000_000) + 0.003 / 60

export function chatCompletionCostUsd(inputTokens: number, outputTokens: number, model: string = DEFAULT_CHAT_MODEL) {
  const pricing = CHAT_MODEL_PRICING_PER_MILLION_TOKENS[model] ?? CHAT_MODEL_PRICING_PER_MILLION_TOKENS[DEFAULT_CHAT_MODEL]
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

export function realtimeVoiceCostUsd(durationSeconds: number) {
  return Math.max(durationSeconds, 0) * REALTIME_VOICE_COST_PER_SECOND_USD
}

export async function logAiUsage(
  supabase: DB,
  params: {
    businessId: string
    conversationId?: string | null
    kind: 'chat_completion' | 'realtime_voice'
    inputTokens?: number | null
    outputTokens?: number | null
    durationSeconds?: number | null
    costUsd: number
  }
) {
  const { error } = await supabase.from('ai_usage_events').insert({
    business_id: params.businessId,
    conversation_id: params.conversationId ?? null,
    kind: params.kind,
    input_tokens: params.inputTokens ?? null,
    output_tokens: params.outputTokens ?? null,
    duration_seconds: params.durationSeconds ?? null,
    cost_usd: params.costUsd,
  })
  if (error) {
    console.error('Failed to log AI usage event', error)
  }
}

export async function getAiSpendUsd(supabase: DB, businessId: string, sinceIso?: string) {
  let query = supabase.from('ai_usage_events').select('cost_usd').eq('business_id', businessId)
  if (sinceIso) {
    query = query.gte('created_at', sinceIso)
  }
  const { data, error } = await query
  if (error) {
    console.error('Failed to load AI spend', error)
    return 0
  }
  return (data ?? []).reduce((sum, row) => sum + (row.cost_usd ?? 0), 0)
}

function startOfCurrentMonthIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

// Total realtime-voice seconds this business has used since the start of
// the current calendar month — the plan's included-minutes allowance resets
// on this same boundary, independent of any Stripe billing-cycle date, so it
// still works for the Free plan (which never has a Stripe subscription).
export async function getVoiceSecondsUsedThisMonth(supabase: DB, businessId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ai_usage_events')
    .select('duration_seconds')
    .eq('business_id', businessId)
    .eq('kind', 'realtime_voice')
    .gte('created_at', startOfCurrentMonthIso())
  if (error) {
    console.error('Failed to load voice usage', error)
    return 0
  }
  return (data ?? []).reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0)
}

export interface VoiceMinutesAvailability {
  plan: PlanId
  usedSecondsThisMonth: number
  includedSecondsThisMonth: number
  remainingIncludedSeconds: number
  creditSecondsBalance: number
  availableSeconds: number
}

// The single source of truth for "can this business start a voice call right
// now" — checked before minting an OpenAI Realtime session, since a call
// that's rejected here never costs a cent, while one rejected only after
// connecting already would have.
export async function getVoiceMinutesAvailability(
  supabase: DB,
  businessId: string,
  plan: PlanId,
  creditSecondsBalance: number
): Promise<VoiceMinutesAvailability> {
  const usedSecondsThisMonth = await getVoiceSecondsUsedThisMonth(supabase, businessId)
  const includedSecondsThisMonth = PLAN_LIMITS[plan].includedVoiceMinutes * 60
  const remainingIncludedSeconds = Math.max(0, includedSecondsThisMonth - usedSecondsThisMonth)
  const safeCreditSeconds = Math.max(0, creditSecondsBalance)
  return {
    plan,
    usedSecondsThisMonth,
    includedSecondsThisMonth,
    remainingIncludedSeconds,
    creditSecondsBalance: safeCreditSeconds,
    availableSeconds: remainingIncludedSeconds + safeCreditSeconds,
  }
}

// Called once a call ends, after its duration is known. A call that was
// already fully covered by the plan's included minutes touches nothing; one
// that crossed into (or started past) the included allowance spends the
// overflow portion — never the whole call — from the purchased credit
// balance, via the atomic SQL function (see schema.sql) rather than a
// read-then-write from here.
export async function applyVoiceUsageOverflowToCredits(
  supabase: DB,
  businessId: string,
  plan: PlanId,
  durationSeconds: number,
  usedSecondsBeforeThisCall: number
): Promise<void> {
  const includedSecondsThisMonth = PLAN_LIMITS[plan].includedVoiceMinutes * 60
  const usedBefore = Math.max(0, usedSecondsBeforeThisCall)
  const usedAfter = usedBefore + Math.max(0, durationSeconds)
  const overflowSeconds = Math.max(0, usedAfter - includedSecondsThisMonth) - Math.max(0, usedBefore - includedSecondsThisMonth)
  if (overflowSeconds <= 0) return

  const { error } = await supabase.rpc('adjust_voice_credit_balance' as never, {
    p_business_id: businessId,
    p_delta_seconds: -overflowSeconds,
  } as never)
  if (error) console.error('Failed to apply voice usage overflow to credits', error)
}
