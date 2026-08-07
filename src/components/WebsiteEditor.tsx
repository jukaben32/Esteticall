'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  Plus,
  Trash2,
  ExternalLink,
  Pencil,
  Lock,
  Check,
  Palette,
  Image as ImageIcon,
  UploadCloud,
  FileText,
  Briefcase,
  UsersRound,
  Quote,
  Handshake,
  HelpCircle,
  Phone,
  PanelBottom,
  Globe,
} from 'lucide-react'
import type { Business, AiAgent, BusinessService, WebsiteContent } from '@/types'
import { WEBSITE_BUILDER_PRICE_USD, WEBSITE_BUILDER_FEATURES } from '@/constants'
import { WebsiteTemplateRenderer } from './WebsiteTemplateRenderer'

const TEMPLATES = [
  { id: 'clarity', name: 'Clarity', tagline: 'Clean · Minimal · White' },
  { id: 'pulse', name: 'Pulse', tagline: 'Bold · Dark · Modern' },
  { id: 'serenity', name: 'Serenity', tagline: 'Warm · Soft · Elegant' },
] as const

const FONTS = [
  { id: 'inter', label: 'Inter (Sans)' },
  { id: 'playfair', label: 'Playfair (Serif)' },
  { id: 'poppins', label: 'Poppins (Round)' },
] as const

type TeamMemberForm = { id?: string; name: string; role: string; bio: string; photoUrl: string; sortOrder: number }
type TestimonialForm = {
  id?: string
  quote: string
  authorName: string
  authorRole: string
  rating: number
  sortOrder: number
}
type SpecialtyForm = { id?: string; label: string; sortOrder: number }
type FaqForm = { id?: string; question: string; answer: string; sortOrder: number }

interface FormState {
  isPublished: boolean
  headline: string
  about: string
  theme: 'light' | 'dark'
  template: 'clarity' | 'pulse' | 'serenity'
  primaryColor: string
  secondaryColor: string
  font: 'inter' | 'playfair' | 'poppins'
  aiAgentId: string | null
  logoUrl: string
  siteTitle: string
  siteDescription: string
  heroSubheadline: string
  heroImageUrl: string
  ctaPrimaryText: string
  ctaSecondaryText: string
  yearsExperience: string
  clientsServed: string
  satisfactionPct: string
  aboutTitle: string
  featuredServiceIds: string[]
  footerTagline: string
  footerCopyright: string
  contactPhone: string
  contactEmail: string
  contactAddress: string
  contactHours: string
  contactMapsUrl: string
}

function toForm(content: WebsiteContent): FormState {
  const w = content.website
  return {
    isPublished: w.is_published,
    headline: w.headline ?? '',
    about: w.about ?? '',
    theme: (w.theme as 'light' | 'dark') ?? 'light',
    template: (w.template as FormState['template']) ?? 'clarity',
    primaryColor: w.primary_color,
    secondaryColor: w.secondary_color,
    font: (w.font as FormState['font']) ?? 'inter',
    aiAgentId: w.ai_agent_id,
    logoUrl: w.logo_url ?? '',
    siteTitle: w.site_title ?? '',
    siteDescription: w.site_description ?? '',
    heroSubheadline: w.hero_subheadline ?? '',
    heroImageUrl: w.hero_image_url ?? '',
    ctaPrimaryText: w.cta_primary_text,
    ctaSecondaryText: w.cta_secondary_text,
    yearsExperience: w.years_experience?.toString() ?? '',
    clientsServed: w.clients_served?.toString() ?? '',
    satisfactionPct: w.satisfaction_pct?.toString() ?? '',
    aboutTitle: w.about_title,
    featuredServiceIds: w.featured_service_ids ?? [],
    footerTagline: w.footer_tagline ?? '',
    footerCopyright: w.footer_copyright ?? '',
    contactPhone: w.contact_phone ?? '',
    contactEmail: w.contact_email ?? '',
    contactAddress: w.contact_address ?? '',
    contactHours: w.contact_hours ?? '',
    contactMapsUrl: w.contact_maps_url ?? '',
  }
}

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  branding: Palette,
  hero: ImageIcon,
  about: FileText,
  services: Briefcase,
  team: UsersRound,
  testimonials: Quote,
  specialties: Handshake,
  faq: HelpCircle,
  contact: Phone,
  footer: PanelBottom,
}

function Section({
  title,
  id,
  open,
  onToggle,
  children,
}: {
  title: string
  id: string
  open: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  const Icon = SECTION_ICONS[id]
  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between py-2.5 text-sm font-medium text-[var(--text-1)]"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[var(--teal-700)] shrink-0" />}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-3)]">{label}</label>
      {children}
    </div>
  )
}

export function WebsiteEditor({
  business,
  initialContent,
  agents,
  services,
  websiteBuilderEnabled,
}: {
  business: Business
  initialContent: WebsiteContent
  agents: AiAgent[]
  services: BusinessService[]
  websiteBuilderEnabled: boolean
}) {
  const [form, setForm] = useState<FormState>(toForm(initialContent))
  const [slug, setSlug] = useState(business.slug)
  const [checkingOut, setCheckingOut] = useState(false)
  const checkoutStatus = useSearchParams().get('checkout')
  const [teamMembers, setTeamMembers] = useState<TeamMemberForm[]>(
    initialContent.teamMembers.map((m, i) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      bio: m.bio ?? '',
      photoUrl: m.photo_url ?? '',
      sortOrder: i,
    }))
  )
  const [testimonials, setTestimonials] = useState<TestimonialForm[]>(
    initialContent.testimonials.map((t, i) => ({
      id: t.id,
      quote: t.quote,
      authorName: t.author_name,
      authorRole: t.author_role ?? '',
      rating: t.rating,
      sortOrder: i,
    }))
  )
  const [specialties, setSpecialties] = useState<SpecialtyForm[]>(
    initialContent.specialties.map((s, i) => ({ id: s.id, label: s.label, sortOrder: i }))
  )
  const [faqs, setFaqs] = useState<FaqForm[]>(
    initialContent.faqs.map((f, i) => ({ id: f.id, question: f.question, answer: f.answer, sortOrder: i }))
  )

  const [openSection, setOpenSection] = useState<string | null>('branding')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }))
  }

  function handleLogoFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      setError('El logo no puede superar 5 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => patch({ logoUrl: typeof reader.result === 'string' ? reader.result : form.logoUrl })
    reader.readAsDataURL(file)
  }

  const siteUrl = useMemo(
    () => (typeof window !== 'undefined' ? `${window.location.origin}/sites/${slug}` : `/sites/${slug}`),
    [slug]
  )

  const previewContent: WebsiteContent = useMemo(
    () => ({
      website: {
        ...initialContent.website,
        is_published: form.isPublished,
        headline: form.headline || null,
        about: form.about || null,
        theme: form.theme,
        template: form.template,
        primary_color: form.primaryColor,
        secondary_color: form.secondaryColor,
        font: form.font,
        ai_agent_id: form.aiAgentId,
        logo_url: form.logoUrl || null,
        site_title: form.siteTitle || null,
        site_description: form.siteDescription || null,
        hero_subheadline: form.heroSubheadline || null,
        hero_image_url: form.heroImageUrl || null,
        cta_primary_text: form.ctaPrimaryText,
        cta_secondary_text: form.ctaSecondaryText,
        years_experience: form.yearsExperience ? Number(form.yearsExperience) : null,
        clients_served: form.clientsServed ? Number(form.clientsServed) : null,
        satisfaction_pct: form.satisfactionPct ? Number(form.satisfactionPct) : null,
        about_title: form.aboutTitle,
        featured_service_ids: form.featuredServiceIds,
        footer_tagline: form.footerTagline || null,
        footer_copyright: form.footerCopyright || null,
        contact_phone: form.contactPhone || null,
        contact_email: form.contactEmail || null,
        contact_address: form.contactAddress || null,
        contact_hours: form.contactHours || null,
        contact_maps_url: form.contactMapsUrl || null,
      },
      teamMembers: teamMembers.map((m, i) => ({
        id: m.id ?? `tmp-${i}`,
        business_id: business.id,
        name: m.name,
        role: m.role,
        bio: m.bio || null,
        photo_url: m.photoUrl || null,
        sort_order: i,
        created_at: '',
        updated_at: '',
      })),
      testimonials: testimonials.map((t, i) => ({
        id: t.id ?? `tmp-${i}`,
        business_id: business.id,
        quote: t.quote,
        author_name: t.authorName,
        author_role: t.authorRole || null,
        rating: t.rating,
        sort_order: i,
        created_at: '',
        updated_at: '',
      })),
      specialties: specialties.map((s, i) => ({
        id: s.id ?? `tmp-${i}`,
        business_id: business.id,
        label: s.label,
        sort_order: i,
        created_at: '',
        updated_at: '',
      })),
      faqs: faqs.map((f, i) => ({
        id: f.id ?? `tmp-${i}`,
        business_id: business.id,
        question: f.question,
        answer: f.answer,
        sort_order: i,
        created_at: '',
        updated_at: '',
      })),
      featuredServices: services.filter((s) => form.featuredServiceIds.includes(s.id)),
    }),
    [initialContent.website, form, teamMembers, testimonials, specialties, faqs, services, business.id]
  )

  async function save(publish?: boolean) {
    setSaving(true)
    setSaved(false)
    setError(null)
    const body = {
      slug,
      website: {
        isPublished: publish ?? form.isPublished,
        headline: form.headline,
        about: form.about,
        theme: form.theme,
        template: form.template,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        font: form.font,
        aiAgentId: form.aiAgentId,
        logoUrl: form.logoUrl,
        siteTitle: form.siteTitle,
        siteDescription: form.siteDescription,
        heroSubheadline: form.heroSubheadline,
        heroImageUrl: form.heroImageUrl,
        ctaPrimaryText: form.ctaPrimaryText,
        ctaSecondaryText: form.ctaSecondaryText,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        clientsServed: form.clientsServed ? Number(form.clientsServed) : undefined,
        satisfactionPct: form.satisfactionPct ? Number(form.satisfactionPct) : undefined,
        aboutTitle: form.aboutTitle,
        featuredServiceIds: form.featuredServiceIds,
        footerTagline: form.footerTagline,
        footerCopyright: form.footerCopyright,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        contactAddress: form.contactAddress,
        contactHours: form.contactHours,
        contactMapsUrl: form.contactMapsUrl,
      },
      teamMembers: teamMembers.map((m, i) => ({ ...m, sortOrder: i, photoUrl: m.photoUrl || undefined, bio: m.bio || undefined })),
      testimonials: testimonials.map((t, i) => ({
        ...t,
        sortOrder: i,
        authorRole: t.authorRole || undefined,
      })),
      specialties: specialties.map((s, i) => ({ ...s, sortOrder: i })),
      faqs: faqs.map((f, i) => ({ ...f, sortOrder: i })),
    }
    const res = await fetch('/api/website', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'No se pudo guardar')
      return
    }
    if (publish !== undefined) patch({ isPublished: publish })
    setSlug(data.slug ?? slug)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function toggle(id: string) {
    setOpenSection((cur) => (cur === id ? null : id))
  }

  // Publishing requires the paid Website Builder add-on ($29/mo). If the
  // business hasn't subscribed yet, send them to Stripe Checkout instead of
  // publishing directly — the webhook flips website_builder_enabled on
  // success and the next Publish click goes straight through.
  async function startWebsiteBuilderCheckout() {
    setCheckingOut(true)
    setError(null)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addon: 'website_builder' }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setCheckingOut(false)
      setError(data.error ?? 'No se pudo iniciar el pago')
    }
  }

  function handlePublishClick() {
    if (websiteBuilderEnabled) {
      save(true)
    } else {
      startWebsiteBuilderCheckout()
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
      {/* Left: Design + Content */}
      <div className="card-surface p-4 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <Globe className="w-4 h-4" />
          </span>
          <div>
            <p className="font-display font-semibold text-[var(--text-1)]">Website Builder</p>
            <p className="text-xs text-[var(--text-3)]">Build your agency website</p>
          </div>
        </div>

        {checkoutStatus === 'success' && (
          <p className="text-xs rounded-lg p-2.5 bg-[var(--teal-50)] text-[var(--teal-800)]">
            Payment successful! Click <strong>Publish</strong> below to make your site live.
          </p>
        )}
        {checkoutStatus === 'cancelled' && (
          <p className="text-xs rounded-lg p-2.5 bg-[var(--bg-raised)] text-[var(--text-3)]">
            Checkout was cancelled — no charge was made.
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-3)]">
            Website Builder · {form.isPublished ? `Live at /sites/${slug}` : 'Not published'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save()} disabled={saving} className="btn-secondary !text-xs">
            <Pencil className="w-3.5 h-3.5" /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
          {form.isPublished ? (
            <button onClick={() => save(false)} className="btn-secondary !text-xs">
              Unpublish
            </button>
          ) : (
            <button onClick={handlePublishClick} disabled={checkingOut} className="btn-primary !text-xs">
              {!websiteBuilderEnabled && <Lock className="w-3.5 h-3.5" />}
              {checkingOut ? 'Redirecting…' : 'Publish'}
            </button>
          )}
          <a href={siteUrl} target="_blank" rel="noreferrer" className="btn-secondary !text-xs">
            <ExternalLink className="w-3.5 h-3.5" /> View Live
          </a>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}

        {!websiteBuilderEnabled && !form.isPublished && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-3">
            <p className="text-xs font-semibold text-[var(--text-1)] mb-1.5">
              Publishing requires the Website Builder add-on — ${WEBSITE_BUILDER_PRICE_USD}/mo
            </p>
            <ul className="space-y-1">
              {WEBSITE_BUILDER_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs text-[var(--text-3)]">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--teal-700)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DESIGN */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-3)] mb-2">DESIGN</p>

          <Field label="Template">
            <div className="grid grid-cols-3 gap-2 mt-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => patch({ template: t.id })}
                  className={`rounded-lg border p-2 text-left ${
                    form.template === t.id ? 'ring-2 ring-[var(--teal-600)]' : 'border-[var(--border)]'
                  }`}
                >
                  <p className="text-xs font-medium">{t.name}</p>
                  <p className="text-[10px] text-[var(--text-3)]">{t.tagline}</p>
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Field label="Primary Color">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                className="w-full h-9 rounded-lg border border-[var(--border)]"
              />
            </Field>
            <Field label="Secondary Color">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => patch({ secondaryColor: e.target.value })}
                className="w-full h-9 rounded-lg border border-[var(--border)]"
              />
            </Field>
          </div>

          <Field label="Font">
            <select
              value={form.font}
              onChange={(e) => patch({ font: e.target.value as FormState['font'] })}
              className="input-field w-full mt-1"
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Site URL">
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-[var(--text-3)]">/sites/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="input-field flex-1"
              />
            </div>
          </Field>

          <Field label="AI Agent">
            <select
              value={form.aiAgentId ?? ''}
              onChange={(e) => patch({ aiAgentId: e.target.value || null })}
              className="input-field w-full mt-1"
            >
              <option value="">No agent</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} – {a.specialty}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* CONTENT */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-3)] mb-1">CONTENT</p>

          <Section title="Branding" id="branding" open={openSection === 'branding'} onToggle={toggle}>
            <div className="space-y-2.5 rounded-xl bg-[var(--bg-subtle)] p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">Logo - 1:1 recommended</p>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleLogoFile(e.dataTransfer.files[0])
                  }}
                  className="mt-1.5 flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white/70 px-3 py-4 text-center transition hover:border-[var(--teal-700)] hover:bg-[var(--teal-50)]"
                >
                  {form.logoUrl ? (
                    <span className="flex flex-col items-center gap-2">
                      <span
                        aria-label="Logo preview"
                        className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-[var(--border)] bg-white bg-contain bg-center bg-no-repeat shadow-sm"
                        style={{ backgroundImage: `url("${form.logoUrl}")` }}
                      />
                      <span className="text-xs font-semibold text-[var(--teal-700)]">Cambiar logo</span>
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-1.5">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--teal-50)] text-[var(--teal-700)]">
                        <UploadCloud className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-[var(--teal-700)]">Click or drag to upload</span>
                      <span className="text-[10px] text-[var(--text-3)]">PNG, JPG, WEBP - max 5 MB</span>
                    </span>
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                </label>
                <input
                  value={form.logoUrl}
                  onChange={(e) => patch({ logoUrl: e.target.value })}
                  className="input-field mt-2 h-8 w-full !rounded-lg !px-2.5 !py-1 text-xs"
                  placeholder="https://..."
                />
              </div>

              <Field label="Site Title">
                <input
                  value={form.siteTitle}
                  onChange={(e) => patch({ siteTitle: e.target.value })}
                  className="input-field h-8 w-full !rounded-lg !px-2.5 !py-1 text-xs"
                  placeholder={business.name}
                />
              </Field>
              <Field label="Site Description">
                <textarea
                  value={form.siteDescription}
                  onChange={(e) => patch({ siteDescription: e.target.value })}
                  className="input-field w-full !rounded-lg !px-2.5 !py-2 text-xs"
                  rows={3}
                  placeholder="A short tagline shown in search engines and browser tabs."
                />
              </Field>
            </div>
          </Section>

          <Section title="Hero Section" id="hero" open={openSection === 'hero'} onToggle={toggle}>
            <Field label="Headline">
              <input
                value={form.headline}
                onChange={(e) => patch({ headline: e.target.value })}
                className="input-field w-full"
                placeholder="Premium Real Estate, Exceptional Service"
              />
            </Field>
            <Field label="Subheadline">
              <textarea
                value={form.heroSubheadline}
                onChange={(e) => patch({ heroSubheadline: e.target.value })}
                className="input-field w-full"
                rows={2}
              />
            </Field>
            <Field label="Hero Image URL">
              <input
                value={form.heroImageUrl}
                onChange={(e) => patch({ heroImageUrl: e.target.value })}
                className="input-field w-full"
                placeholder="https://…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="CTA Primary">
                <input
                  value={form.ctaPrimaryText}
                  onChange={(e) => patch({ ctaPrimaryText: e.target.value })}
                  className="input-field w-full"
                />
              </Field>
              <Field label="CTA Secondary">
                <input
                  value={form.ctaSecondaryText}
                  onChange={(e) => patch({ ctaSecondaryText: e.target.value })}
                  className="input-field w-full"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Years Exp.">
                <input
                  value={form.yearsExperience}
                  onChange={(e) => patch({ yearsExperience: e.target.value })}
                  className="input-field w-full"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Clients Served">
                <input
                  value={form.clientsServed}
                  onChange={(e) => patch({ clientsServed: e.target.value })}
                  className="input-field w-full"
                  inputMode="numeric"
                />
              </Field>
            </div>
            <Field label="Satisfaction %">
              <input
                value={form.satisfactionPct}
                onChange={(e) => patch({ satisfactionPct: e.target.value })}
                className="input-field w-full"
                inputMode="numeric"
              />
            </Field>
          </Section>

          <Section title="About Section" id="about" open={openSection === 'about'} onToggle={toggle}>
            <Field label="Title">
              <input
                value={form.aboutTitle}
                onChange={(e) => patch({ aboutTitle: e.target.value })}
                className="input-field w-full"
              />
            </Field>
            <Field label="Body">
              <textarea
                value={form.about}
                onChange={(e) => patch({ about: e.target.value })}
                className="input-field w-full"
                rows={4}
              />
            </Field>
          </Section>

          <Section title="Services" id="services" open={openSection === 'services'} onToggle={toggle}>
            {services.length === 0 && (
              <p className="text-xs text-[var(--text-3)]">Create services on the Services page first.</p>
            )}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featuredServiceIds.includes(s.id)}
                    onChange={(e) =>
                      patch({
                        featuredServiceIds: e.target.checked
                          ? [...form.featuredServiceIds, s.id]
                          : form.featuredServiceIds.filter((id) => id !== s.id),
                      })
                    }
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Team Members" id="team" open={openSection === 'team'} onToggle={toggle}>
            {teamMembers.map((m, i) => (
              <div key={i} className="card-surface p-3 space-y-2">
                <div className="flex justify-end">
                  <button onClick={() => setTeamMembers((cur) => cur.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <input
                  placeholder="Name"
                  value={m.name}
                  onChange={(e) =>
                    setTeamMembers((cur) => cur.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
                <input
                  placeholder="Role / Title"
                  value={m.role}
                  onChange={(e) =>
                    setTeamMembers((cur) => cur.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
                <textarea
                  placeholder="Bio"
                  value={m.bio}
                  rows={2}
                  onChange={(e) =>
                    setTeamMembers((cur) => cur.map((x, idx) => (idx === i ? { ...x, bio: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
                <input
                  placeholder="Photo URL"
                  value={m.photoUrl}
                  onChange={(e) =>
                    setTeamMembers((cur) => cur.map((x, idx) => (idx === i ? { ...x, photoUrl: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
              </div>
            ))}
            <button
              onClick={() =>
                setTeamMembers((cur) => [...cur, { name: '', role: '', bio: '', photoUrl: '', sortOrder: cur.length }])
              }
              className="btn-secondary w-full !text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Team Member
            </button>
          </Section>

          <Section title="Testimonials" id="testimonials" open={openSection === 'testimonials'} onToggle={toggle}>
            {testimonials.map((t, i) => (
              <div key={i} className="card-surface p-3 space-y-2">
                <div className="flex justify-end">
                  <button onClick={() => setTestimonials((cur) => cur.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <textarea
                  placeholder="Quote"
                  value={t.quote}
                  rows={2}
                  onChange={(e) =>
                    setTestimonials((cur) => cur.map((x, idx) => (idx === i ? { ...x, quote: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Author name"
                    value={t.authorName}
                    onChange={(e) =>
                      setTestimonials((cur) =>
                        cur.map((x, idx) => (idx === i ? { ...x, authorName: e.target.value } : x))
                      )
                    }
                    className="input-field w-full"
                  />
                  <input
                    placeholder="Author role"
                    value={t.authorRole}
                    onChange={(e) =>
                      setTestimonials((cur) =>
                        cur.map((x, idx) => (idx === i ? { ...x, authorRole: e.target.value } : x))
                      )
                    }
                    className="input-field w-full"
                  />
                </div>
                <select
                  value={t.rating}
                  onChange={(e) =>
                    setTestimonials((cur) =>
                      cur.map((x, idx) => (idx === i ? { ...x, rating: Number(e.target.value) } : x))
                    )
                  }
                  className="input-field w-auto"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {'★'.repeat(r)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              onClick={() =>
                setTestimonials((cur) => [
                  ...cur,
                  { quote: '', authorName: '', authorRole: '', rating: 5, sortOrder: cur.length },
                ])
              }
              className="btn-secondary w-full !text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Testimonial
            </button>
          </Section>

          <Section title="Partners & Lenders" id="specialties" open={openSection === 'specialties'} onToggle={toggle}>
            {specialties.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={s.label}
                  onChange={(e) =>
                    setSpecialties((cur) => cur.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                  }
                  className="input-field flex-1"
                  placeholder="e.g. Luxury Estates"
                />
                <button onClick={() => setSpecialties((cur) => cur.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setSpecialties((cur) => [...cur, { label: '', sortOrder: cur.length }])}
              className="btn-secondary w-full !text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Insurance
            </button>
          </Section>

          <Section title="FAQ" id="faq" open={openSection === 'faq'} onToggle={toggle}>
            {faqs.map((f, i) => (
              <div key={i} className="card-surface p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[var(--text-3)]">Q{i + 1}</span>
                  <button onClick={() => setFaqs((cur) => cur.filter((_, idx) => idx !== i))}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
                <input
                  placeholder="Question"
                  value={f.question}
                  onChange={(e) =>
                    setFaqs((cur) => cur.map((x, idx) => (idx === i ? { ...x, question: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
                <textarea
                  placeholder="Answer"
                  value={f.answer}
                  rows={2}
                  onChange={(e) =>
                    setFaqs((cur) => cur.map((x, idx) => (idx === i ? { ...x, answer: e.target.value } : x)))
                  }
                  className="input-field w-full"
                />
              </div>
            ))}
            <button
              onClick={() => setFaqs((cur) => [...cur, { question: '', answer: '', sortOrder: cur.length }])}
              className="btn-secondary w-full !text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </Section>

          <Section title="Contact Info" id="contact" open={openSection === 'contact'} onToggle={toggle}>
            <Field label="Phone">
              <input
                value={form.contactPhone}
                onChange={(e) => patch({ contactPhone: e.target.value })}
                className="input-field w-full"
              />
            </Field>
            <Field label="Email">
              <input
                value={form.contactEmail}
                onChange={(e) => patch({ contactEmail: e.target.value })}
                className="input-field w-full"
              />
            </Field>
            <Field label="Address">
              <textarea
                value={form.contactAddress}
                onChange={(e) => patch({ contactAddress: e.target.value })}
                className="input-field w-full"
                rows={2}
              />
            </Field>
            <Field label="Hours">
              <input
                value={form.contactHours}
                onChange={(e) => patch({ contactHours: e.target.value })}
                className="input-field w-full"
                placeholder="Mon–Fri 9am–6pm · Sat 10am–4pm"
              />
            </Field>
            <Field label="Google Maps (embed URL)">
              <input
                value={form.contactMapsUrl}
                onChange={(e) => patch({ contactMapsUrl: e.target.value })}
                className="input-field w-full"
                placeholder="https://maps.google.com/maps?q=…&output=embed"
              />
            </Field>
          </Section>

          <Section title="Footer" id="footer" open={openSection === 'footer'} onToggle={toggle}>
            <Field label="Tagline">
              <input
                value={form.footerTagline}
                onChange={(e) => patch({ footerTagline: e.target.value })}
                className="input-field w-full"
              />
            </Field>
            <Field label="Copyright text">
              <input
                value={form.footerCopyright}
                onChange={(e) => patch({ footerCopyright: e.target.value })}
                className="input-field w-full"
              />
            </Field>
          </Section>
        </div>
      </div>

      {/* Right: Live preview */}
      <div className="card-surface p-2 overflow-hidden">
        <p className="text-xs text-[var(--text-3)] px-2 py-1">
          Preview · {TEMPLATES.find((t) => t.id === form.template)?.name} template
        </p>
        <div className="rounded-xl border border-[var(--border)] overflow-y-auto max-h-[80vh]">
          <WebsiteTemplateRenderer
            businessName={business.name}
            businessPhone={business.phone}
            content={previewContent}
            isEditorPreview
          />
        </div>
      </div>
    </div>
  )
}
