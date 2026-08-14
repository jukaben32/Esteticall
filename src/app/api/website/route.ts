import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, updateBusiness, getBusinessBySlug, getSubscription } from '@/services/businesses'
import { getWebsiteContentForBusiness, saveWebsiteContent } from '@/services/websites'
import { saveWebsiteContentSchema, websiteSiteUrlSchema } from '@/validations'

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

// GET returns the full builder payload: the website row plus its Team /
// Testimonials / Specialties / FAQ lists and the resolved featured-service
// objects, all in one round trip (WebsiteContent).
export async function GET() {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  const content = await getWebsiteContentForBusiness(ctx.supabase, ctx.business.id)
  return NextResponse.json({ ...content, slug: ctx.business.slug })
}

// PUT saves everything the "Save" button covers in one shot: the website
// row and a full replace of the four dynamic lists. Site URL (businesses.slug)
// is a separate optional field in the same body since it lives on a
// different table and needs its own uniqueness check.
export async function PUT(request: Request) {
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })

  const body = await request.json()
  const parsed = saveWebsiteContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  if (typeof body.slug === 'string' && body.slug !== ctx.business.slug) {
    const slugCheck = websiteSiteUrlSchema.safeParse({ slug: body.slug })
    if (!slugCheck.success) {
      return NextResponse.json({ error: slugCheck.error.issues[0]?.message }, { status: 400 })
    }
    const existing = await getBusinessBySlug(ctx.supabase, slugCheck.data.slug)
    if (existing && existing.id !== ctx.business.id) {
      return NextResponse.json({ error: 'That site URL is already taken' }, { status: 409 })
    }
    await updateBusiness(ctx.supabase, ctx.business.id, { slug: slugCheck.data.slug })
  }

  // The client only redirects to Stripe Checkout when it locally believes
  // the add-on isn't enabled — that's a UX nicety, not enforcement. Re-check
  // server-side so a direct PUT can't publish for free.
  if (parsed.data.website.isPublished) {
    const subscription = await getSubscription(ctx.supabase, ctx.business.id)
    if (!subscription?.website_builder_enabled) {
      return NextResponse.json(
        { error: 'The Website Builder add-on is required to publish your site — upgrade first.' },
        { status: 402 }
      )
    }
  }

  const content = await saveWebsiteContent(ctx.supabase, ctx.business.id, parsed.data)
  const business = await getBusinessForOwner(ctx.supabase, (await ctx.supabase.auth.getUser()).data.user!.id)
  return NextResponse.json({ ...content, slug: business?.slug ?? ctx.business.slug })
}
