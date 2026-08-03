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

export interface AgentTemplate {
  id: string
  name: string
  role: string
  badge: string
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
    role: 'Coordinadora de Rentas',
    badge: 'Enfoque en rentas',
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
    id: 'owen',
    name: 'Owen',
    role: 'Especialista en Listados',
    badge: 'Para vendedores',
    category: 'Representación de vendedores y listados',
    features: ['Consultas de vendedores', 'Actualizaciones de valuación', 'Programar sesión de fotos'],
    bestFor: 'Agentes listadores, equipos de representación de vendedores',
    voice: 'echo',
    personality: 'professional',
    personalityLabel: 'Profesional',
    sensitivity: 0.5,
    greetingMessage: '¡Hola! Soy Owen. Si estás pensando en vender tu propiedad, con gusto te oriento en el proceso.',
    systemPrompt:
      'Eres Owen, especialista en listados enfocado en vendedores. Explicas el proceso de venta con claridad y agendas consultas de valuación.',
  },
  {
    id: 'nora',
    name: 'Nora',
    role: 'Asesora de Inversión Comercial',
    badge: 'Comercial e inversión',
    category: 'Propiedades comerciales y de inversión',
    features: ['Análisis de propiedades de inversión', 'Cap rate y retorno', 'Consultas comerciales'],
    bestFor: 'Firmas comerciales, inversionistas institucionales',
    voice: 'ash',
    personality: 'professional',
    personalityLabel: 'Formal',
    sensitivity: 0.2,
    greetingMessage: 'Buenas, soy Nora, asesora de inversión comercial. ¿En qué tipo de propiedad está interesado?',
    systemPrompt:
      'Eres Nora, asesora comercial precisa y analítica. Explicas cap rate, NOI y retorno de inversión con datos concretos, nunca inventados.',
  },
]

export const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime'

export const APPOINTMENT_STATUSES = ['pending_confirmation', 'scheduled', 'completed', 'cancelled', 'no_show'] as const

export const PAYMENT_STATUSES = ['not_required', 'pending', 'paid', 'cash', 'refunded'] as const

export const DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || null
