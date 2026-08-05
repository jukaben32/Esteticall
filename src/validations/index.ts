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
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'commercial', 'condo', 'land']),
  status: z.enum(['available', 'pending', 'sold', 'rented', 'withdrawn']).default('available'),
  price: z.coerce.number().nonnegative(),
  priceDisplay: z.enum(['fixed', 'negotiable', 'starting_at', 'contact']).default('fixed'),
  rentalPeriod: z.enum(['night', 'week', 'month']).optional(),
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
})
export type ListingInput = z.infer<typeof listingSchema>

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
  featuredServiceIds: z.array(z.string().uuid()).default([]),
  footerTagline: z.string().optional(),
  footerCopyright: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  contactAddress: z.string().optional(),
  contactHours: z.string().optional(),
  contactMapsUrl: z.string().optional(),
})
export type WebsiteInput = z.infer<typeof websiteSchema>

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
})
export type KnowledgeDocumentInput = z.infer<typeof knowledgeDocumentSchema>

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
