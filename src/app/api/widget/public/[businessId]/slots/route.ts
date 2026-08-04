import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots } from '@/services/appointments'

export const dynamic = 'force-dynamic'

// Public, unauthenticated: powers "Pick a Date" / "Pick a Time" in the Book
// tab. Same slot-generation logic the AI agent's book_viewing tool uses.
export async function GET(request: Request, { params }: { params: { businessId: string } }) {
  const supabase = createAdminClient()
  const url = new URL(request.url)
  const fromDateParam = url.searchParams.get('fromDate')
  const daysAheadParam = url.searchParams.get('daysAhead')

  const slots = await getAvailableSlots(supabase, params.businessId, {
    fromDate: fromDateParam ? new Date(fromDateParam) : undefined,
    daysAhead: daysAheadParam ? Number(daysAheadParam) : 30,
  })
  return NextResponse.json({ slots })
}
