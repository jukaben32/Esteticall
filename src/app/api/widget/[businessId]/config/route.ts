import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicWidgetConfig } from '@/services/widgets'

// Admin-client fetches here aren't tied to a request's cookies/headers, so
// Next's Data Cache would otherwise cache them indefinitely — e.g. serving a
// stale "no live agent" answer forever after the agent goes live.
export const dynamic = 'force-dynamic'

// Fetched by the embed script (<script src=".../widget.js" data-business="...">)
// on any third-party site — public by design, so only non-sensitive config
// is ever returned here.
export async function GET(_request: Request, { params }: { params: { businessId: string } }) {
  const supabase = createAdminClient()
  const config = await getPublicWidgetConfig(supabase, params.businessId)

  if (!config) {
    return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 })
  }

  const { data: agent, error: agentError } = await supabase
    .from('ai_agents')
    .select('id, name')
    .eq('business_id', params.businessId)
    .eq('status', 'live')
    .limit(1)
    .maybeSingle()

  const { data: allAgentsForBusiness, error: allErr } = await supabase
    .from('ai_agents')
    .select('id, name, status, business_id')
    .eq('business_id', params.businessId)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null
  const serviceKeyPresent = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const serviceKeyLen = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0

  const rawUrl = `${supabaseUrl}/rest/v1/ai_agents?business_id=eq.${params.businessId}&status=eq.live&select=id,name`
  const rawRes = await fetch(rawUrl, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    cache: 'no-store',
  })
  const rawJson = await rawRes.json().catch(() => null)

  return NextResponse.json({
    ...config,
    agentId: agent?.id ?? null,
    agentName: agent?.name ?? null,
    _debugBusinessId: params.businessId,
    _debugAgentError: agentError ? { message: agentError.message, code: agentError.code, details: agentError.details } : null,
    _debugAllAgents: allAgentsForBusiness,
    _debugAllErr: allErr ? { message: allErr.message, code: allErr.code } : null,
    _debugSupabaseUrl: supabaseUrl,
    _debugServiceKeyPresent: serviceKeyPresent,
    _debugServiceKeyLen: serviceKeyLen,
    _debugRawStatus: rawRes.status,
    _debugRawJson: rawJson,
  })
}
