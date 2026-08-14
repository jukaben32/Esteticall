import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { executeAiTool } from '@/ai/executeTool'

// Single relay endpoint for every OpenAI Realtime function call. The browser
// never talks to Supabase directly — it only knows a conversationId, and this
// route resolves conversationId -> business_id server-side (admin client)
// before touching any tenant data, so a caller can't spoof another business.
// Actual tool business logic lives in executeAiTool, shared with the
// WhatsApp text-mode agent (src/ai/textAgent.ts) so behavior can never
// diverge by channel.
export async function POST(request: Request) {
  const { conversationId, name, arguments: args } = await request.json()
  const supabase = createAdminClient()

  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()
  if (error || !conversation) {
    return NextResponse.json({ error: 'Unknown conversation' }, { status: 404 })
  }

  try {
    const result = await executeAiTool(
      supabase,
      { conversationId, businessId: conversation.business_id, agentId: conversation.agent_id, clientSource: 'ai_call' },
      name,
      args
    )
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed'
    // The AI just apologizes and moves on when a tool call fails, so without
    // this the failure is invisible everywhere — nothing else logs it.
    console.error(`[ai/tools] ${name} failed for conversation ${conversationId}:`, err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
