import type { Tables } from './database'

export type Business = Tables<'businesses'>
export type BusinessSubscription = Tables<'business_subscriptions'>
export type AiAgent = Tables<'ai_agents'>
export type Client = Tables<'clients'>
export type Conversation = Tables<'conversations'>
export type ConversationMessage = Tables<'conversation_messages'>
export type Appointment = Tables<'appointments'>
export type BusinessAvailability = Tables<'business_availability'>
export type KnowledgeDocument = Tables<'knowledge_documents'>
export type PlatformKnowledgeDocument = Tables<'platform_knowledge_documents'>
export type WhatsappConnection = Tables<'whatsapp_connections'>
export type Widget = Tables<'widgets'>
export type WidgetWithAgent = Widget & { agent_name: string | null }
export type Website = Tables<'websites'>
export type WebsiteSubscriber = Tables<'website_subscribers'>
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
  includedVoiceMinutes: number // resets every calendar month, never "unlimited"
}

// ─── Dashboard ────────────────────────────────────────────────────────────
export interface DashboardAnalytics {
  conversations_today: number
  conversations_this_week: number
  conversations_this_month: number
  appointments_today: number
  appointments_this_week: number
}

// ─── Packages / membresías (prepaid session bundles) ──────────────────────
export type Package = Tables<'packages'>
export type ClientPackageCredit = Tables<'client_package_credits'>

export interface ClientPackageCreditWithDetails extends ClientPackageCredit {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  package: Pick<Package, 'id' | 'name' | 'session_count' | 'price'> | null
}

// ─── Fichas de tratamiento / consentimientos / antes-después ──────────────
export type TreatmentRecord = Tables<'treatment_records'>
export type ConsentForm = Tables<'consent_forms'>
export type BeforeAfterPhoto = Tables<'before_after_photos'>
export type AuditLogEntry = Tables<'audit_log'>

export interface TreatmentRecordWithDetails extends TreatmentRecord {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  service: Pick<BusinessService, 'id' | 'name'> | null
  photos: BeforeAfterPhoto[]
}

// ─── Bank transfer payments (manual plan-upgrade path) ────────────────────
export type BankTransferPayment = Tables<'bank_transfer_payments'>

export interface ConversationWithClient extends Conversation {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
}

export interface AppointmentWithDetails extends Appointment {
  client: Pick<Client, 'id' | 'name' | 'phone' | 'email'> | null
  service: Pick<BusinessService, 'id' | 'name' | 'price' | 'duration_minutes'> | null
}

// Client Portal — same shape, plus which business it's with (a client can
// have booked with more than one business, so this can't be inferred from
// a single logged-in "account" the way the dashboard's businessId is).
export interface PortalAppointment extends AppointmentWithDetails {
  business: Pick<Business, 'id' | 'name' | 'phone' | 'contact_email' | 'stripe_connected'> | null
}

export interface PortalSupportTicket extends SupportTicketWithClient {
  business_name: string | null
}

export interface PortalPackageCredit extends ClientPackageCreditWithDetails {
  business: Pick<Business, 'id' | 'name'> | null
}

export interface PortalConsentForm {
  id: string
  business_id: string
  client_id: string
  service_id: string | null
  appointment_id: string | null
  title: string
  content: string
  status: ConsentForm['status']
  signature_name: string | null
  signed_at: string | null
  created_at: string
  updated_at: string
  service: Pick<BusinessService, 'id' | 'name'> | null
  business: Pick<Business, 'id' | 'name'> | null
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
  serviceId?: string
  appointment?: {
    date: string
    time: string
  }
  outcome: 'appointment_booked' | 'qualified_lead' | 'no_action' | 'escalated'
}

// ─── API response envelope ────────────────────────────────────────────────
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
