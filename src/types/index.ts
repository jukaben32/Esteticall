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

export interface ListingWithPhotos extends Listing {
  photos: ListingPhoto[]
  agents: Pick<AiAgent, 'id' | 'name' | 'specialty' | 'status'>[]
}

// ─── Pre-sale projects ("Proyecto en Preventa") ───────────────────────────
export type PreventaProject = Tables<'preventa_projects'>
export type PreventaUnitType = Tables<'preventa_unit_types'>
export type PreventaProjectPhoto = Tables<'preventa_project_photos'>
export type PreventaProjectAgent = Tables<'preventa_project_agents'>

export interface PreventaProjectWithDetails extends PreventaProject {
  unitTypes: PreventaUnitType[]
  photos: PreventaProjectPhoto[]
  agents: Pick<AiAgent, 'id' | 'name' | 'specialty' | 'status'>[]
}

// ─── Channels (Airbnb/Booking/VRBO real, via channel-manager co-hosting) ──
export type ChannelProviderAccount = Tables<'channel_provider_accounts'>
export type ChannelHostConnection = Tables<'channel_host_connections'>
export type ChannelListing = Tables<'channel_listings'>
export type ChannelBooking = Tables<'channel_bookings'>
export type ChannelSyncLogEntry = Tables<'channel_sync_log'>
export type BookingAffiliateSettings = Tables<'booking_affiliate_settings'>

export interface ChannelHostConnectionWithStats extends ChannelHostConnection {
  listingCount: number
  activeListingCount: number
  pendingCommission: number
  paidCommission: number
}

export interface ChannelListingWithDetails extends ChannelListing {
  listing: Pick<Listing, 'id' | 'title' | 'listing_code' | 'price' | 'currency' | 'cover_photo_url' | 'listing_type' | 'rental_period'>
  hostConnection: Pick<ChannelHostConnection, 'id' | 'owner_name' | 'channel' | 'status' | 'commission_pct'>
}

export interface ChannelBookingWithDetails extends ChannelBooking {
  listing: Pick<ChannelListing, 'id' | 'listing_id'> & {
    listingTitle: string
    ownerName: string
    channel: ChannelHostConnection['channel']
  }
}

// ─── Bank transfer payments (manual plan-upgrade path) ────────────────────
export type BankTransferPayment = Tables<'bank_transfer_payments'>

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
  business: Pick<Business, 'id' | 'name' | 'phone' | 'contact_email' | 'stripe_connected'> | null
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
