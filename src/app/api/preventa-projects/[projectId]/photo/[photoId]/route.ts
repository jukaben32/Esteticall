import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { deletePreventaProjectPhoto, getPreventaProjectById, setPreventaProjectCoverPhoto } from '@/services/preventaProjects'

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

// Marca esta foto como portada del proyecto.
export async function PATCH(
  _request: Request,
  props: { params: Promise<{ projectId: string; photoId: string }> }
) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await setPreventaProjectCoverPhoto(ctx.supabase, ctx.business.id, params.projectId, params.photoId)
  const project = await getPreventaProjectById(ctx.supabase, ctx.business.id, params.projectId)
  return NextResponse.json({ project })
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ projectId: string; photoId: string }> }
) {
  const params = await props.params
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  await deletePreventaProjectPhoto(ctx.supabase, ctx.business.id, params.photoId)
  const project = await getPreventaProjectById(ctx.supabase, ctx.business.id, params.projectId)
  return NextResponse.json({ project })
}
