import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { updateListing, deleteListing } from '@/services/listings'

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

export async function PATCH(request: Request, { params }: { params: { listingId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const patch = await request.json()
  const listing = await updateListing(ctx.supabase, ctx.business.id, params.listingId, patch)
  return NextResponse.json({ listing })
}

export async function DELETE(_request: Request, { params }: { params: { listingId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deleteListing(ctx.supabase, ctx.business.id, params.listingId)
  return NextResponse.json({ ok: true })
}
