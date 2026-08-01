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
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  phone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  timezone: z.string().default('UTC'),
})
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

export const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  listingType: z.enum(['sale', 'rent']),
  propertyType: z.enum(['house', 'apartment', 'townhouse', 'commercial', 'condo', 'land']),
  status: z.enum(['available', 'pending', 'sold', 'rented', 'withdrawn']).default('available'),
  price: z.coerce.number().nonnegative(),
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  areaSqft: z.coerce.number().int().nonnegative(),
  parkingSpaces: z.coerce.number().int().nonnegative().default(0),
  yearBuilt: z.coerce.number().int().optional(),
  addressLine: z.string().optional(),
  areaName: z.string().optional(),
  city: z.string().optional(),
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
  greetingMessage: z.string().min(5),
  systemPrompt: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused']).default('draft'),
})
export type AiAgentInput = z.infer<typeof aiAgentSchema>

export const appointmentSchema = z.object({
  listingId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})
export type AppointmentInput = z.infer<typeof appointmentSchema>

export const widgetSchema = z.object({
  isEnabled: z.boolean().default(true),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#2563eb'),
  greetingMessage: z.string().min(5),
  allowedOrigins: z.array(z.string().url()).default([]),
})
export type WidgetInput = z.infer<typeof widgetSchema>

export const websiteSchema = z.object({
  isPublished: z.boolean().default(false),
  headline: z.string().optional(),
  about: z.string().optional(),
  theme: z.enum(['light', 'dark']).default('light'),
})
export type WebsiteInput = z.infer<typeof websiteSchema>

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
})
export type KnowledgeDocumentInput = z.infer<typeof knowledgeDocumentSchema>

export const businessServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})
export type BusinessServiceInput = z.infer<typeof businessServiceSchema>
