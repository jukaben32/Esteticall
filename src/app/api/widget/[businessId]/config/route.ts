import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicWidgetConfig, incrementWidgetImpressions } from '@/services/widgets'

// Admin-client fetches here aren't tied to a request's cookies/headers, so
// Next's Data Cache would otherwise cache them indefinitely — e.g. serving a
// stale "no live agent" answer forever after the agent goes live.
export const dynamic = 'force-dynamic'

// Fetched by the embed script (<script src=".../api/widget-script"
// data-business-id="..." data-agent-id="..."> on any third-party site — public
// by design, so only non-sensitive config is ever returned here. Each hit
// counts as one impression for the matched widget.
export async function GET(request: Request, { params }: { params: { businessId: string } }) {
  const supabase = createAdminClient()
  const agentId = new URL(request.url).searchParams.get('agentId')
  const config = await getPublicWidgetConfig(supabase, params.businessId, agentId)

  if (!config) {
    return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 })
  }

  // Plain select + client-side filter — chaining .eq('status', 'live') with
  // .maybeSingle() here was silently returning no rows against a live agent
  // (confirmed against a raw REST call with the identical filter), so avoid
  // that combination and filter in JS instead.
  const { data: agents, error: agentsError } = await supabase
    .from('ai_agents')
    .select('id, name, status')
    .eq('business_id', params.businessId)
  if (agentsError) return NextResponse.json({ error: agentsError.message }, { status: 500 })

  const agent = config.agent_id
    ? (agents?.find((a) => a.id === config.agent_id) ?? null)
    : (agents?.find((a) => a.status === 'live') ?? null)

  incrementWidgetImpressions(supabase, config.id).catch(() => {
    // Best-effort — a failed counter write should never break the widget itself.
  })

  return NextResponse.json({
    widgetId: config.id,
    widgetName: config.name,
    position: config.position,
    theme: config.theme,
    primary_color: config.primary_color,
    greeting_message: config.greeting_message,
    agentId: agent?.id ?? null,
    agentName: agent?.name ?? null,
  })
}
