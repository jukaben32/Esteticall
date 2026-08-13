import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listServicesForBusiness } from '@/services/businessServices'

export const dynamic = 'force-dynamic'

// Public, unauthenticated: powers "Select a Service" in the Book tab of the
// floating widget on the public site / embed script.
export async function GET(_request: Request, props: { params: Promise<{ businessId: string }> }) {
  const params = await props.params;
  const supabase = createAdminClient()
  const services = await listServicesForBusiness(supabase, params.businessId)
  return NextResponse.json({
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      priceMax: s.price_max,
      priceType: s.price_type,
      durationMinutes: s.duration_minutes,
    })),
  })
}
