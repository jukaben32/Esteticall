import type { PlanId, PlanLimits } from '@/types'

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: process.env.NEXT_PUBLIC_FREE_PLAN_NAME ?? 'Free',
    priceUsd: 0,
    agentLimit: Number(process.env.NEXT_PUBLIC_FREE_AGENT_LIMIT ?? 1),
    bookingLimit: Number(process.env.NEXT_PUBLIC_FREE_BOOKING_LIMIT ?? 5),
    includedVoiceMinutes: Number(process.env.NEXT_PUBLIC_FREE_VOICE_MINUTES ?? 20),
  },
  pro: {
    id: 'pro',
    name: process.env.NEXT_PUBLIC_PRO_PLAN_NAME ?? 'Pro',
    priceUsd: Number(process.env.NEXT_PUBLIC_PRO_PLAN_PRICE_USD ?? 49),
    agentLimit: Number(process.env.NEXT_PUBLIC_PRO_AGENT_LIMIT ?? 10),
    bookingLimit: Number(process.env.NEXT_PUBLIC_PRO_BOOKING_LIMIT ?? 99),
    includedVoiceMinutes: Number(process.env.NEXT_PUBLIC_PRO_VOICE_MINUTES ?? 200),
  },
  business: {
    id: 'business',
    name: process.env.NEXT_PUBLIC_BUSINESS_PLAN_NAME ?? 'Business',
    priceUsd: Number(process.env.NEXT_PUBLIC_BUSINESS_PLAN_PRICE_USD ?? 199),
    agentLimit: Number(process.env.NEXT_PUBLIC_BUSINESS_AGENT_LIMIT ?? 0),
    bookingLimit: Number(process.env.NEXT_PUBLIC_BUSINESS_BOOKING_LIMIT ?? 0),
    includedVoiceMinutes: Number(process.env.NEXT_PUBLIC_BUSINESS_VOICE_MINUTES ?? 1000),
  },
}

// Sold as a one-time top-up, only to plans that already pay a subscription
// (see /api/billing/recharge-voice-minutes) — Free never recharges, it falls
// back to WhatsApp once its included minutes run out.
export const VOICE_RECHARGE_BLOCK_MINUTES = Number(process.env.NEXT_PUBLIC_VOICE_RECHARGE_BLOCK_MINUTES ?? 100)
export const VOICE_RECHARGE_PRICE_USD = Number(process.env.NEXT_PUBLIC_VOICE_RECHARGE_PRICE_USD ?? 30)

export const WEBSITE_BUILDER_PRICE_USD = Number(
  process.env.NEXT_PUBLIC_WEBSITE_BUILDER_PRICE_USD ?? 29
)

export const WEBSITE_BUILDER_FEATURES = [
  '3 professional website templates',
  'Full content & brand editor',
  'AI voice widget embedded',
  'Published at your custom URL',
  'Renew anytime — cancel anytime',
] as const

// Seeded into website_specialties the first time a business opens the
// builder's "Our Specialties" panel with nothing in it yet, so new sites
// don't start with an empty, unlabeled grid. Owners are free to edit or
// delete every one of these afterward.
export const DEFAULT_WEBSITE_SPECIALTIES = [
  'Toxina Botulínica',
  'Rellenos Dérmicos',
  'Depilación Láser',
  'Faciales Médicos',
  'Tratamientos Corporales',
  'Medicina Estética',
] as const

// 0 means "unlimited" in the env contract.
export function isWithinLimit(used: number, limit: number): boolean {
  return limit === 0 || used < limit
}

// Voices supported by the OpenAI Realtime API.
export const AGENT_VOICES = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
] as const

export const AGENT_PERSONALITIES = [
  { value: 'friendly', label: 'Friendly & warm' },
  { value: 'professional', label: 'Professional & concise' },
  { value: 'enthusiastic', label: 'Enthusiastic & upbeat' },
] as const

// The reference UI exposes sensitivity as a 3-level dropdown rather than a
// raw 0–1 slider. Values chosen to match its "Low / Medium / High" copy.
export const AGENT_INTERRUPTION_LEVELS = [
  { value: 0.2, label: 'Baja — deja terminar a la persona' },
  { value: 0.5, label: 'Media — interrumpe si hace falta' },
  { value: 0.8, label: 'Alta — interrumpe de inmediato' },
] as const

export function interruptionLabel(sensitivity: number): string {
  const closest = AGENT_INTERRUPTION_LEVELS.reduce((best, level) =>
    Math.abs(level.value - sensitivity) < Math.abs(best.value - sensitivity) ? level : best
  )
  return closest.label.split(' — ')[0]
}

export const AGENT_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'sq', label: 'Albanian' },
  { value: 'am', label: 'Amharic' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'eu', label: 'Basque' },
  { value: 'be', label: 'Belarusian' },
  { value: 'bn', label: 'Bengali' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'my', label: 'Burmese' },
  { value: 'ca', label: 'Catalan' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'gl', label: 'Galician' },
  { value: 'ka', label: 'Georgian' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'ht', label: 'Haitian Creole' },
  { value: 'ha', label: 'Hausa' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'id', label: 'Indonesian' },
  { value: 'ga', label: 'Irish' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'jv', label: 'Javanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'km', label: 'Khmer' },
  { value: 'ko', label: 'Korean' },
  { value: 'lo', label: 'Lao' },
  { value: 'la', label: 'Latin' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'lb', label: 'Luxembourgish' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'ms', label: 'Malay' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'mt', label: 'Maltese' },
  { value: 'mi', label: 'Maori' },
  { value: 'mr', label: 'Marathi' },
  { value: 'mn', label: 'Mongolian' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'si', label: 'Sinhala' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'so', label: 'Somali' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'tg', label: 'Tajik' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'uz', label: 'Uzbek' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
  { value: 'xh', label: 'Xhosa' },
  { value: 'yi', label: 'Yiddish' },
  { value: 'yo', label: 'Yoruba' },
  { value: 'zu', label: 'Zulu' },
] as const

export type AgentTemplateAccent = 'emerald' | 'gold' | 'ink' | 'sage' | 'moss' | 'forest' | 'bronze'

export interface AgentTemplate {
  id: string
  name: string
  role: string
  badge: string
  icon: 'home' | 'heart' | 'star' | 'building2' | 'clipboard-list' | 'building' | 'bar-chart-3'
  accent: AgentTemplateAccent
  category: string
  features: string[]
  bestFor: string
  voice: (typeof AGENT_VOICES)[number]
  personality: (typeof AGENT_PERSONALITIES)[number]['value']
  personalityLabel: string
  sensitivity: number
  greetingMessage: string
  systemPrompt: string
}

// Estilos por acento — todos derivados de la paleta de marca esmeralda/marfil
// (nunca colores fuera de marca), usados para diferenciar visualmente cada
// plantilla de agente igual que el dashboard de referencia, sin salir del brand.
export const AGENT_TEMPLATE_ACCENT_STYLES: Record<
  AgentTemplateAccent,
  { iconBg: string; iconText: string; badgeBg: string; badgeText: string; roleText: string; buttonBg: string; buttonBgHover: string; dot: string }
> = {
  emerald: {
    iconBg: 'var(--teal-700)', iconText: '#ffffff',
    badgeBg: 'var(--teal-50)', badgeText: 'var(--teal-700)',
    roleText: 'var(--teal-700)',
    buttonBg: 'var(--teal-700)', buttonBgHover: 'var(--teal-800)',
    dot: 'var(--teal-700)',
  },
  gold: {
    iconBg: 'var(--gold)', iconText: '#ffffff',
    badgeBg: 'rgba(182,138,62,0.14)', badgeText: 'var(--gold)',
    roleText: 'var(--gold)',
    buttonBg: 'var(--gold)', buttonBgHover: '#8F6A2E',
    dot: 'var(--gold)',
  },
  ink: {
    iconBg: 'var(--teal-900)', iconText: '#ffffff',
    badgeBg: 'rgba(14,32,25,0.08)', badgeText: 'var(--teal-900)',
    roleText: 'var(--teal-900)',
    buttonBg: 'var(--teal-900)', buttonBgHover: '#000000',
    dot: 'var(--teal-900)',
  },
  sage: {
    iconBg: 'var(--teal-500)', iconText: '#ffffff',
    badgeBg: 'rgba(21,151,104,0.14)', badgeText: 'var(--teal-500)',
    roleText: 'var(--teal-500)',
    buttonBg: 'var(--teal-500)', buttonBgHover: 'var(--teal-700)',
    dot: 'var(--teal-500)',
  },
  moss: {
    iconBg: 'var(--teal-400)', iconText: '#ffffff',
    badgeBg: 'rgba(61,185,138,0.16)', badgeText: 'var(--teal-800)',
    roleText: 'var(--teal-600)',
    buttonBg: 'var(--teal-400)', buttonBgHover: 'var(--teal-500)',
    dot: 'var(--teal-400)',
  },
  forest: {
    iconBg: 'var(--teal-800)', iconText: '#ffffff',
    badgeBg: 'rgba(10,92,66,0.12)', badgeText: 'var(--teal-800)',
    roleText: 'var(--teal-800)',
    buttonBg: 'var(--teal-800)', buttonBgHover: 'var(--teal-900)',
    dot: 'var(--teal-800)',
  },
  bronze: {
    iconBg: '#8F6A2E', iconText: '#ffffff',
    badgeBg: 'rgba(143,106,46,0.14)', badgeText: '#8F6A2E',
    roleText: '#8F6A2E',
    buttonBg: '#8F6A2E', buttonBgHover: '#6E5222',
    dot: '#8F6A2E',
  },
}

export const AGENT_TEMPLATE_CATEGORIES = [
  'Consultas y valoraciones',
  'Experiencia y seguimiento del paciente',
  'Tratamientos premium y VIP',
  'Depilación láser y corporales',
  'Coordinación de tratamientos',
  'Membresías y paquetes',
] as const

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'alexis',
    name: 'Alexis',
    role: 'Consultora de Tratamientos Faciales',
    badge: 'Más popular',
    icon: 'home',
    accent: 'emerald',
    category: 'Consultas y valoraciones',
    features: ['Agendar citas de valoración', 'Explicar tratamientos disponibles', 'Resolver dudas sobre precios'],
    bestFor: 'Spas médico-estéticos, clínicas de medicina estética',
    voice: 'sage',
    personality: 'professional',
    personalityLabel: 'Profesional',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Gracias por contactarnos. Soy Alexis, ¿en qué tratamiento estás interesado hoy?',
    systemPrompt:
      'Eres Alexis, una consultora de tratamientos estéticos profesional y cercana. Ayudas a los pacientes a elegir el tratamiento adecuado, agendas citas y capturas sus datos de contacto.',
  },
  {
    id: 'grace',
    name: 'Grace',
    role: 'Coordinadora de Experiencia del Paciente',
    badge: 'Favorito de pacientes',
    icon: 'heart',
    accent: 'gold',
    category: 'Experiencia y seguimiento del paciente',
    features: ['Soporte cálido al paciente', 'Seguimiento post-tratamiento', 'Cuidados y recomendaciones'],
    bestFor: 'Clínicas boutique, spas de bienestar',
    voice: 'shimmer',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.8,
    greetingMessage:
      '¡Hola! Gracias por contactarnos. Soy Grace, tu asistente de bienestar. Estoy aquí para que tu experiencia sea lo más cómoda posible.',
    systemPrompt:
      'Eres Grace, una asistente cálida y cercana para un spa médico-estético. Haces que los pacientes se sientan cómodos y acompañados antes y después de sus tratamientos.',
  },
  {
    id: 'maxwell',
    name: 'Maxwell',
    role: 'Especialista en Tratamientos VIP',
    badge: 'Clínicas premium',
    icon: 'star',
    accent: 'ink',
    category: 'Tratamientos premium y VIP',
    features: ['Consultas privadas', 'Atención personalizada', 'Protocolos a medida'],
    bestFor: 'Clínicas de lujo, medicina estética premium',
    voice: 'ballad',
    personality: 'professional',
    personalityLabel: 'Formal',
    sensitivity: 0.2,
    greetingMessage:
      'Buenas tardes, gracias por comunicarse. Soy Maxwell, especialista en tratamientos VIP. Será un placer asistirle.',
    systemPrompt:
      'Eres Maxwell, un especialista formal y discreto en tratamientos estéticos premium. Tu tono es refinado, paciente y orientado al detalle.',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Coordinadora de Depilación Láser',
    badge: 'Enfoque en láser',
    icon: 'building2',
    accent: 'sage',
    category: 'Depilación láser y corporales',
    features: ['Agendar sesiones de láser', 'Explicar el plan de sesiones', 'Consultas sobre cuidados previos'],
    bestFor: 'Centros de depilación láser, clínicas corporales',
    voice: 'shimmer',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Soy Luna. Puedo ayudarte a agendar tu sesión de láser o resolver dudas sobre el tratamiento.',
    systemPrompt:
      'Eres Luna, coordinadora de depilación láser amigable y eficiente. Ayudas a los pacientes a agendar sesiones y explicas el cuidado antes/después con claridad.',
  },
  {
    id: 'aria',
    name: 'Aria',
    role: 'Coordinadora de Nuevos Pacientes',
    badge: 'Primera consulta',
    icon: 'clipboard-list',
    accent: 'moss',
    category: 'Consultas y valoraciones',
    features: ['Primera valoración', 'Historial y contraindicaciones', 'Preguntas frecuentes'],
    bestFor: 'Clínicas en crecimiento, primera línea de contacto',
    voice: 'coral',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Soy Aria. Si es tu primera vez con nosotros, te ayudo a agendar tu valoración inicial.',
    systemPrompt:
      'Eres Aria, coordinadora de nuevos pacientes enfocada en la primera consulta. Agendas valoraciones, recopilas antecedentes relevantes y resuelves dudas frecuentes con claridad.',
  },
  {
    id: 'victor',
    name: 'Victor',
    role: 'Asesor de Medicina Estética',
    badge: 'Enfoque clínico',
    icon: 'building',
    accent: 'forest',
    category: 'Coordinación de tratamientos',
    features: ['Explicación de procedimientos', 'Coordinación con especialistas', 'Cribado de contraindicaciones'],
    bestFor: 'Clínicas médico-estéticas, consultorios de dermatología',
    voice: 'echo',
    personality: 'professional',
    personalityLabel: 'Profesional',
    sensitivity: 0.3,
    greetingMessage: 'Buenas, soy Victor, asesor de medicina estética. ¿En qué tratamiento está interesado?',
    systemPrompt:
      'Eres Victor, asesor clínico enfocado y cuidadoso. Explicas procedimientos médico-estéticos, coordinas con el equipo clínico y siempre preguntas por contraindicaciones (embarazo, alergias, medicamentos) antes de agendar tratamientos sensibles.',
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Coordinadora de Paquetes y Membresías',
    badge: 'Enfoque en paquetes',
    icon: 'bar-chart-3',
    accent: 'bronze',
    category: 'Membresías y paquetes',
    features: ['Consultas de paquetes', 'Explicación de membresías', 'Seguimiento de sesiones restantes'],
    bestFor: 'Spas con programas de membresía, clínicas con paquetes de sesiones',
    voice: 'ash',
    personality: 'professional',
    personalityLabel: 'Formal',
    sensitivity: 0.2,
    greetingMessage: 'Buenas, soy Nova, coordinadora de paquetes y membresías. ¿En qué puedo ayudarte hoy?',
    systemPrompt:
      'Eres Nova, coordinadora de paquetes precisa y clara. Explicas paquetes de sesiones, membresías y precios con datos concretos, nunca inventados.',
  },
]

// --- Widget Templates -------------------------------------------------
// Quick-start presets shown at the bottom of Dashboard → Widget. Each one
// mirrors an AGENT_TEMPLATES persona (same name/voice) but carries the
// widget-specific config (color, position, theme) needed to create an
// embeddable widget in one click. Kept in English + English category
// labels to match the (English) Widget page UI, unlike AGENT_TEMPLATES
// which is Spanish for the (Spanish) Agentes IA page.
export interface WidgetTemplate {
  id: string
  name: string
  role: string
  badge: string
  category: string
  features: string[]
  bestFor: string
  toneLabel: string
  greetingMessage: string
  primaryColor: string
  position: 'bottom-right' | 'bottom-left'
  theme: 'light' | 'dark'
}

export const WIDGET_TEMPLATE_CATEGORIES = [
  'Consultations & Assessments',
  'Patient Experience & Follow-Up',
  'Premium & VIP Treatments',
  'Laser & Body Treatments',
  'Treatment Coordination',
  'Packages & Memberships',
] as const

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'alexis',
    name: 'Alexis',
    role: 'Treatment Consultant',
    badge: 'Most Popular',
    category: 'Consultations & Assessments',
    features: ['Treatment consultation booking', 'Pricing inquiries', 'Availability check'],
    bestFor: 'Medspas, aesthetic clinics',
    toneLabel: 'Sage · Professional',
    greetingMessage: "Hi! Thanks for stopping by — I'm Alexis. What treatment are you interested in today?",
    primaryColor: '#166534',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'grace',
    name: 'Grace',
    role: 'Patient Experience Coordinator',
    badge: 'Patient Favorite',
    category: 'Patient Experience & Follow-Up',
    features: ['Warm patient support', 'Post-treatment follow-up', 'Aftercare guidance'],
    bestFor: 'Boutique clinics, Wellness spas',
    toneLabel: 'Shimmer · Friendly',
    greetingMessage: "Hi there! I'm Grace, your wellness assistant. I'm here to make your visit as comfortable as possible.",
    primaryColor: '#db2777',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'maxwell',
    name: 'Maxwell',
    role: 'VIP Treatment Specialist',
    badge: 'High-End Clinics',
    category: 'Premium & VIP Treatments',
    features: ['Private consultations', 'Personalized care', 'Custom protocols'],
    bestFor: 'Luxury clinics, Premium aesthetics',
    toneLabel: 'Onyx · Formal',
    greetingMessage: 'Good afternoon, thank you for reaching out. This is Maxwell — it would be my pleasure to assist you.',
    primaryColor: '#1e3a8a',
    position: 'bottom-right',
    theme: 'dark',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Laser Treatment Coordinator',
    badge: 'Laser Focused',
    category: 'Laser & Body Treatments',
    features: ['Laser session booking', 'Session plan guidance', 'Pre-care instructions'],
    bestFor: 'Laser hair removal centers, Body clinics',
    toneLabel: 'Shimmer · Friendly',
    greetingMessage: "Hi! I'm Luna. I can help you book your laser session or answer questions about the treatment.",
    primaryColor: '#0d9488',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'owen',
    name: 'Owen',
    role: 'New Patient Coordinator',
    badge: 'First Visit',
    category: 'Consultations & Assessments',
    features: ['Initial assessment booking', 'Intake questions', 'FAQ support'],
    bestFor: 'Growing clinics, First point of contact',
    toneLabel: 'Echo · Professional',
    greetingMessage: "Hi, I'm Owen. First time with us? I'm happy to help you book your initial assessment.",
    primaryColor: '#2563eb',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'nora',
    name: 'Nora',
    role: 'Packages & Memberships Advisor',
    badge: 'Packages & Memberships',
    category: 'Packages & Memberships',
    features: ['Package inquiries', 'Membership details', 'Remaining sessions tracking'],
    bestFor: 'Membership-based spas, Session-package clinics',
    toneLabel: 'Ash · Formal',
    greetingMessage: "Hello, I'm Nora, packages and memberships advisor. What would you like to know?",
    primaryColor: '#7c3aed',
    position: 'bottom-right',
    theme: 'light',
  },
]

// "Maxwell – Luxury Property Specialist Widget" — matches the naming shown
// in the reference video when a widget is created from an agent template.
export function widgetTemplateName(template: WidgetTemplate): string {
  return `${template.name} – ${template.role} Widget`
}

export interface CatalogService {
  key: string
  category: string
  name: string
  description: string
  durationMinutes: number
  priceType: 'fixed' | 'starting_at'
  price: number
}

export const SERVICE_CATALOG_CATEGORIES = [
  'Toxina Botulínica y Rellenos',
  'Depilación Láser',
  'Faciales Médicos',
  'Tratamientos Corporales',
  'Skincare y Peelings',
  'Medicina Estética Avanzada',
  'Bienestar y Spa',
  'Consultas y Valoraciones',
] as const

// Pre-built catalog of 32 treatments across 8 specialties — clicking a card
// creates a business_services row tagged with this `key` so it shows
// "Added to your catalog" instead of duplicating.
export const CATALOG_SERVICES: CatalogService[] = [
  // Toxina Botulínica y Rellenos (4)
  { key: 'botox_frente', category: 'Toxina Botulínica y Rellenos', name: 'Toxina Botulínica - Frente', description: 'Suaviza líneas de expresión en la frente con toxina botulínica.', durationMinutes: 30, priceType: 'starting_at', price: 250 },
  { key: 'botox_patas_gallo', category: 'Toxina Botulínica y Rellenos', name: 'Toxina Botulínica - Patas de Gallo', description: 'Reduce las líneas de expresión alrededor de los ojos.', durationMinutes: 30, priceType: 'starting_at', price: 200 },
  { key: 'rellenos_labios', category: 'Toxina Botulínica y Rellenos', name: 'Rellenos de Labios con Ácido Hialurónico', description: 'Aumento y definición de labios con ácido hialurónico.', durationMinutes: 45, priceType: 'starting_at', price: 350 },
  { key: 'rellenos_pomulos', category: 'Toxina Botulínica y Rellenos', name: 'Rellenos Faciales - Pómulos', description: 'Restaura volumen y contorno facial con ácido hialurónico.', durationMinutes: 45, priceType: 'starting_at', price: 450 },

  // Depilación Láser (4)
  { key: 'laser_axilas', category: 'Depilación Láser', name: 'Depilación Láser - Axilas', description: 'Sesión de depilación láser para axilas.', durationMinutes: 20, priceType: 'fixed', price: 60 },
  { key: 'laser_piernas', category: 'Depilación Láser', name: 'Depilación Láser - Piernas Completas', description: 'Sesión de depilación láser para piernas completas.', durationMinutes: 60, priceType: 'fixed', price: 200 },
  { key: 'laser_facial', category: 'Depilación Láser', name: 'Depilación Láser Facial', description: 'Sesión de depilación láser para rostro (bozo, mentón).', durationMinutes: 20, priceType: 'fixed', price: 50 },
  { key: 'laser_biquini', category: 'Depilación Láser', name: 'Depilación Láser - Zona Íntima', description: 'Sesión de depilación láser en zona íntima.', durationMinutes: 30, priceType: 'fixed', price: 90 },

  // Faciales Médicos (4)
  { key: 'facial_hydrafacial', category: 'Faciales Médicos', name: 'HydraFacial', description: 'Limpieza, exfoliación e hidratación profunda en una sola sesión.', durationMinutes: 60, priceType: 'fixed', price: 150 },
  { key: 'facial_limpieza_profunda', category: 'Faciales Médicos', name: 'Limpieza Facial Profunda', description: 'Extracción profesional y desincrustación de impurezas.', durationMinutes: 60, priceType: 'fixed', price: 80 },
  { key: 'facial_dermapen', category: 'Faciales Médicos', name: 'Dermapen - Microneedling', description: 'Estimula colágeno para mejorar textura y cicatrices de acné.', durationMinutes: 60, priceType: 'starting_at', price: 180 },
  { key: 'facial_radiofrecuencia', category: 'Faciales Médicos', name: 'Radiofrecuencia Facial', description: 'Tensado de piel no invasivo con radiofrecuencia.', durationMinutes: 45, priceType: 'starting_at', price: 150 },

  // Tratamientos Corporales (4)
  { key: 'corporal_criolipolisis', category: 'Tratamientos Corporales', name: 'Criolipólisis', description: 'Reducción de grasa localizada mediante congelación controlada.', durationMinutes: 60, priceType: 'starting_at', price: 300 },
  { key: 'corporal_radiofrecuencia', category: 'Tratamientos Corporales', name: 'Radiofrecuencia Corporal', description: 'Tratamiento reafirmante para flacidez corporal.', durationMinutes: 60, priceType: 'starting_at', price: 180 },
  { key: 'corporal_masaje_reductor', category: 'Tratamientos Corporales', name: 'Masaje Reductor', description: 'Masaje corporal enfocado en reducción de medidas.', durationMinutes: 50, priceType: 'fixed', price: 70 },
  { key: 'corporal_presoterapia', category: 'Tratamientos Corporales', name: 'Presoterapia', description: 'Drenaje linfático asistido para reducir retención de líquidos.', durationMinutes: 40, priceType: 'fixed', price: 60 },

  // Skincare y Peelings (4)
  { key: 'peeling_quimico', category: 'Skincare y Peelings', name: 'Peeling Químico', description: 'Exfoliación química para renovar la piel y mejorar su textura.', durationMinutes: 45, priceType: 'starting_at', price: 120 },
  { key: 'skincare_consulta', category: 'Skincare y Peelings', name: 'Consulta de Skincare Personalizada', description: 'Evaluación de piel y recomendación de rutina personalizada.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'peeling_despigmentante', category: 'Skincare y Peelings', name: 'Peeling Despigmentante', description: 'Tratamiento para manchas y uniformidad del tono de piel.', durationMinutes: 45, priceType: 'starting_at', price: 140 },
  { key: 'skincare_mascarilla_led', category: 'Skincare y Peelings', name: 'Terapia de Luz LED', description: 'Sesión de fototerapia LED para acné, rejuvenecimiento o cicatrización.', durationMinutes: 30, priceType: 'fixed', price: 70 },

  // Medicina Estética Avanzada (4)
  { key: 'plasma_rico_plaquetas', category: 'Medicina Estética Avanzada', name: 'Plasma Rico en Plaquetas (PRP)', description: 'Rejuvenecimiento facial o capilar con plasma autólogo.', durationMinutes: 60, priceType: 'starting_at', price: 350 },
  { key: 'hilos_tensores', category: 'Medicina Estética Avanzada', name: 'Hilos Tensores', description: 'Efecto lifting no quirúrgico con hilos reabsorbibles.', durationMinutes: 60, priceType: 'starting_at', price: 500 },
  { key: 'mesoterapia_facial', category: 'Medicina Estética Avanzada', name: 'Mesoterapia Facial', description: 'Microinyecciones de vitaminas y ácido hialurónico para hidratar la piel.', durationMinutes: 45, priceType: 'starting_at', price: 150 },
  { key: 'bichectomia_consulta', category: 'Medicina Estética Avanzada', name: 'Consulta de Bichectomía', description: 'Valoración para reducción de volumen en mejillas.', durationMinutes: 30, priceType: 'fixed', price: 0 },

  // Bienestar y Spa (4)
  { key: 'spa_masaje_relajante', category: 'Bienestar y Spa', name: 'Masaje Relajante', description: 'Masaje corporal completo para liberar tensión y estrés.', durationMinutes: 60, priceType: 'fixed', price: 65 },
  { key: 'spa_dia_completo', category: 'Bienestar y Spa', name: 'Día de Spa Completo', description: 'Paquete de bienestar con varios tratamientos en un solo día.', durationMinutes: 180, priceType: 'starting_at', price: 250 },
  { key: 'spa_manicure_pedicure', category: 'Bienestar y Spa', name: 'Manicure y Pedicure Spa', description: 'Cuidado completo de manos y pies con exfoliación e hidratación.', durationMinutes: 75, priceType: 'fixed', price: 55 },
  { key: 'spa_ritual_facial_corporal', category: 'Bienestar y Spa', name: 'Ritual Facial y Corporal', description: 'Combinación de tratamiento facial y corporal relajante.', durationMinutes: 90, priceType: 'starting_at', price: 130 },

  // Consultas y Valoraciones (4)
  { key: 'consulta_valoracion_inicial', category: 'Consultas y Valoraciones', name: 'Valoración Inicial', description: 'Primera consulta para evaluar objetivos y diseñar un plan de tratamiento.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'consulta_seguimiento', category: 'Consultas y Valoraciones', name: 'Consulta de Seguimiento', description: 'Revisión de resultados y ajuste del plan de tratamiento.', durationMinutes: 20, priceType: 'fixed', price: 0 },
  { key: 'consulta_medica_especializada', category: 'Consultas y Valoraciones', name: 'Consulta Médico-Estética Especializada', description: 'Evaluación con médico especialista para tratamientos avanzados.', durationMinutes: 45, priceType: 'starting_at', price: 50 },
  { key: 'consulta_plan_paquete', category: 'Consultas y Valoraciones', name: 'Diseño de Plan de Paquete', description: 'Sesión para armar un paquete de tratamientos personalizado.', durationMinutes: 30, priceType: 'fixed', price: 0 },
]

export const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime'

export const APPOINTMENT_STATUSES = ['pending_confirmation', 'scheduled', 'completed', 'cancelled', 'no_show'] as const

export const PAYMENT_STATUSES = ['not_required', 'pending', 'paid', 'cash', 'refunded'] as const

export const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || null
