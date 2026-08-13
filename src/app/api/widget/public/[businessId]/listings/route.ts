import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listAiVisibleListings } from '@/services/listings'

export const dynamic = 'force-dynamic'

// Public, unauthenticated: powers "Property Interest" in the Book form of
// the floating widget on the public site / embed script.
export async function GET(_request: Request, props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = createAdminClient()
  const listings = await listAiVisibleListings(supabase, params.businessId)
  return NextResponse.json({
    listings: listings.map((l) => ({
      id: l.id,
      title: l.title,
      listingCode: l.listing_code,
    })),
  })
}
