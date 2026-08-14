import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listAiVisibleListings } from '@/services/listings'

export const dynamic = 'force-dynamic'

// Public, unauthenticated: powers "Property Interest" in the Book form of
// the floating widget on the public site / embed script. An optional
// ?agentId= (the widget's bound agent) narrows the dropdown to that agent's
// assigned listings, same rule as the AI conversation itself.
export async function GET(request: Request, props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const agentId = new URL(request.url).searchParams.get('agentId')
  const supabase = createAdminClient()
  const listings = await listAiVisibleListings(supabase, params.businessId, agentId)
  return NextResponse.json({
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      listingCode: l.listing_code,
    })),
  })
}
