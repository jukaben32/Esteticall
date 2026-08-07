import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  CheckCircle2,
  Check,
  Home,
  Building2,
  TrendingUp,
  ClipboardList,
  Key,
} from 'lucide-react'
import type { WebsiteContent } from '@/types'

const TEMPLATE_STYLES: Record<
  string,
  { bg: string; cardBg: string; text: string; subtext: string; border: string; heroBg: string }
> = {
  clarity: {
    bg: '#ffffff',
    cardBg: '#ffffff',
    text: '#0a0a0a',
    subtext: '#6b7280',
    border: '#e5e7eb',
    heroBg: '#ffffff',
  },
  pulse: {
    bg: '#0a0a0a',
    cardBg: '#171717',
    text: '#fafafa',
    subtext: '#a3a3a3',
    border: '#262626',
    heroBg: '#0a0a0a',
  },
  serenity: {
    bg: '#fdfaf5',
    cardBg: '#ffffff',
    text: '#1c1917',
    subtext: '#78716c',
    border: '#e7e0d4',
    heroBg: '#fdfaf5',
  },
}

const FONT_STACKS: Record<string, string> = {
  inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
}

const FONT_LINKS: Record<string, string> = {
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  playfair: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap',
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
}

// This is the customer-facing published site (and the builder's live
// preview of it), so copy stays in English regardless of the dashboard's
// locale — same convention as WidgetBookingPanel.
function formatPublicPrice(s: { price: number | null; price_max?: number | null; price_type: string | null }): string {
  if (s.price_type === 'call_for_price' || s.price == null) return 'Call for price'
  const price = `$${s.price.toLocaleString()}`
  if (s.price_type === 'price_range') {
    return s.price_max != null ? `${price} - $${s.price_max.toLocaleString()}` : price
  }
  if (s.price_type === 'starting_at') return `From ${price}`
  return price
}

const ABOUT_HIGHLIGHTS = [
  'Licensed Real Estate Agents',
  'Accepting New Clients',
  'Virtual Viewings Available',
  'Free Market Analysis',
]

const SERVICE_ICONS = [Home, ClipboardList, TrendingUp, Building2, Key]

function toDecimalDegrees(degrees: string, minutes = '0', seconds = '0', direction: string) {
  const value = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600
  return /[SW]/i.test(direction) ? -value : value
}

function normalizeMapEmbedUrl(rawValue: string | null) {
  const value = rawValue?.trim()
  if (!value) return null

  const iframeSrc = value.match(/src=["']([^"']+)["']/i)?.[1]
  const input = (iframeSrc ?? value).trim()
  const dms = input.match(
    /(\d+(?:\.\d+)?)[^0-9NSEW]+(\d+(?:\.\d+)?)?[^0-9NSEW]*(\d+(?:\.\d+)?)?[^0-9NSEW]*([NS])[^0-9NSEW]+(\d+(?:\.\d+)?)[^0-9NSEW]+(\d+(?:\.\d+)?)?[^0-9NSEW]*(\d+(?:\.\d+)?)?[^0-9NSEW]*([EW])/i
  )
  const query = dms
    ? `${toDecimalDegrees(dms[1], dms[2], dms[3], dms[4])},${toDecimalDegrees(dms[5], dms[6], dms[7], dms[8])}`
    : input

  if (/^https?:\/\//i.test(query)) {
    try {
      const url = new URL(query)
      const host = url.hostname.toLowerCase()
      const isGoogleMap = host.includes('google.') || host === 'maps.app.goo.gl' || host === 'goo.gl'
      const isEmbed = url.pathname.includes('/maps/embed') || url.searchParams.get('output') === 'embed'
      if (isGoogleMap && isEmbed) return query
      if (!isGoogleMap) return query
    } catch {
      // Fall back to a Google Maps search embed below.
    }
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

export function WebsiteTemplateRenderer({
  businessName,
  businessPhone,
  content,
  isEditorPreview = false,
}: {
  businessName: string
  businessPhone?: string | null
  content: WebsiteContent
  isEditorPreview?: boolean
}) {
  const { website, teamMembers, testimonials, specialties, faqs, featuredServices } = content
  const style = TEMPLATE_STYLES[website.template] ?? TEMPLATE_STYLES.clarity
  const font = FONT_STACKS[website.font] ?? FONT_STACKS.inter
  const isPulse = website.template === 'pulse'
  const isSerenity = website.template === 'serenity'
  const mapEmbedUrl = normalizeMapEmbedUrl(website.contact_maps_url)

  return (
    <div style={{ backgroundColor: style.bg, color: style.text, fontFamily: font }} className="min-h-full">
      <link rel="stylesheet" href={FONT_LINKS[website.font] ?? FONT_LINKS.inter} />

      {/* Nav */}
      <header
        className="flex items-center justify-between px-6 sm:px-10 py-4 border-b sticky top-0 z-10"
        style={{ borderColor: style.border, backgroundColor: style.bg }}
      >
        <div className="flex items-center gap-2 font-semibold">
          {website.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={website.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
          ) : (
            <span
              className="w-6 h-6 rounded-full grid place-items-center text-white text-xs"
              style={{ backgroundColor: website.primary_color }}
            >
              {(website.site_title || businessName).charAt(0)}
            </span>
          )}
          {website.site_title || businessName}
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm" style={{ color: style.subtext }}>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#team">Team</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          href={`tel:${website.contact_phone || businessPhone || ''}`}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: website.primary_color }}
        >
          <Phone className="w-3.5 h-3.5" />
          {website.contact_phone || businessPhone || 'Call us'}
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-10 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{ backgroundColor: `${website.secondary_color}22`, color: website.secondary_color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: website.secondary_color }} />
            Now Accepting New Clients
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            {website.headline || 'Premium Real Estate, Exceptional Service'}
          </h1>
          <p className="mb-6" style={{ color: style.subtext }}>
            {website.hero_subheadline ||
              website.about ||
              'We help buyers, sellers, and investors find their perfect property with expert guidance and personalized service from our dedicated team.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <a
              href="#book"
              className="rounded-full px-5 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: website.primary_color }}
            >
              {website.cta_primary_text} →
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium border"
              style={{ borderColor: style.border }}
            >
              <Phone className="w-3.5 h-3.5" />
              {website.cta_secondary_text}
            </a>
          </div>
          <div className="flex gap-8">
            <Stat value={website.years_experience} suffix="+" label="Years Experience" subtext={style.subtext} />
            <Stat value={website.clients_served} suffix="+" label="Clients Served" subtext={style.subtext} />
            <Stat value={website.satisfaction_pct} suffix="%" label="Satisfaction" subtext={style.subtext} />
          </div>
        </div>

        <div className="relative">
          <div
            className="rounded-2xl overflow-hidden aspect-[4/3] grid place-items-center"
            style={{ backgroundColor: style.border }}
          >
            {website.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={website.hero_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              isEditorPreview && (
                <div className="text-center px-4" style={{ color: style.subtext }}>
                  <Home className="w-6 h-6 mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs">Upload a hero image in the editor</p>
                </div>
              )
            )}
          </div>

          {/* Hero decoration density matches each template's own character:
              Clarity = clean/minimal (none), Pulse = bold AI/booking badges,
              Serenity = one soft accreditation + testimonial accent. */}
          {isPulse && (
            <>
              <div
                className="hidden sm:flex items-center gap-1.5 absolute -top-4 right-4 rounded-xl px-3 py-2 shadow-lg"
                style={{ backgroundColor: style.cardBg, border: `1px solid ${style.border}` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: website.primary_color }} />
                <div>
                  <p className="text-xs font-semibold">AI Voice Assistant</p>
                  <p className="text-[11px]" style={{ color: style.subtext }}>
                    24/7 Available
                  </p>
                </div>
              </div>
              <div
                className="hidden sm:block absolute bottom-4 right-4 rounded-xl px-4 py-3 shadow-lg"
                style={{ backgroundColor: style.cardBg, border: `1px solid ${style.border}` }}
              >
                <p className="text-xs font-semibold">Quick Booking</p>
                <p className="text-[11px]" style={{ color: style.subtext }}>
                  Same day available
                </p>
              </div>
            </>
          )}

          {isSerenity && (
            <>
              <div
                className="hidden sm:block absolute -top-4 right-4 rounded-xl px-4 py-3 text-white shadow-lg"
                style={{ backgroundColor: website.primary_color }}
              >
                <p className="font-bold">A+</p>
                <p className="text-[11px] opacity-90">Accreditation Rating</p>
              </div>
              {testimonials[0] && (
                <div
                  className="hidden sm:block absolute bottom-4 right-4 rounded-xl p-3 shadow-lg max-w-[180px]"
                  style={{ backgroundColor: style.cardBg, border: `1px solid ${style.border}` }}
                >
                  <p className="text-xs" style={{ color: website.secondary_color }}>
                    {'★'.repeat(testimonials[0].rating)}
                  </p>
                  <p className="text-[11px]" style={{ color: style.subtext }}>
                    &quot;{testimonials[0].quote}&quot;
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Services */}
      {featuredServices.length > 0 && (
        <section id="services" className="px-6 sm:px-10 py-14 text-center" style={{ backgroundColor: style.cardBg }}>
          <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: website.primary_color }}>
            WHAT WE OFFER
          </p>
          <h2 className="text-3xl font-bold mb-2">Our Property Services</h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: style.subtext }}>
            Comprehensive care tailored to every stage of your property journey.
          </p>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {featuredServices.map((s, i) => {
              const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length]
              return (
                <div key={s.id} className="rounded-xl p-4 border" style={{ borderColor: style.border, backgroundColor: style.bg }}>
                  <span
                    className="grid place-items-center w-9 h-9 rounded-lg mb-3"
                    style={{ backgroundColor: `${website.primary_color}1A`, color: website.primary_color }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <p className="font-semibold">{s.name}</p>
                  {s.description && (
                    <p className="text-sm mt-1" style={{ color: style.subtext }}>
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span style={{ color: style.subtext }}>{s.duration_minutes} min</span>
                    <span className="font-semibold" style={{ color: website.primary_color }}>
                      {formatPublicPrice(s)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* About */}
      {(website.about || isEditorPreview) && (
        <section id="about" className="px-6 sm:px-10 py-14 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: website.primary_color }}>
              ABOUT US
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{website.about_title || 'About Us'}</h2>
            <p className="mb-5" style={{ color: style.subtext }}>
              {website.about ||
                'We believe every client deserves personalized, expert guidance. Our team combines decades of market expertise with cutting-edge tools to deliver results.'}
            </p>
            {website.about_story && (
              <p className="mb-5" style={{ color: style.subtext }}>
                {website.about_story}
              </p>
            )}
            <ul className="space-y-2">
              {(website.trust_badges?.length ? website.trust_badges : ABOUT_HIGHLIGHTS).map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: website.primary_color }} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl aspect-[4/3] overflow-hidden grid place-items-center"
            style={{ backgroundColor: style.cardBg, border: `1px solid ${style.border}` }}
          >
            {website.about_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={website.about_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Home className="w-8 h-8 opacity-30" />
            )}
          </div>
        </section>
      )}

      {/* Team */}
      {teamMembers.length > 0 && (
        <section id="team" className="px-6 sm:px-10 py-14" style={{ backgroundColor: style.cardBg }}>
          <p className="text-xs font-semibold tracking-widest mb-2 text-center" style={{ color: website.primary_color }}>
            OUR EXPERTS
          </p>
          <h2 className="text-2xl font-bold mb-8 text-center">Meet Our Team</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teamMembers.map((m) => (
              <div key={m.id} className="text-center">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden grid place-items-center text-lg font-semibold"
                  style={{ backgroundColor: `${website.primary_color}1A`, color: website.primary_color }}
                >
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    m.name.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs mb-1" style={{ color: website.primary_color }}>
                  {m.role}
                </p>
                {m.bio && (
                  <p className="text-xs" style={{ color: style.subtext }}>
                    {m.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="px-6 sm:px-10 py-14 max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-widest mb-2 text-center" style={{ color: website.primary_color }}>
            TESTIMONIALS
          </p>
          <h2 className="text-2xl font-bold mb-8 text-center">What Clients Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-xl p-4 border" style={{ borderColor: style.border }}>
                <p className="text-sm mb-2" style={{ color: website.secondary_color }}>
                  {'★'.repeat(t.rating)}
                </p>
                <p className="text-sm mb-3">&quot;{t.quote}&quot;</p>
                <p className="text-xs font-medium">{t.author_name}</p>
                {t.author_role && (
                  <p className="text-xs" style={{ color: style.subtext }}>
                    {t.author_role}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Partners & Lenders */}
      {specialties.length > 0 && (
        <section className="px-6 sm:px-10 py-14 text-center" style={{ backgroundColor: style.cardBg }}>
          <h2 className="text-2xl font-bold mb-6">Our Partners &amp; Lenders</h2>
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2.5">
            {specialties.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm border"
                style={{ borderColor: style.border }}
              >
                <Check className="w-3.5 h-3.5" style={{ color: website.primary_color }} />
                {s.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="px-6 sm:px-10 py-14 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="divide-y" style={{ borderColor: style.border }}>
            {faqs.map((f) => (
              <details key={f.id} className="group py-4" style={{ borderColor: style.border }}>
                <summary className="flex items-center justify-between gap-3 font-medium cursor-pointer list-none">
                  {f.question}
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: style.subtext }} />
                </summary>
                <p className="text-sm mt-2" style={{ color: style.subtext }}>
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="px-6 sm:px-10 py-14 max-w-5xl mx-auto">
        <p className="text-xs font-semibold tracking-widest mb-2 text-center" style={{ color: website.primary_color }}>
          GET IN TOUCH
        </p>
        <h2 className="text-3xl font-bold text-center mb-10">Contact Us</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {website.contact_phone && (
              <ContactRow icon={Phone} label="Phone" value={website.contact_phone} subtext={style.subtext} accent={website.primary_color} />
            )}
            {website.contact_email && (
              <ContactRow icon={Mail} label="Email" value={website.contact_email} subtext={style.subtext} accent={website.primary_color} />
            )}
            {website.contact_address && (
              <ContactRow icon={MapPin} label="Address" value={website.contact_address} subtext={style.subtext} accent={website.primary_color} />
            )}
            {website.contact_hours && (
              <ContactRow icon={Clock} label="Hours" value={website.contact_hours} subtext={style.subtext} accent={website.primary_color} />
            )}
          </div>
          <div
            className="rounded-2xl overflow-hidden min-h-[240px] grid place-items-center"
            style={{ backgroundColor: style.border }}
          >
            {mapEmbedUrl ? (
              <iframe src={mapEmbedUrl} className="w-full h-full min-h-[240px]" loading="lazy" title="Map" />
            ) : (
              isEditorPreview && (
                <div className="text-center px-4" style={{ color: style.subtext }}>
                  <MapPin className="w-6 h-6 mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs">Add Google Maps embed URL</p>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 py-8 border-t text-center text-xs" style={{ borderColor: style.border, color: style.subtext }}>
        <p className="mb-1">{website.footer_tagline || 'Your trusted partner in real estate.'}</p>
        <p>{website.footer_copyright || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`}</p>
      </footer>
    </div>
  )
}

function Stat({
  value,
  suffix,
  label,
  subtext,
}: {
  value: number | null
  suffix: string
  label: string
  subtext: string
}) {
  if (value == null) return null
  return (
    <div>
      <p className="text-xl font-bold">
        {value}
        {suffix}
      </p>
      <p className="text-xs" style={{ color: subtext }}>
        {label}
      </p>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtext: string
  accent: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide" style={{ color: subtext }}>
          {label}
        </p>
        <p className="font-medium whitespace-pre-line">{value}</p>
      </div>
    </div>
  )
}
