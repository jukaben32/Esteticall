import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { websiteSubscriberSchema } from '@/validations'
import { getBusinessById } from '@/services/businesses'
import { createWebsiteSubscriber } from '@/services/websites'
import { sendNewWebsiteLeadEmail } from '@/services/email'

// Public endpoint — hit from the unauthenticated /sites/[slug] page (Contact
// lead form and any other opt-in source), so it always uses the admin
// client and takes businessId straight from the page's own already-public
// content, the same way FloatingWidgetLauncher does.
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = websiteSubscriberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid data' }, { status: 400 })
  }

  const admin = createAdminClient()
  const business = await getBusinessById(admin, parsed.data.businessId)
  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const subscriber = await createWebsiteSubscriber(admin, business.id, {
    email: parsed.data.email,
    name: parsed.data.name ?? null,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message ?? null,
    source: parsed.data.source,
  })

  const isLead = subscriber.source === 'contact_form'

  await Promise.all([
    business.contact_email
      ? sendNewWebsiteLeadEmail({
          to: business.contact_email,
          businessName: business.name,
          name: subscriber.name ?? undefined,
          email: subscriber.email,
          phone: subscriber.phone ?? undefined,
          message: subscriber.message ?? undefined,
        }).catch(() => {})
      : Promise.resolve(),
    admin.from('notifications').insert({
      business_id: business.id,
      type: 'system',
      title: isLead ? 'New website lead' : 'New website subscriber',
      body: `${subscriber.name || subscriber.email} submitted the website ${isLead ? 'contact form' : 'sign-up form'}.`,
    }),
  ])

  return NextResponse.json({ subscriber }, { status: 201 })
}
