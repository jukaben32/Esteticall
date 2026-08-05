import type { PlanId, PlanLimits } from '@/types'

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    name: process.env.NEXT_PUBLIC_FREE_PLAN_NAME ?? 'Free',
    priceUsd: 0,
    agentLimit: Number(process.env.NEXT_PUBLIC_FREE_AGENT_LIMIT ?? 1),
    bookingLimit: Number(process.env.NEXT_PUBLIC_FREE_BOOKING_LIMIT ?? 5),
  },
  pro: {
    id: 'pro',
    name: process.env.NEXT_PUBLIC_PRO_PLAN_NAME ?? 'Pro',
    priceUsd: Number(process.env.NEXT_PUBLIC_PRO_PLAN_PRICE_USD ?? 49),
    agentLimit: Number(process.env.NEXT_PUBLIC_PRO_AGENT_LIMIT ?? 10),
    bookingLimit: Number(process.env.NEXT_PUBLIC_PRO_BOOKING_LIMIT ?? 99),
  },
  business: {
    id: 'business',
    name: process.env.NEXT_PUBLIC_BUSINESS_PLAN_NAME ?? 'Business',
    priceUsd: Number(process.env.NEXT_PUBLIC_BUSINESS_PLAN_PRICE_USD ?? 199),
    agentLimit: Number(process.env.NEXT_PUBLIC_BUSINESS_AGENT_LIMIT ?? 0),
    bookingLimit: Number(process.env.NEXT_PUBLIC_BUSINESS_BOOKING_LIMIT ?? 0),
  },
}

export const WEBSITE_BUILDER_PRICE_USD = Number(
  process.env.NEXT_PUBLIC_WEBSITE_BUILDER_PRICE_USD ?? 29
)

// 0 means "unlimited" in the env contract.
export function isWithinLimit(used: number, limit: number): boolean {
  return limit === 0 || used < limit
}

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'condo', label: 'Condo' },
  { value: 'land', label: 'Land' },
] as const

export const LISTING_STATUSES = [
  { value: 'available', label: 'Available', color: 'green' },
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'sold', label: 'Sold', color: 'slate' },
  { value: 'rented', label: 'Rented', color: 'blue' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'red' },
] as const

export const PRICE_DISPLAY_OPTIONS = [
  { value: 'fixed', label: 'Precio fijo' },
  { value: 'negotiable', label: 'Negociable' },
  { value: 'starting_at', label: 'Desde' },
  { value: 'contact', label: 'Consultar precio' },
] as const

export const LISTING_TYPES = [
  { value: 'sale', label: 'For Sale' },
  { value: 'rent', label: 'For Rent' },
  { value: 'vacation_rental', label: 'Vacation Rental' },
] as const

export const RENTAL_PERIODS = [
  { value: 'night', label: 'Por noche' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mes' },
] as const

export const AMENITIES = [
  'Pool',
  'Garage',
  'Garden',
  'Balcony',
  'Fireplace',
  'Air Conditioning',
  'Pet Friendly',
  'Gym',
  'Elevator',
  'Security System',
  'Laundry',
  'Storage',
  'Solar Panels',
  'Smart Home',
  'Sea View',
  'City View',
] as const

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
  'Compra y venta residencial',
  'Experiencia y seguimiento de compradores',
  'Propiedades de lujo y premium',
  'Rentas residenciales y comerciales',
  'Representación de vendedores y listados',
  'Propiedades comerciales y de inversión',
] as const

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'alexis',
    name: 'Alexis',
    role: 'Agente de Ventas Residencial',
    badge: 'Más popular',
    icon: 'home',
    accent: 'emerald',
    category: 'Compra y venta residencial',
    features: ['Agendar visitas a propiedades', 'Agendar consultas con compradores', 'Consultas sobre listados'],
    bestFor: 'Agencias residenciales, representación de compradores',
    voice: 'sage',
    personality: 'professional',
    personalityLabel: 'Profesional',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Gracias por llamar. Soy Alexis, ¿en qué propiedad estás interesado hoy?',
    systemPrompt:
      'Eres Alexis, un agente de ventas residencial profesional y directo. Ayuda a los compradores a encontrar propiedades, agenda visitas y captura sus datos de contacto.',
  },
  {
    id: 'grace',
    name: 'Grace',
    role: 'Coordinadora de Relaciones con Clientes',
    badge: 'Favorito de clientes',
    icon: 'heart',
    accent: 'gold',
    category: 'Experiencia y seguimiento de compradores',
    features: ['Soporte cálido al cliente', 'Seguimiento post-visita', 'Orientación de zona'],
    bestFor: 'Agencias de compradores, especialistas en reubicación',
    voice: 'shimmer',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.8,
    greetingMessage:
      '¡Hola! Gracias por llamar. Soy Grace, tu concierge inmobiliaria. Estoy aquí para que encontrar tu propiedad ideal sea lo más fácil posible.',
    systemPrompt:
      'Eres Grace, una concierge de clientes cálida y cercana para una agencia inmobiliaria. Haces que los compradores se sientan cómodos y acompañados en su proceso.',
  },
  {
    id: 'maxwell',
    name: 'Maxwell',
    role: 'Especialista en Propiedades de Lujo',
    badge: 'Agencias premium',
    icon: 'star',
    accent: 'ink',
    category: 'Propiedades de lujo y premium',
    features: ['Consultas privadas de exhibición', 'Servicio privado al cliente', 'Resúmenes de inversión'],
    bestFor: 'Agencias de lujo, especialistas en bienes raíces premium',
    voice: 'ballad',
    personality: 'professional',
    personalityLabel: 'Formal',
    sensitivity: 0.2,
    greetingMessage:
      'Buenas tardes, gracias por comunicarse. Soy Maxwell, especialista en propiedades de lujo. Será un placer asistirle.',
    systemPrompt:
      'Eres Maxwell, un especialista formal y discreto en propiedades de lujo. Tu tono es refinado, paciente y orientado al detalle.',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Coordinadora de Recepción de Rentas',
    badge: 'Enfoque en rentas',
    icon: 'building2',
    accent: 'sage',
    category: 'Rentas residenciales y comerciales',
    features: ['Agendar visitas de renta', 'Guía de aplicación', 'Consultas de contrato'],
    bestFor: 'Administradoras de propiedades, agencias de renta',
    voice: 'shimmer',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Soy Luna. Puedo ayudarte a agendar una visita o resolver dudas sobre nuestras rentas disponibles.',
    systemPrompt:
      'Eres Luna, coordinadora de rentas amigable y eficiente. Ayudas a los interesados a agendar visitas y explicas el proceso de aplicación con claridad.',
  },
  {
    id: 'aria',
    name: 'Aria',
    role: 'Coordinadora de Nuevos Listados',
    badge: 'Enfoque en vendedores',
    icon: 'clipboard-list',
    accent: 'moss',
    category: 'Representación de vendedores y listados',
    features: ['Citas de listado', 'Análisis de mercado (CMA)', 'Preguntas frecuentes de vendedores'],
    bestFor: 'Agentes listadores, representación de vendedores',
    voice: 'coral',
    personality: 'friendly',
    personalityLabel: 'Amigable',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Soy Aria. Si estás pensando en vender tu propiedad, te ayudo a coordinar los siguientes pasos.',
    systemPrompt:
      'Eres Aria, coordinadora de nuevos listados enfocada en vendedores. Agendas citas de listado, explicas el análisis de mercado y resuelves dudas frecuentes con claridad.',
  },
  {
    id: 'victor',
    name: 'Victor',
    role: 'Asesor de Bienes Raíces Comerciales',
    badge: 'Enfoque comercial',
    icon: 'building',
    accent: 'forest',
    category: 'Propiedades comerciales y de inversión',
    features: ['Muestras comerciales', 'Manejo de consultas de inversión', 'Consultas de arrendamiento'],
    bestFor: 'Corredoras comerciales, firmas de inversión',
    voice: 'echo',
    personality: 'professional',
    personalityLabel: 'Profesional',
    sensitivity: 0.3,
    greetingMessage: 'Buenas, soy Victor, asesor de bienes raíces comerciales. ¿En qué tipo de propiedad está interesado?',
    systemPrompt:
      'Eres Victor, asesor comercial enfocado y analítico. Manejas muestras de propiedades comerciales, consultas de inversión y arrendamiento con precisión.',
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Coordinadora de Inversión Inmobiliaria',
    badge: 'Enfoque en inversionistas',
    icon: 'bar-chart-3',
    accent: 'bronze',
    category: 'Propiedades comerciales y de inversión',
    features: ['Consultas de inversión', 'Sesiones de estrategia de portafolio', 'Solicitudes de informe de mercado'],
    bestFor: 'Agencias de propiedades de inversión, firmas de patrimonio',
    voice: 'ash',
    personality: 'professional',
    personalityLabel: 'Formal',
    sensitivity: 0.2,
    greetingMessage: 'Buenas, soy Nova, coordinadora de inversión inmobiliaria. ¿En qué puedo ayudarte hoy?',
    systemPrompt:
      'Eres Nova, coordinadora de inversión precisa y analítica. Explicas cap rate, NOI y retorno de inversión con datos concretos, nunca inventados.',
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
  'Home Buying & Selling',
  'Buyer Experience & Follow-Up',
  'Luxury & Premium Properties',
  'Residential & Commercial Rentals',
  'Seller Representation & Listings',
  'Commercial & Investment Properties',
] as const

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'alexis',
    name: 'Alexis',
    role: 'Residential Sales Agent',
    badge: 'Most Popular',
    category: 'Home Buying & Selling',
    features: ['Property viewing booking', 'Buyer consultation scheduling', 'Listing inquiries'],
    bestFor: 'Residential agencies, Buyer representation',
    toneLabel: 'Sage · Professional',
    greetingMessage: "Hi! Thanks for stopping by — I'm Alexis. What kind of property are you looking for today?",
    primaryColor: '#166534',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'grace',
    name: 'Grace',
    role: 'Client Relations Coordinator',
    badge: 'Client Favorite',
    category: 'Buyer Experience & Follow-Up',
    features: ['Warm client support', 'Follow-up scheduling', 'Neighborhood guidance'],
    bestFor: 'Buyer agencies, Relocation specialists',
    toneLabel: 'Shimmer · Friendly',
    greetingMessage: "Hi there! I'm Grace, your concierge. I'm here to make finding your next home as easy as possible.",
    primaryColor: '#db2777',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'maxwell',
    name: 'Maxwell',
    role: 'Luxury Property Specialist',
    badge: 'High-End Agencies',
    category: 'Luxury & Premium Properties',
    features: ['Exclusive showing consultations', 'Private client service', 'Investment briefings'],
    bestFor: 'Luxury agencies, Estate specialists',
    toneLabel: 'Onyx · Formal',
    greetingMessage: 'Good afternoon, thank you for reaching out. This is Maxwell — it would be my pleasure to assist you.',
    primaryColor: '#1e3a8a',
    position: 'bottom-right',
    theme: 'dark',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Rental Intake Coordinator',
    badge: 'Rental Focused',
    category: 'Residential & Commercial Rentals',
    features: ['Rental showing scheduling', 'Application guidance', 'Lease inquiries'],
    bestFor: 'Property management firms, Rental agencies',
    toneLabel: 'Shimmer · Friendly',
    greetingMessage: "Hi! I'm Luna. I can help you book a showing or answer questions about our available rentals.",
    primaryColor: '#0d9488',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'owen',
    name: 'Owen',
    role: 'Listing Specialist',
    badge: 'For Sellers',
    category: 'Seller Representation & Listings',
    features: ['Seller consultations', 'Valuation updates', 'Photo session scheduling'],
    bestFor: 'Listing agents, Seller representation teams',
    toneLabel: 'Echo · Professional',
    greetingMessage: "Hi, I'm Owen. Thinking about selling your property? I'm happy to walk you through the process.",
    primaryColor: '#2563eb',
    position: 'bottom-right',
    theme: 'light',
  },
  {
    id: 'nora',
    name: 'Nora',
    role: 'Commercial Investment Advisor',
    badge: 'Commercial & Investment',
    category: 'Commercial & Investment Properties',
    features: ['Investment property analysis', 'Cap rate & ROI', 'Commercial inquiries'],
    bestFor: 'Commercial firms, Institutional investors',
    toneLabel: 'Ash · Formal',
    greetingMessage: "Hello, I'm Nora, commercial investment advisor. What type of property are you interested in?",
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
  'Ventas Residenciales',
  'Rentas de Propiedades',
  'Bienes Raíces Comerciales',
  'Administración de Propiedades',
  'Inversión y Financiamiento',
  'Propiedades de Lujo',
  'Construcción Nueva',
  'Cierre y Transacciones',
] as const

// Pre-built catalog matching the reference template's "32 services across 8
// specialties" — clicking a card creates a business_services row tagged with
// this `key` so it shows "Added to your catalog" instead of duplicating.
export const CATALOG_SERVICES: CatalogService[] = [
  // Ventas Residenciales (6)
  { key: 'buyer_consultation', category: 'Ventas Residenciales', name: 'Consulta con Comprador', description: 'Sesión individual para entender necesidades, presupuesto y tiempos antes de iniciar la búsqueda.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'property_viewing', category: 'Ventas Residenciales', name: 'Visita a Propiedad', description: 'Recorrido guiado de una propiedad listada con walkthrough completo y desglose de características.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'market_analysis_cma', category: 'Ventas Residenciales', name: 'Análisis de Mercado (CMA)', description: 'Análisis comparativo de mercado para determinar el valor preciso de una propiedad según ventas recientes.', durationMinutes: 45, priceType: 'fixed', price: 0 },
  { key: 'listing_appointment', category: 'Ventas Residenciales', name: 'Cita de Listado', description: 'Consulta en la propiedad para evaluarla, asesorar sobre precio y delinear el proceso de venta.', durationMinutes: 90, priceType: 'fixed', price: 0 },
  { key: 'offer_negotiation', category: 'Ventas Residenciales', name: 'Sesión de Negociación de Oferta', description: 'Sesión dedicada a revisar, preparar y negociar ofertas de compra en representación del cliente.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'contract_review', category: 'Ventas Residenciales', name: 'Revisión de Contrato', description: 'Revisión detallada del contrato de compra, contingencias y términos explicados en lenguaje claro.', durationMinutes: 45, priceType: 'fixed', price: 0 },

  // Rentas de Propiedades (5)
  { key: 'rental_property_showing', category: 'Rentas de Propiedades', name: 'Muestra de Propiedad en Renta', description: 'Muestra programada de unidades de renta disponibles con recorrido completo y orientación de aplicación.', durationMinutes: 45, priceType: 'fixed', price: 0 },
  { key: 'tenant_screening', category: 'Rentas de Propiedades', name: 'Consulta de Selección de Inquilino', description: 'Revisión de requisitos de aplicación de renta, criterios de selección y tiempos del proceso.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'lease_signing', category: 'Rentas de Propiedades', name: 'Cita de Firma de Contrato', description: 'Sesión presencial o virtual para revisar, explicar y ejecutar el contrato de arrendamiento.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'move_in_inspection', category: 'Rentas de Propiedades', name: 'Inspección de Mudanza', description: 'Recorrido detallado de la propiedad en renta para documentar su condición y completar el checklist de entrada.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'rental_portfolio_review', category: 'Rentas de Propiedades', name: 'Revisión de Portafolio de Rentas', description: 'Evaluación del portafolio de inversión en renta con análisis de vacancia y recomendaciones de optimización.', durationMinutes: 60, priceType: 'starting_at', price: 150 },

  // Bienes Raíces Comerciales (4)
  { key: 'commercial_property_viewing', category: 'Bienes Raíces Comerciales', name: 'Visita a Propiedad Comercial', description: 'Recorrido guiado del espacio comercial con zonificación, metraje y opciones de layout.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'commercial_lease_consultation', category: 'Bienes Raíces Comerciales', name: 'Consulta de Arrendamiento Comercial', description: 'Revisión a fondo de términos de arrendamiento comercial, estructuras NNN, cargos CAM y mejoras del inquilino.', durationMinutes: 60, priceType: 'starting_at', price: 200 },
  { key: 'investment_property_analysis', category: 'Bienes Raíces Comerciales', name: 'Análisis de Propiedad de Inversión', description: 'Cap rate, NOI y análisis de retorno sobre efectivo invertido para propiedades comerciales de inversión.', durationMinutes: 90, priceType: 'starting_at', price: 300 },
  { key: 'business_relocation', category: 'Bienes Raíces Comerciales', name: 'Consulta de Reubicación de Negocio', description: 'Planeación estratégica para reubicar oficina o local, incluyendo evaluación de necesidades y selección de sitio.', durationMinutes: 60, priceType: 'fixed', price: 0 },

  // Administración de Propiedades (4)
  { key: 'property_management_onboarding', category: 'Administración de Propiedades', name: 'Incorporación de Administración', description: 'Consulta inicial para transferir responsabilidades de administración, configurar sistemas y delinear el reporte al propietario.', durationMinutes: 90, priceType: 'fixed', price: 0 },
  { key: 'annual_property_review', category: 'Administración de Propiedades', name: 'Revisión Anual de Propiedad', description: 'Revisión integral del desempeño de la propiedad, tarifas de renta, historial de mantenimiento y metas del propietario.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'maintenance_coordination', category: 'Administración de Propiedades', name: 'Coordinación de Mantenimiento', description: 'Llamada para coordinar reparaciones, proveedores y tiempos de mantenimiento con el propietario.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'owner_financial_reporting', category: 'Administración de Propiedades', name: 'Reporte Financiero al Propietario', description: 'Sesión para revisar estados de cuenta, ingresos por renta y gastos del periodo con el propietario.', durationMinutes: 45, priceType: 'fixed', price: 0 },

  // Inversión y Financiamiento (4)
  { key: 'financing_prequalification', category: 'Inversión y Financiamiento', name: 'Llamada de Pre-calificación', description: 'Orientación inicial sobre opciones de financiamiento y pre-calificación antes de iniciar la búsqueda.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'cash_flow_analysis', category: 'Inversión y Financiamiento', name: 'Análisis de Flujo de Caja', description: 'Proyección de ingresos y gastos para evaluar la rentabilidad de una propiedad de inversión.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'refinance_consultation', category: 'Inversión y Financiamiento', name: 'Consulta de Refinanciamiento', description: 'Revisión de opciones de refinanciamiento para propietarios e inversionistas.', durationMinutes: 45, priceType: 'fixed', price: 0 },
  { key: 'exchange_consultation', category: 'Inversión y Financiamiento', name: 'Consulta de Intercambio de Propiedades', description: 'Orientación sobre estrategias de intercambio para diferir impuestos en la venta de propiedades de inversión.', durationMinutes: 60, priceType: 'fixed', price: 0 },

  // Propiedades de Lujo (3)
  { key: 'private_showing', category: 'Propiedades de Lujo', name: 'Consulta de Exhibición Privada', description: 'Recorrido privado y exclusivo de una propiedad de lujo, con atención personalizada.', durationMinutes: 90, priceType: 'fixed', price: 0 },
  { key: 'luxury_market_briefing', category: 'Propiedades de Lujo', name: 'Informe de Mercado de Lujo', description: 'Resumen del segmento premium: tendencias, comparables y posicionamiento de precio.', durationMinutes: 45, priceType: 'fixed', price: 0 },
  { key: 'concierge_relocation', category: 'Propiedades de Lujo', name: 'Servicio de Reubicación Concierge', description: 'Acompañamiento integral para clientes que se reubican, desde la búsqueda hasta el cierre.', durationMinutes: 60, priceType: 'fixed', price: 0 },

  // Construcción Nueva (3)
  { key: 'new_construction_walkthrough', category: 'Construcción Nueva', name: 'Recorrido de Construcción Nueva', description: 'Visita guiada a un desarrollo de construcción nueva, con detalle de acabados y opciones disponibles.', durationMinutes: 60, priceType: 'fixed', price: 0 },
  { key: 'builder_consultation', category: 'Construcción Nueva', name: 'Consulta con Constructora', description: 'Sesión para conectar al cliente con el equipo de la constructora y resolver dudas del proyecto.', durationMinutes: 45, priceType: 'fixed', price: 0 },
  { key: 'custom_home_planning', category: 'Construcción Nueva', name: 'Sesión de Planeación de Casa a Medida', description: 'Consulta inicial para definir alcance, presupuesto y tiempos de un proyecto de casa a medida.', durationMinutes: 90, priceType: 'fixed', price: 0 },

  // Cierre y Transacciones (3)
  { key: 'closing_coordination', category: 'Cierre y Transacciones', name: 'Llamada de Coordinación de Cierre', description: 'Coordinación de fechas, documentos y requisitos pendientes antes del cierre de la transacción.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'title_escrow_consultation', category: 'Cierre y Transacciones', name: 'Consulta de Título y Custodia', description: 'Explicación del proceso de título y cuenta en custodia (escrow) antes del cierre.', durationMinutes: 30, priceType: 'fixed', price: 0 },
  { key: 'final_walkthrough', category: 'Cierre y Transacciones', name: 'Recorrido Final', description: 'Inspección final de la propiedad justo antes del cierre para confirmar su condición.', durationMinutes: 30, priceType: 'fixed', price: 0 },
]

export const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime'

export const APPOINTMENT_STATUSES = ['pending_confirmation', 'scheduled', 'completed', 'cancelled', 'no_show'] as const

export const PAYMENT_STATUSES = ['not_required', 'pending', 'paid', 'cash', 'refunded'] as const

export const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || null
