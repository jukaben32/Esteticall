import { z } from 'zod'

export const signupSchema = z.object({
  businessName: z.string().min(2, 'Business name is too short'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const businessProfileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  timezone: z.string().default('UTC'),
})
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

export const stripeSettingsSchema = z.object({
  publishableKey: z.string().optional().or(z.literal('')),
  secretKey: z.string().optional().or(z.literal('')),
})
export type StripeSettingsInput = z.infer<typeof stripeSettingsSchema>

export const supportMessageSchema = z.object({
  body: z.string().min(1, 'Message cannot be empty'),
})
export type SupportMessageInput = z.infer<typeof supportMessageSchema>

export const supportTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})
export type SupportTicketStatusInput = z.infer<typeof supportTicketStatusSchema>

export const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  listingType: z.enum(['sale', 'rent', 'vacation_rental']),
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'commercial', 'condo', 'land', 'industrial', 'other']),
  status: z.enum(['available', 'pending', 'sold', 'rented', 'withdrawn']).default('available'),
  price: z.coerce.number().nonnegative(),
  currency: z.enum(['USD', 'DOP']).default('USD'),
  priceDisplay: z.enum(['fixed', 'negotiable', 'starting_at', 'contact']).default('fixed'),
  rentalPeriod: z.enum(['night', 'week', 'month']).optional(),
  confoturEligible: z.boolean().default(false),
  deliveryDate: z.string().optional().or(z.literal('')),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  areaSqft: z.coerce.number().int().nonnegative(),
  parkingSpaces: z.coerce.number().int().nonnegative().default(0),
  yearBuilt: z.coerce.number().int().optional(),
  addressLine: z.string().optional(),
  areaName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  visibleToAiAgent: z.boolean().default(true),
  virtualTourUrl: z.string().url().optional().or(z.literal('')),
  lotFrontageM: z.coerce.number().nonnegative().optional(),
  lotDepthM: z.coerce.number().nonnegative().optional(),
  cadastralDistrict: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
})
export type ListingInput = z.infer<typeof listingSchema>

export const preventaProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  phase: z.enum(['lanzamiento', 'en_construccion', 'entrega']).default('lanzamiento'),
  status: z.enum(['active', 'paused', 'sold_out']).default('active'),
  developerName: z.string().optional(),
  addressLine: z.string().optional(),
  areaName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  deliveryDate: z.string().optional().or(z.literal('')),
  reservationAmount: z.coerce.number().nonnegative().optional(),
  reservationCurrency: z.enum(['USD', 'DOP']).default('USD'),
  downPaymentPct: z.coerce.number().min(0).max(100).optional(),
  financingNotes: z.string().optional(),
  finishesDescription: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  promoVideoUrl: z.string().url().optional().or(z.literal('')),
  virtualTourUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  visibleToAiAgent: z.boolean().default(true),
})
export type PreventaProjectInput = z.infer<typeof preventaProjectSchema>

export const preventaUnitTypeSchema = z.object({
  name: z.string().min(1),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  areaSqft: z.coerce.number().int().nonnegative(),
  parkingSpaces: z.coerce.number().int().nonnegative().default(0),
  price: z.coerce.number().nonnegative(),
  currency: z.enum(['USD', 'DOP']).default('USD'),
  priceDisplay: z.enum(['fixed', 'negotiable', 'starting_at', 'contact']).default('starting_at'),
  notes: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})
export type PreventaUnitTypeInput = z.infer<typeof preventaUnitTypeSchema>

export const aiAgentSchema = z.object({
  name: z.string().min(2),
  specialty: z.string().min(2).default('Residential Specialist'),
  voice: z.string().default('alloy'),
  personality: z.string().default('friendly'),
  sensitivity: z.coerce.number().min(0).max(1).default(0.5),
  language: z.string().default('en'),
  greetingMessage: z.string().min(5),
  systemPrompt: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused']).default('draft'),
  serviceIds: z.array(z.string().uuid()).optional(),
})
export type AiAgentInput = z.infer<typeof aiAgentSchema>

export const appointmentSchema = z.object({
  listingId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  budget: z.coerce.number().nonnegative().optional(),
  preApprovalNumber: z.string().optional(),
  scheduledAt: z.string().datetime(),
  status: z.enum(['scheduled', 'pending_confirmation', 'completed', 'cancelled', 'no_show']).default('pending_confirmation'),
  notes: z.string().optional(),
})
export type AppointmentInput = z.infer<typeof appointmentSchema>

export const widgetSchema = z.object({
  name: z.string().min(2).max(80).default('Main Widget'),
  agentId: z.string().uuid().nullable().default(null),
  position: z.enum(['bottom-right', 'bottom-left']).default('bottom-right'),
  theme: z.enum(['light', 'dark']).default('light'),
  isEnabled: z.boolean().default(true),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#166534'),
  greetingMessage: z.string().min(5),
  allowedOrigins: z.array(z.string().url()).default([]),
})
export type WidgetInput = z.infer<typeof widgetSchema>

export const widgetUpdateSchema = widgetSchema.partial()
export type WidgetUpdateInput = z.infer<typeof widgetUpdateSchema>

export const websiteSchema = z.object({
  isPublished: z.boolean().default(false),
  headline: z.string().optional(),
  about: z.string().optional(),
  theme: z.enum(['light', 'dark']).default('light'),
  template: z.enum(['clarity', 'pulse', 'serenity']).default('clarity'),
  primaryColor: z.string().default('#166534'),
  secondaryColor: z.string().default('#16a34a'),
  font: z.enum(['inter', 'playfair', 'poppins']).default('inter'),
  aiAgentId: z.string().uuid().nullable().optional(),
  logoUrl: z.string().optional(),
  siteTitle: z.string().optional(),
  siteDescription: z.string().optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: z.string().optional(),
  ctaPrimaryText: z.string().default('Book a Viewing'),
  ctaSecondaryText: z.string().default('Call Now'),
  yearsExperience: z.coerce.number().int().nonnegative().nullable().optional(),
  clientsServed: z.coerce.number().int().nonnegative().nullable().optional(),
  satisfactionPct: z.coerce.number().int().min(0).max(100).nullable().optional(),
  aboutTitle: z.string().default('About Us'),
  aboutStory: z.string().optional(),
  aboutPhotoUrl: z.string().optional(),
  trustBadges: z.array(z.string()).default([]),
  footerTagline: z.string().optional(),
  footerCopyright: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  contactAddress: z.string().optional(),
  contactHours: z.string().optional(),
  contactMapsUrl: z.string().optional(),
  socialYoutube: z.string().optional(),
  socialFacebook: z.string().optional(),
  socialInstagram: z.string().optional(),
  socialTiktok: z.string().optional(),
  socialLinkedin: z.string().optional(),
  socialPinterest: z.string().optional(),
  socialTwitter: z.string().optional(),
})
export type WebsiteInput = z.infer<typeof websiteSchema>

export const websiteSubscriberSchema = z.object({
  businessId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().max(4000).optional(),
  source: z.string().max(80).default('website'),
})
export type WebsiteSubscriberInput = z.infer<typeof websiteSubscriberSchema>

export const websiteSlugSchema = z.object({
  slug: z
    .string()
    .min(3, 'Use at least 3 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
})
export type WebsiteSlugInput = z.infer<typeof websiteSlugSchema>

export const websiteTeamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().default(''),
  role: z.string().default(''),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})
export type WebsiteTeamMemberInput = z.infer<typeof websiteTeamMemberSchema>

export const websiteServiceSchema = z.object({
  id: z.string().uuid().optional(),
  icon: z.string().default('home'),
  name: z.string().default(''),
  description: z.string().optional(),
  duration: z.string().optional(),
  price: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
})
export type WebsiteServiceInput = z.infer<typeof websiteServiceSchema>

export const websiteTestimonialSchema = z.object({
  id: z.string().uuid().optional(),
  quote: z.string().default(''),
  authorName: z.string().default(''),
  authorRole: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  sortOrder: z.coerce.number().int().default(0),
})
export type WebsiteTestimonialInput = z.infer<typeof websiteTestimonialSchema>

export const websiteSpecialtySchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().default(''),
  sortOrder: z.coerce.number().int().default(0),
})
export type WebsiteSpecialtyInput = z.infer<typeof websiteSpecialtySchema>

export const websiteFaqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().default(''),
  answer: z.string().default(''),
  sortOrder: z.coerce.number().int().default(0),
})
export type WebsiteFaqInput = z.infer<typeof websiteFaqSchema>

export const saveWebsiteContentSchema = z.object({
  website: websiteSchema,
  services: z.array(websiteServiceSchema).default([]),
  teamMembers: z.array(websiteTeamMemberSchema).default([]),
  testimonials: z.array(websiteTestimonialSchema).default([]),
  specialties: z.array(websiteSpecialtySchema).default([]),
  faqs: z.array(websiteFaqSchema).default([]),
})
export type SaveWebsiteContentApiInput = z.infer<typeof saveWebsiteContentSchema>

export const websiteSiteUrlSchema = z.object({
  slug: z
    .string()
    .min(3, 'Use at least 3 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
})
export type WebsiteSiteUrlInput = z.infer<typeof websiteSiteUrlSchema>

// Public booking flow — the "Book" tab of the floating widget on the public
// site (no auth: any site visitor can hit this, scoped by businessId only).
export const publicBookingSchema = z.object({
  serviceId: z.string().uuid().nullable().optional(),
  listingId: z.string().uuid().nullable().optional(),
  scheduledAt: z.string().min(1, 'Pick a time'),
  clientName: z.string().min(1, 'Name is required'),
  clientEmail: z.string().email('Invalid email'),
  clientPhone: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
})
export type PublicBookingInput = z.infer<typeof publicBookingSchema>

export const supportTicketSchema = z.object({
  subject: z.string().min(3).default('Support Request'),
  body: z.string().min(3),
})
export type SupportTicketInput = z.infer<typeof supportTicketSchema>

// Client Portal — account creation is gated on already having a clients row
// (created by the AI agent or public booking flow) with a matching email;
// see /api/portal/signup.
export const portalSignupSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})
export type PortalSignupInput = z.infer<typeof portalSignupSchema>

export const portalRescheduleSchema = z.object({
  scheduledAt: z.string().min(1, 'Elige un horario'),
})
export type PortalRescheduleInput = z.infer<typeof portalRescheduleSchema>

export const portalCancelSchema = z.object({
  reason: z.string().optional(),
})
export type PortalCancelInput = z.infer<typeof portalCancelSchema>

export const portalSupportTicketSchema = z.object({
  businessId: z.string().uuid(),
  subject: z.string().min(3).default('Support Request'),
  body: z.string().min(3),
})
export type PortalSupportTicketInput = z.infer<typeof portalSupportTicketSchema>

export const availabilitySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
  slotMinutes: z.coerce.number().int().positive().default(30),
  isActive: z.boolean().default(true),
})
export type AvailabilityInput = z.infer<typeof availabilitySchema>

export const knowledgeDocumentSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  catalogKey: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})
export type KnowledgeDocumentInput = z.infer<typeof knowledgeDocumentSchema>

export const platformKnowledgeDocumentSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
})
export type PlatformKnowledgeDocumentInput = z.infer<typeof platformKnowledgeDocumentSchema>

// ─── Channels (Airbnb/Booking/VRBO real, via channel-manager co-hosting) ──
export const channelProviderAccountSchema = z.object({
  accountId: z.string().min(1, 'El Account ID de Hostaway es requerido'),
  clientSecret: z.string().min(1, 'El Client Secret es requerido'),
  webhookSecret: z.string().optional().or(z.literal('')),
})
export type ChannelProviderAccountInput = z.infer<typeof channelProviderAccountSchema>

export const channelHostConnectionSchema = z.object({
  ownerName: z.string().min(2, 'El nombre del propietario es requerido'),
  ownerPhone: z.string().optional().or(z.literal('')),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  channel: z.enum(['airbnb', 'booking', 'vrbo']),
  commissionPct: z.coerce.number().min(0).max(100).default(18),
  clientId: z.string().uuid().optional().or(z.literal('')),
})
export type ChannelHostConnectionInput = z.infer<typeof channelHostConnectionSchema>

// Only fields a business owner should ever be able to PATCH directly —
// status is deliberately limited to the two manual transitions (pause /
// resume); 'error' and 'pending' are only ever system-set by the sync layer.
export const channelHostConnectionPatchSchema = z.object({
  ownerName: z.string().min(2).optional(),
  ownerPhone: z.string().optional().or(z.literal('')),
  ownerEmail: z.string().email().optional().or(z.literal('')),
  commissionPct: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['active', 'disabled']).optional(),
})
export type ChannelHostConnectionPatchInput = z.infer<typeof channelHostConnectionPatchSchema>

export const channelListingLinkSchema = z.object({
  listingId: z.string().uuid(),
  hostConnectionId: z.string().uuid(),
  overridePrice: z.boolean().default(false),
  nightlyPrice: z.coerce.number().nonnegative().optional(),
  currency: z.enum(['USD', 'DOP']).optional(),
})
export type ChannelListingLinkInput = z.infer<typeof channelListingLinkSchema>

export const channelListingPatchSchema = z.object({
  overridePrice: z.boolean().optional(),
  nightlyPrice: z.coerce.number().nonnegative().optional(),
  currency: z.enum(['USD', 'DOP']).optional(),
})
export type ChannelListingPatchInput = z.infer<typeof channelListingPatchSchema>

export const channelBookingPatchSchema = z.object({
  commissionStatus: z.enum(['pending', 'invoiced', 'paid']),
})
export type ChannelBookingPatchInput = z.infer<typeof channelBookingPatchSchema>

export const bookingAffiliateSettingsSchema = z.object({
  affiliateId: z.string().optional().or(z.literal('')),
  isEnabled: z.boolean().default(false),
})
export type BookingAffiliateSettingsInput = z.infer<typeof bookingAffiliateSettingsSchema>

export const businessServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  priceType: z.enum(['fixed', 'starting_at', 'price_range', 'call_for_price']).default('fixed'),
  durationMinutes: z.coerce.number().int().positive().default(60),
  catalogKey: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})
export type BusinessServiceInput = z.infer<typeof businessServiceSchema>
