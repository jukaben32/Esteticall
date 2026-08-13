import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ConversationMessage } from '@/types'
import { chatCompletionCostUsd, logAiUsage } from './aiUsage'

type DB = SupabaseClient<Database>

export type Sentiment = 'positive' | 'neutral' | 'negative'

// Cheap post-call classification of the caller's overall sentiment, run once
// a conversation ends (see /api/conversations/[conversationId]/end). Uses a
// plain Chat Completions call rather than the Realtime session itself, since
// this only needs to run once against the finished transcript. Returns null
// (not a guess) whenever there's nothing to classify or the call fails, so
// the Call Log shows "—" instead of a fabricated sentiment.
export async function analyzeSentiment(
  messages: ConversationMessage[],
  usageCtx?: { supabase: DB; businessId: string; conversationId: string }
): Promise<Sentiment | null> {
  const transcript = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'agent' ? 'Agente' : 'Cliente'}: ${m.content}`)
    .join('\n')
    .trim()

  if (!transcript) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'You classify the overall sentiment of the CLIENT (not the AI agent) in a real estate phone call ' +
              'transcript. Reply with JSON only: {"sentiment": "positive" | "neutral" | "negative"}. ' +
              'positive = interested, satisfied, enthusiastic about a property or booking. ' +
              'negative = frustrated, annoyed, uninterested, or complained. ' +
              'neutral = purely informational, undecided, or the tone is unclear.',
          },
          { role: 'user', content: transcript.slice(0, 6000) },
        ],
      }),
    })
    if (!res.ok) return null

    const data = await res.json()

    if (usageCtx) {
      const inputTokens = data?.usage?.prompt_tokens ?? 0
      const outputTokens = data?.usage?.completion_tokens ?? 0
      await logAiUsage(usageCtx.supabase, {
        businessId: usageCtx.businessId,
        conversationId: usageCtx.conversationId,
        kind: 'chat_completion',
        inputTokens,
        outputTokens,
        costUsd: chatCompletionCostUsd(inputTokens, outputTokens, 'gpt-4o-mini'),
      })
    }

    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    if (parsed.sentiment === 'positive' || parsed.sentiment === 'neutral' || parsed.sentiment === 'negative') {
      return parsed.sentiment
    }
    return null
  } catch {
    return null
  }
}
