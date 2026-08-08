import type { AiAgent, Business, KnowledgeDocument, Listing, PlatformKnowledgeDocument, RealtimeTool } from '@/types'
import { listingPriceSuffix, isLandListing, formatListingPrice, formatDeliveryDate } from '@/lib/listingFormat'
import { formatKnowledgeForPrompt } from '@/services/knowledge'

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
        confoturOnly: {
          type: 'boolean',
          description: 'Only return properties eligible for the CONFOTUR tax exemption (Ley 158-01)',
        },
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
    name: 'calculate_roi',
    description:
      'Calculate a deterministic return-on-investment estimate for a vacation_rental listing, given a hypothetical ' +
      'purchase price. Never estimate ROI or rental income yourself — always call this tool so the math is exact, ' +
      'and always state the occupancy/expenses assumptions it returns when you share the result.',
    parameters: {
      type: 'object',
      properties: {
        listingCode: { type: 'string' },
        purchasePrice: { type: 'number', description: 'Hypothetical purchase price the caller mentioned' },
        occupancyPct: { type: 'number', description: 'Expected occupancy 0-100, optional — defaults to a conservative estimate' },
        annualExpensesPct: {
          type: 'number',
          description: 'Expenses as % of gross rental revenue (management, maintenance, taxes), optional — defaults to a conservative estimate',
        },
      },
      required: ['listingCode', 'purchasePrice'],
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
  {
    type: 'function',
    name: 'request_callback',
    description:
      'Use this when the caller asks to be called back by a human agent instead of continuing with you — e.g. they ' +
      'want to speak to a person, have a question you cannot answer, or a viewing/booking issue you cannot resolve. ' +
      'Requires their name and phone number. This notifies the business immediately; it does not book a viewing.',
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
        reason: { type: 'string', description: 'Brief reason for the callback, in the caller\'s own words' },
        preferredTime: { type: 'string', description: 'When they would like to be called back, if mentioned' },
      },
      required: ['clientName', 'clientPhone'],
    },
  },
]

export function buildSystemPrompt(opts: {
  business: Business
  agent: AiAgent
  listings: Listing[]
  knowledgeDocs?: KnowledgeDocument[]
  platformKnowledgeDocs?: PlatformKnowledgeDocument[]
  channel?: 'voice' | 'text'
}): string {
  const { business, agent, listings, knowledgeDocs = [], platformKnowledgeDocs = [], channel = 'voice' } = opts
  const knowledgeText = formatKnowledgeForPrompt(knowledgeDocs)
  const platformKnowledgeText = formatKnowledgeForPrompt(platformKnowledgeDocs)
  const mediumInstruction =
    channel === 'voice'
      ? 'Keep responses short and conversational — this is a phone call, not a chat.'
      : 'Keep responses short — this is a WhatsApp chat. Use plain text (no markdown), short paragraphs, ' +
        'and at most one relevant emoji per message, only when it fits naturally.'

  const listingSummaries = listings.length
    ? listings
        .map((l) => {
          const specs = isLandListing(l) ? `${l.area_sqft}sqft lot` : `${l.bedrooms}bd/${l.bathrooms}ba, ${l.area_sqft}sqft`
          return (
            `- ${l.listing_code}: ${l.title} — ${l.property_type} (${l.listing_type}), ${specs}, ` +
            `${formatListingPrice(l)}${listingPriceSuffix(l)}, ` +
            `${l.city ?? l.area_name ?? 'location on file'}` +
            (l.confotur_eligible ? ' · CONFOTUR-eligible (Ley 158-01 tax exemption)' : '') +
            (l.delivery_date ? ` · delivery ${formatDeliveryDate(l.delivery_date)}` : '')
          )
        })
        .join('\n')
    : 'No listings are currently marked visible to AI agents.'

  // Santo Domingo is a fixed UTC-4 year-round (no DST since 1974), so this
  // offset trick reliably reads "today" there regardless of server timezone.
  const todayInSantoDomingo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString().slice(0, 10)

  return [
    `You are ${agent.name}, the ${agent.specialty} for ${business.name}, a real estate business.`,
    `Personality: ${agent.personality}. ${mediumInstruction}`,
    `Today's date is ${todayInSantoDomingo} (America/Santo_Domingo time). When the caller says "tomorrow", "next Friday", etc.,`,
    'convert it to a real YYYY-MM-DD date yourself before passing it as preferredDate to check_availability — never pass',
    'the relative word itself, and never guess a date without doing this math.',
    agent.greeting_message ? `Open the conversation with: "${agent.greeting_message}"` : '',
    '',
    'You can discuss the following listings (use search_listings / get_listing_details for specifics instead of guessing):',
    listingSummaries,
    '',
    'When the caller wants to see a property, use check_availability to find a real open slot before proposing a time,',
    'then confirm their name and phone number before calling book_viewing. If they are not ready to book, still call',
    'capture_lead once you have their name and phone number so the business can follow up.',
    'If the caller asks to speak with a human, or has a request you cannot handle, call request_callback with their',
    'name and phone number instead of guessing or leaving the conversation unresolved.',
    'If the caller asks about return on investment, rental income, or cap rate for a vacation_rental listing, call',
    'calculate_roi instead of doing that math yourself — state the occupancy/expenses assumptions it returns so the',
    "caller knows those are estimates, not the property's actual performance.",
    'Never invent listing details, prices, or availability that the tools did not return.',
    platformKnowledgeText
      ? [
          '',
          'General market knowledge (applies to every business on this platform — laws, taxes, ' +
            'incentives, and processes for this market, not specific to this business):',
          platformKnowledgeText,
        ].join('\n')
      : '',
    knowledgeText
      ? [
          '',
          'Business knowledge base (policies, process notes specific to this business):',
          knowledgeText,
        ].join('\n')
      : '',
    platformKnowledgeText || knowledgeText
      ? [
          '',
          'Only state legal, tax, or financial facts (e.g. exemptions, deadlines, percentages) that appear',
          'verbatim in the sections above. If the caller asks something legal/financial that is not covered',
          'there, say you are not sure and offer request_callback instead of guessing.',
        ].join('\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}
