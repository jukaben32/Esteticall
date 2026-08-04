import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { Website, WebsiteContent, BusinessService } from '@/types'
import type {
  WebsiteInput,
  WebsiteTeamMemberInput,
  WebsiteTestimonialInput,
  WebsiteSpecialtyInput,
  WebsiteFaqInput,
} from '@/validations'

type DB = SupabaseClient<Database>

export interface SaveWebsiteContentInput {
  website: WebsiteInput
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

async function listFeaturedServices(supabase: DB, businessId: string, ids: string[]): Promise<BusinessService[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('business_services').select('*').eq('business_id', businessId).in('id', ids)
  if (error) throw error
  return data ?? []
}

// Everything the builder's left panel (and the public site) needs in one
// round trip: the website row plus its four child lists.
export async function getWebsiteContentForBusiness(supabase: DB, businessId: string): Promise<WebsiteContent> {
  const website = await getOrCreateWebsiteForBusiness(supabase, businessId)
  const [{ data: teamMembers }, { data: testimonials }, { data: specialties }, { data: faqs }] = await Promise.all([
    supabase.from('website_team_members').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_testimonials').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_specialties').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_faqs').select('*').eq('business_id', businessId).order('sort_order'),
  ])
  const featuredServices = await listFeaturedServices(supabase, businessId, website.featured_service_ids ?? [])
  return {
    website,
    teamMembers: teamMembers ?? [],
    testimonials: testimonials ?? [],
    specialties: specialties ?? [],
    faqs: faqs ?? [],
    featuredServices,
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
  const [{ data: teamMembers }, { data: testimonials }, { data: specialties }, { data: faqs }] = await Promise.all([
    supabase.from('website_team_members').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_testimonials').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_specialties').select('*').eq('business_id', businessId).order('sort_order'),
    supabase.from('website_faqs').select('*').eq('business_id', businessId).order('sort_order'),
  ])
  const featuredServices = await listFeaturedServices(supabase, businessId, website.featured_service_ids ?? [])
  return {
    website,
    teamMembers: teamMembers ?? [],
    testimonials: testimonials ?? [],
    specialties: specialties ?? [],
    faqs: faqs ?? [],
    featuredServices,
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
        featured_service_ids: input.featuredServiceIds,
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

// The builder's dynamic lists (Team, Testimonials, Specialties, FAQ) are
// replaced wholesale on every Save — simpler and safer than diffing
// client-side temp ids against DB ids, and these lists are small (a handful
// of rows) so a delete+insert is cheap and avoids partial-save bugs.
async function replaceList<T extends { id?: string; sortOrder: number }>(
  supabase: DB,
  table: 'website_team_members' | 'website_testimonials' | 'website_specialties' | 'website_faqs',
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
