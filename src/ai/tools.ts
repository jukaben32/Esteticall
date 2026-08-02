import type { AiAgent, Business, Listing, RealtimeTool } from '@/types'
import { listingPriceSuffix, isLandListing } from '@/lib/listingFormat'

// Tool definitions handed to the OpenAI Realtime session. Execution happens
// server-side in POST /api/ai/tools — the browser only ever holds an
// ephemeral client secret, never the service-role key, so every tool call
// the model makes is relayed there instead of hitting Supabase directly.
export const REALTIME_TOOLS: RealtimeTool[] = [
  {
    type: 'function',
    name: 'search_listings',
    description:
      'Search this business\'s available property listings by type, price range, bedrooms, or city. ' +
      'listingType "vacation_rental" covers short-term/Airbnb-style stays (priced per night, week, or month) ' +
      'in tourist areas. Use this whenever the caller asks about properties, land/lots, or vacation stays.',
    parameters: {
      type: 'object',
      properties: {
        listingType: { type: 'string', enum: ['sale', 'rent', 'vacation_rental', 'any'] },
        maxPrice: { type: 'number' },
        minBedrooms: { type: 'number' },
        city: { type: 'string' },
      },
    },
  },
  {
    type: 'function',
    name: 'get_listing_details',
    description: 'Get full details (amenities, description, price) for one listing by its listing code.',
    parameters: {
      type: 'object',
      properties: { listingCode: { type: 'string' } },
      required: ['listingCode'],
    },
  },
  {
    type: 'function',
    name: 'check_availability',
    description: 'Check the next available viewing slots for this business, optionally near a preferred date.',
    parameters: {
      type: 'object',
      properties: { preferredDate: { type: 'string', description: 'ISO date, optional' } },
    },
  },
  {
    type: 'function',
    name: 'book_viewing',
    description:
      'Book a property viewing appointment once the caller has picked a slot returned by check_availability, and you have their name and phone number.',
    parameters: {
      type: 'object',
      properties: {
        listingCode: { type: 'string' },
        datetime: { type: 'string', description: 'ISO 8601 datetime, must be a slot from check_availability' },
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
      },
      required: ['datetime', 'clientName', 'clientPhone'],
    },
  },
  {
    type: 'function',
    name: 'capture_lead',
    description:
      'Save the caller as a lead once you have their name, phone number, and (if mentioned) budget — even if they do not book a viewing.',
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
        budget: { type: 'number' },
      },
      required: ['clientName', 'clientPhone'],
    },
  },
]

export function buildSystemPrompt(opts: {
  business: Business
  agent: AiAgent
  listings: Listing[]
}): string {
  const { business, agent, listings } = opts

  const listingSummaries = listings.length
    ? listings
        .map((l) => {
          const specs = isLandListing(l) ? `${l.area_sqft}sqft lot` : `${l.bedrooms}bd/${l.bathrooms}ba, ${l.area_sqft}sqft`
          return (
            `- ${l.listing_code}: ${l.title} — ${l.property_type} (${l.listing_type}), ${specs}, ` +
            `$${l.price.toLocaleString()}${listingPriceSuffix(l)}, ` +
            `${l.city ?? l.area_name ?? 'location on file'}`
          )
        })
        .join('\n')
    : 'No listings are currently marked visible to AI agents.'

  return [
    `You are ${agent.name}, the ${agent.specialty} for ${business.name}, a real estate business.`,
    `Personality: ${agent.personality}. Keep responses short and conversational — this is a phone call, not a chat.`,
    agent.greeting_message ? `Open the call with: "${agent.greeting_message}"` : '',
    '',
    'You can discuss the following listings (use search_listings / get_listing_details for specifics instead of guessing):',
    listingSummaries,
    '',
    'When the caller wants to see a property, use check_availability to find a real open slot before proposing a time,',
    'then confirm their name and phone number before calling book_viewing. If they are not ready to book, still call',
    'capture_lead once you have their name and phone number so the business can follow up.',
    'Never invent listing details, prices, or availability that the tools did not return.',
  ]
    .filter(Boolean)
    .join('\n')
}
