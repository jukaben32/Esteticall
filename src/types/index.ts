import type { Tables } from './database'

export type Business = Tables<'businesses'>
export type BusinessSubscription = Tables<'business_subscriptions'>
export type AiAgent = Tables<'ai_agents'>
export type Listing = Tables<'listings'>
export type ListingPhoto = Tables<'listing_photos'>
export type Client = Tables<'clients'>
export type Conversation = Tables<'conversations'>
export type ConversationMessage = Tables<'conversation_messages'>
export type Appointment = Tables<'appointments'>
export type BusinessAvailability = Tables<'business_availability'>
export type KnowledgeDocument = Tables<'knowledge_documents'>
export type Widget = Tables<'widgets'>
export type WidgetWithAgent = Widget & { agent_name: string | null }
export type Website = Tables<'websites'>
export type WebsiteService = Tables<'website_services'>
export type WebsiteTeamMember = Tables<'website_team_members'>
export type WebsiteTestimonial = Tables<'website_testimonials'>
export type WebsiteSpecialty = Tables<'website_specialties'>
export type WebsiteFaq = Tables<'website_faqs'>
export interface WebsiteContent {
  website: Website
  services: WebsiteService[]
  teamMembers: WebsiteTeamMember[]
  testimonials: WebsiteTestimonial[]
  specialties: WebsiteSpecialty[]
  faqs: WebsiteFaq[]
}
export type Notification = Tables<'notifications'>
export type SupportTicket = Tables<'support_tickets'>
export type SupportMessage = Tables<'support_messages'>
export type SupportTicketWithClient = SupportTicket & {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  last_message: string | null
}
export type BusinessService = Tables<'business_services'>
export type AgentService = Tables<'agent_services'>

export type PlanId = 'free' | 'pro' | 'business'

export interface PlanLimits {
  id: PlanId
  name: string
  priceUsd: number
  agentLimit: number // 0 = unlimited
  bookingLimit: number // 0 = unlimited
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export interface DashboardAnalytics {
  conversations_today: number
  conversations_this_week: number
  conversations_this_month: number
  appointments_today: number
  appointments_this_week: number
}

export interface ListingWithPhotos extends Listing {
  photos: ListingPhoto[]
  agents: Pick<AiAgent, 'id' | 'name' | 'specialty' | 'status'>[]
}

export interface ConversationWithClient extends Conversation {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
}

export interface AppointmentWithDetails extends Appointment {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email' | 'budget' | 'pre_approval_number'> | null
  service: Pick<BusinessService, 'id' | 'name' | 'price' | 'duration_minutes'> | null
  listing: Pick<Listing, 'id' | 'title' | 'listing_code'> | null
}

// Client Portal — same shape, plus which business it's with (a client can
// have booked with more than one business, so this can't be inferred from
// a single logged-in "account" the way the dashboard's businessId is).
export interface PortalAppointment extends AppointmentWithDetails {
  business: Pick<Business, 'id' | 'name' | 'phone' | 'contact_email'> | null
}

export interface PortalSupportTicket extends SupportTicketWithClient {
  business_name: string | null
}

// ─── Scheduling ───────────────────────────────────────────────────────────
export interface AvailableSlot {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  datetime: string // ISO 8601, business timezone-aware
}

// ─── AI Realtime Voice ────────────────────────────────────────────────────
export interface RealtimeTurnDetection {
  type: 'server_vad' | 'semantic_vad'
  threshold: number
  prefix_padding_ms: number
  silence_duration_ms: number
}

export interface RealtimeTool {
  type: 'function'
  name: string
  description: string
  parameters: Record<string, unknown>
}

// What POST /api/agents/[agentId]/session returns: an ephemeral client secret
// plus the session shape the browser hands to the OpenAI Realtime API.
export interface RealtimeSessionResponse {
  conversationId: string
  agentName: string
  voice: string
  model: string
  systemPrompt: string
  tools: RealtimeTool[]
  turnDetection: RealtimeTurnDetection
  clientSecret: string
  expiresAt: string
}

export interface VoiceCallOutcome {
  clientName?: string
  clientPhone?: string
  budget?: number
  listingId?: string
  appointment?: {
    date: string
    time: string
  }
  outcome: 'booked_viewing' | 'qualified_lead' | 'no_action' | 'escalated'
}

// ─── API response envelope ────────────────────────────────────────────────
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
