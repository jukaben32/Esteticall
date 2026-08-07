import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Website, WebsiteContent, WebsiteSpecialty } from '@/types'
import type {
  WebsiteInput,
  WebsiteServiceInput,
  WebsiteTeamMemberInput,
  WebsiteTestimonialInput,
  WebsiteSpecialtyInput,
  WebsiteFaqInput,
} from '@/validations'
import { DEFAULT_WEBSITE_SPECIALTIES } from '@/constants'

type DB = SupabaseClient<Database>

export interface SaveWebsiteContentInput {
  website: WebsiteInput
  services: WebsiteServiceInput[]
  teamMembers: WebsiteTeamMemberInput[]
  testimonials: WebsiteTestimonialInput[]
  specialties: WebsiteSpecialtyInput[]
  faqs: WebsiteFaqInput[]
}

export async function getWebsiteForBusiness(supabase: DB, businessId: string): Promise<Website | null> {
  const { data, error } = await supabase.from('websites').select('*').eq('business_id', businessId).maybeSingle()
  if (error) throw error
  return data
}

// Ensures every business has a websites row to edit, even before the first
// Save — the builder always has something to render into the live preview.
export async function getOrCreateWebsiteForBusiness(supabase: DB, businessId: string): Promise<Website> {
  const existing = await getWebsiteForBusiness(supabase, businessId)
  if (existing) return existing
  const { data, error } = await supabase
    .from('websites')
    .insert({ business_id: businessId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

// A brand-new (or never-touched) business has zero rows here, which left
// the builder's "Partners & Lenders" panel showing nothing but a bare
// "+ Add Insurance" button — no sense of what belongs there, unlike the
// reference template's pre-filled starting list. Seeded lazily, the first
// time the panel is actually loaded empty, rather than at business-creation
// time, so it also backfills businesses that already exist.
async function seedDefaultSpecialtiesIfEmpty(
  supabase: DB,
  businessId: string,
  existing: WebsiteSpecialty[]
): Promise<WebsiteSpecialty[]> {
  if (existing.length > 0) return existing
  const rows = DEFAULT_WEBSITE_SPECIALTIES.map((label, i) => ({ business_id: businessId, label, sort_order: i }))
  const { data, error } = await supabase.from('website_specialties').insert(rows).select('*')
  if (error) throw error
  return data ?? []
}

// Everything the builder's left panel (and the public site) needs in one
// round trip: the website row plus its five child lists.
export async function getWebsiteContentForBusiness(supabase: DB, businessId: string): Promise<WebsiteContent> {
  const website = await getOrCreateWebsiteForBusiness(supabase, businessId)
  const [{ data: services }, { data: teamMembers }, { data: testimonials }, { data: specialties }, { data: faqs }] =
    await Promise.all([
      supabase.from('website_services').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_team_members').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_testimonials').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_specialties').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_faqs').select('*').eq('business_id', businessId).order('sort_order'),
    ])
  return {
    website,
    services: services ?? [],
    teamMembers: teamMembers ?? [],
    testimonials: testimonials ?? [],
    specialties: await seedDefaultSpecialtiesIfEmpty(supabase, businessId, specialties ?? []),
    faqs: faqs ?? [],
  }
}

// Same shape, but only for a published site — used by /sites/[slug]. Returns
// null if the business hasn't published (or doesn't exist), so the caller
// can 404 without leaking unpublished draft content.
export async function getPublishedWebsiteContent(supabase: DB, businessId: string): Promise<WebsiteContent | null> {
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_published', true)
    .maybeSingle()
  if (!website) return null
  const [{ data: services }, { data: teamMembers }, { data: testimonials }, { data: specialties }, { data: faqs }] =
    await Promise.all([
      supabase.from('website_services').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_team_members').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_testimonials').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_specialties').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_faqs').select('*').eq('business_id', businessId).order('sort_order'),
    ])
  return {
    website,
    services: services ?? [],
    teamMembers: teamMembers ?? [],
    testimonials: testimonials ?? [],
    specialties: specialties ?? [],
    faqs: faqs ?? [],
  }
}

export async function upsertWebsite(supabase: DB, businessId: string, input: WebsiteInput): Promise<Website> {
  const { data, error } = await supabase
    .from('websites')
    .upsert(
      {
        business_id: businessId,
        is_published: input.isPublished,
        headline: input.headline || null,
        about: input.about || null,
        theme: input.theme,
        template: input.template,
        primary_color: input.primaryColor,
        secondary_color: input.secondaryColor,
        font: input.font,
        ai_agent_id: input.aiAgentId || null,
        logo_url: input.logoUrl || null,
        site_title: input.siteTitle || null,
        site_description: input.siteDescription || null,
        hero_subheadline: input.heroSubheadline || null,
        hero_image_url: input.heroImageUrl || null,
        cta_primary_text: input.ctaPrimaryText,
        cta_secondary_text: input.ctaSecondaryText,
        years_experience: input.yearsExperience ?? null,
        clients_served: input.clientsServed ?? null,
        satisfaction_pct: input.satisfactionPct ?? null,
        about_title: input.aboutTitle,
        about_story: input.aboutStory || null,
        about_photo_url: input.aboutPhotoUrl || null,
        trust_badges: input.trustBadges,
        footer_tagline: input.footerTagline || null,
        footer_copyright: input.footerCopyright || null,
        contact_phone: input.contactPhone || null,
        contact_email: input.contactEmail || null,
        contact_address: input.contactAddress || null,
        contact_hours: input.contactHours || null,
        contact_maps_url: input.contactMapsUrl || null,
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return data
}

// The builder's dynamic lists (Services, Team, Testimonials, Specialties,
// FAQ) are replaced wholesale on every Save — simpler and safer than
// diffing client-side temp ids against DB ids, and these lists are small (a
// handful of rows) so a delete+insert is cheap and avoids partial-save bugs.
async function replaceList<T extends { id?: string; sortOrder: number }>(
  supabase: DB,
  table: 'website_services' | 'website_team_members' | 'website_testimonials' | 'website_specialties' | 'website_faqs',
  businessId: string,
  items: T[],
  toRow: (item: T, index: number) => Record<string, unknown>
) {
  const { error: delError } = await supabase.from(table).delete().eq('business_id', businessId)
  if (delError) throw delError
  if (items.length === 0) return
  const rows = items.map((item, index) => ({ business_id: businessId, ...toRow(item, index) }))
  const { error: insError } = await supabase.from(table).insert(rows)
  if (insError) throw insError
}

export async function saveWebsiteContent(
  supabase: DB,
  businessId: string,
  input: SaveWebsiteContentInput
): Promise<WebsiteContent> {
  await upsertWebsite(supabase, businessId, input.website)

  await replaceList(supabase, 'website_services', businessId, input.services, (s, i) => ({
    icon: s.icon,
    name: s.name,
    description: s.description || null,
    duration: s.duration || null,
    price: s.price || null,
    sort_order: i,
  }))
  await replaceList(supabase, 'website_team_members', businessId, input.teamMembers, (m, i) => ({
    name: m.name,
    role: m.role,
    bio: m.bio || null,
    photo_url: m.photoUrl || null,
    sort_order: i,
  }))
  await replaceList(supabase, 'website_testimonials', businessId, input.testimonials, (t, i) => ({
    quote: t.quote,
    author_name: t.authorName,
    author_role: t.authorRole || null,
    rating: t.rating,
    sort_order: i,
  }))
  await replaceList(supabase, 'website_specialties', businessId, input.specialties, (s, i) => ({
    label: s.label,
    sort_order: i,
  }))
  await replaceList(supabase, 'website_faqs', businessId, input.faqs, (f, i) => ({
    question: f.question,
    answer: f.answer,
    sort_order: i,
  }))

  return getWebsiteContentForBusiness(supabase, businessId)
}
