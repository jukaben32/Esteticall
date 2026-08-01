import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { deleteListingPhoto, setListingCoverPhoto, getListingById } from '@/services/listings'

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

// Marca esta foto como portada de la propiedad.
export async function PATCH(_request: Request, { params }: { params: { listingId: string; photoId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await setListingCoverPhoto(ctx.supabase, ctx.business.id, params.listingId, params.photoId)
  const listing = await getListingById(ctx.supabase, ctx.business.id, params.listingId)
  return NextResponse.json({ listing })
}

export async function DELETE(_request: Request, { params }: { params: { listingId: string; photoId: string } }) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deleteListingPhoto(ctx.supabase, ctx.business.id, params.photoId)
  const listing = await getListingById(ctx.supabase, ctx.business.id, params.listingId)
  return NextResponse.json({ listing })
}
