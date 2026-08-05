import type { WebsiteContent } from '@/types'
import { formatServicePrice } from '@/lib/serviceFormat'

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

export function WebsiteTemplateRenderer({
  businessName,
  businessPhone,
  content,
}: {
  businessName: string
  businessPhone?: string | null
  content: WebsiteContent
}) {
  const { website, teamMembers, testimonials, specialties, faqs, featuredServices } = content
  const style = TEMPLATE_STYLES[website.template] ?? TEMPLATE_STYLES.clarity
  const font = FONT_STACKS[website.font] ?? FONT_STACKS.inter

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
          <a href="#testimonials">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          href={`tel:${website.contact_phone || businessPhone || ''}`}
          className="rounded-full px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: website.primary_color }}
        >
          {website.contact_phone || businessPhone || 'Call us'}
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-10 py-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto">
        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-medium mb-4"
            style={{ backgroundColor: `${website.secondary_color}22`, color: website.secondary_color }}
          >
            ★ Trusted by thousands of clients
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
              className="rounded-full px-5 py-2.5 text-sm font-medium border"
              style={{ borderColor: style.border }}
            >
              {website.cta_secondary_text}
            </a>
          </div>
          <div className="flex gap-8">
            <Stat value={website.years_experience} suffix="+" label="Years Experience" subtext={style.subtext} />
            <Stat value={website.clients_served} suffix="+" label="Happy Clients" subtext={style.subtext} />
            <Stat value={website.satisfaction_pct} suffix="%" label="Satisfaction" subtext={style.subtext} />
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden aspect-[4/3]" style={{ backgroundColor: style.border }}>
            {website.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={website.hero_image_url} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div
            className="hidden sm:block absolute -top-4 right-4 rounded-xl p-3 shadow-lg"
            style={{ backgroundColor: style.cardBg, border: `1px solid ${style.border}` }}
          >
            <p className="text-xs font-semibold">AI Voice Care</p>
            <p className="text-[11px]" style={{ color: style.subtext }}>
              24/7 instant property guidance
            </p>
          </div>
          <div
            className="hidden sm:block absolute top-24 right-4 rounded-xl px-4 py-3 text-white shadow-lg"
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
              <p className="text-xs">{'★'.repeat(testimonials[0].rating)}</p>
              <p className="text-[11px]" style={{ color: style.subtext }}>
                &quot;{testimonials[0].quote}&quot;
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Specialties / What We Offer */}
      {specialties.length > 0 && (
        <section id="services" className="px-6 sm:px-10 py-14 text-center" style={{ backgroundColor: style.cardBg }}>
          <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: style.subtext }}>
            WHAT WE OFFER
          </p>
          <h2 className="text-3xl font-bold mb-2">Our Specialties</h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: style.subtext }}>
            Comprehensive real estate services delivered with expertise and precision.
          </p>
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
            {specialties.map((s) => (
              <div key={s.id} className="rounded-xl p-4 border text-sm font-medium" style={{ borderColor: style.border }}>
                {s.label}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured services */}
      {featuredServices.length > 0 && (
        <section className="px-6 sm:px-10 py-14 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredServices.map((s) => (
              <div key={s.id} className="rounded-xl p-4 border" style={{ borderColor: style.border }}>
                <p className="font-semibold">{s.name}</p>
                {s.description && (
                  <p className="text-sm mt-1" style={{ color: style.subtext }}>
                    {s.description}
                  </p>
                )}
                <p className="text-sm mt-2 font-medium" style={{ color: website.primary_color }}>
                  {formatServicePrice(s)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      {website.about && (
        <section id="about" className="px-6 sm:px-10 py-14 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{website.about_title || 'About Us'}</h2>
          <p style={{ color: style.subtext }}>{website.about}</p>
        </section>
      )}

      {/* Team */}
      {teamMembers.length > 0 && (
        <section id="team" className="px-6 sm:px-10 py-14" style={{ backgroundColor: style.cardBg }}>
          <h2 className="text-2xl font-bold mb-8 text-center">Meet the Team</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {teamMembers.map((m) => (
              <div key={m.id} className="text-center">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden"
                  style={{ backgroundColor: style.border }}
                >
                  {m.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
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
        <section id="testimonials" className="px-6 sm:px-10 py-14 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">What Clients Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-xl p-4 border" style={{ borderColor: style.border }}>
                <p className="text-sm mb-2">{'★'.repeat(t.rating)}</p>
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

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="px-6 sm:px-10 py-14 max-w-2xl mx-auto" style={{ backgroundColor: style.cardBg }}>
          <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.id} className="rounded-xl border p-4" style={{ borderColor: style.border }}>
                <summary className="font-medium cursor-pointer">{f.question}</summary>
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
        <h2 className="text-3xl font-bold text-center mb-2">We&apos;d Love to Hear from You</h2>
        <p className="text-center mb-10" style={{ color: style.subtext }}>
          Reach out to schedule a visit or ask us anything — our friendly team is always here.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {website.contact_phone && <ContactRow label="Phone" value={website.contact_phone} subtext={style.subtext} />}
            {website.contact_email && <ContactRow label="Email" value={website.contact_email} subtext={style.subtext} />}
            {website.contact_address && (
              <ContactRow label="Address" value={website.contact_address} subtext={style.subtext} />
            )}
            {website.contact_hours && <ContactRow label="Hours" value={website.contact_hours} subtext={style.subtext} />}
          </div>
          <div className="rounded-2xl overflow-hidden min-h-[240px]" style={{ backgroundColor: style.border }}>
            {website.contact_maps_url && (
              <iframe
                src={website.contact_maps_url}
                className="w-full h-full min-h-[240px]"
                loading="lazy"
                title="Map"
              />
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

function ContactRow({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide" style={{ color: subtext }}>
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
