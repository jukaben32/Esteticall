import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPublicWidgetConfig } from '@/services/widgets'

// Fetched by the embed script (<script src=".../widget.js" data-business="...">)
// on any third-party site — public by design, so only non-sensitive config
// is ever returned here.
export async function GET(_request: Request, { params }: { params: { businessId: string } }) {
  const supabase = createAdminClient()
  const config = await getPublicWidgetConfig(supabase, params.businessId)

  if (!config) {
    return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 })
  }

  const { data: agent } = await supabase
    .from('ai_agents')
    .select('id, name')
    .eq('business_id', params.businessId)
    .eq('status', 'live')
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ ...config, agentId: agent?.id ?? null, agentName: agent?.name ?? null })
}
