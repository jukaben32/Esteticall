import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listServicesForBusiness, createService, createServicesBulk } from '@/services/businessServices'
import { businessServiceSchema } from '@/validations'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { supabase, business }
}

export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const services = await listServicesForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ services })
}

export async function POST(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()

  // Bulk path: { items: [...] } — used by "Select all" in the catalog gallery.
  if (Array.isArray(body.items)) {
    const parsedItems = body.items.map((item: unknown) => businessServiceSchema.safeParse(item))
    const failed = parsedItems.find((p: ReturnType<typeof businessServiceSchema.safeParse>) => !p.success)
    if (failed && !failed.success) {
      return NextResponse.json({ error: failed.error.issues[0]?.message }, { status: 400 })
    }
    const services = await createServicesBulk(
      ctx.supabase,
      ctx.business.id,
      parsedItems.map((p: ReturnType<typeof businessServiceSchema.safeParse>) => (p.success ? p.data : null)).filter(Boolean)
    )
    return NextResponse.json({ services })
  }

  const parsed = businessServiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const service = await createService(ctx.supabase, ctx.business.id, parsed.data)
  return NextResponse.json({ service })
}
