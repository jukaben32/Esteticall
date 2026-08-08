import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { REALTIME_TOOLS } from './tools'
import { executeAiTool } from './executeTool'

type DB = SupabaseClient<Database>

// Cheap, good-enough model for text turns — no realtime/voice constraints
// here, so there's no reason to reach for anything pricier. Revisit only if
// WhatsApp volume makes cost or quality an actual problem (see ESTADO.md's
// note against building model-routing infra before it's needed).
const CHAT_MODEL = 'gpt-4o-mini'
const MAX_TOOL_ROUNDS = 5

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>
  tool_call_id?: string
}

// Realtime tool defs are already {type:'function', name, description, parameters}
// (flat) — Chat Completions wants them nested under `function`.
function toChatCompletionTools() {
  return REALTIME_TOOLS.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

// Runs one WhatsApp turn to completion: sends the conversation so far to
// OpenAI, executes any tool calls the model makes (via the same
// executeAiTool used by the voice/widget relay, so booking/lead logic can't
// diverge by channel), and loops until the model returns a plain text reply.
export async function runWhatsappAgentTurn(
  supabase: DB,
  ctx: {
    businessId: string
    conversationId: string
    systemPrompt: string
    history: Array<{ role: 'user' | 'assistant'; content: string | null }>
  }
): Promise<string> {
  const messages: ChatMessage[] = [{ role: 'system', content: ctx.systemPrompt }, ...ctx.history]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        tools: toChatCompletionTools(),
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`OpenAI Chat Completions error: ${detail}`)
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message
    if (!message) throw new Error('OpenAI Chat Completions returned no message')

    if (!message.tool_calls?.length) {
      return message.content ?? ''
    }

    messages.push({ role: 'assistant', content: message.content ?? null, tool_calls: message.tool_calls })

    for (const call of message.tool_calls) {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        // Malformed arguments from the model — proceed with no args rather
        // than fail the whole turn; the tool will just return empty results.
      }

      let result: unknown
      try {
        result = await executeAiTool(
          supabase,
          { conversationId: ctx.conversationId, businessId: ctx.businessId, clientSource: 'whatsapp' },
          call.function.name,
          args
        )
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Tool execution failed' }
      }

      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
    }
  }

  return 'Perdón, tuve un problema procesando tu mensaje — en breve te contacta alguien del equipo.'
}
