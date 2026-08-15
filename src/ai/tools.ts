import type {
  AiAgent,
  Business,
  KnowledgeDocument,
  Listing,
  PlatformKnowledgeDocument,
  PreventaProjectWithDetails,
  RealtimeTool,
} from '@/types'
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
    name: 'search_presale_projects',
    description:
      "Search this business's pre-sale/pre-construction projects (\"proyectos en preventa\") — buildings or " +
      'developments not yet delivered, sold by unit type (e.g. multiple floorplans in one project) rather than as ' +
      'single finished units. Use this whenever the caller asks about pre-sale, pre-construction, projects still ' +
      'being built, or reserving/separating a unit before it is finished.',
    parameters: {
      type: 'object',
      properties: {
        maxPrice: { type: 'number', description: 'Filter by the starting price of any unit type in the project' },
        minBedrooms: { type: 'number' },
        city: { type: 'string' },
        phase: { type: 'string', enum: ['lanzamiento', 'en_construccion', 'entrega', 'any'] },
      },
    },
  },
  {
    type: 'function',
    name: 'get_presale_project_details',
    description:
      'Get full details for one pre-sale project by its project code — unit types with prices, reservation amount, ' +
      'down payment %, financing notes, finishes, amenities, and delivery date.',
    parameters: {
      type: 'object',
      properties: { projectCode: { type: 'string' } },
      required: ['projectCode'],
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
  assignedListingIds?: Set<string>
  preventaProjects?: PreventaProjectWithDetails[]
  assignedPreventaProjectIds?: Set<string>
  knowledgeDocs?: KnowledgeDocument[]
  platformKnowledgeDocs?: PlatformKnowledgeDocument[]
  channel?: 'voice' | 'text'
}): string {
  const {
    business,
    agent,
    listings,
    assignedListingIds,
    preventaProjects = [],
    assignedPreventaProjectIds,
    knowledgeDocs = [],
    platformKnowledgeDocs = [],
    channel = 'voice',
  } = opts
  const knowledgeText = formatKnowledgeForPrompt(knowledgeDocs)
  const platformKnowledgeText = formatKnowledgeForPrompt(platformKnowledgeDocs)
  const mediumInstruction =
    channel === 'voice'
      ? 'Keep responses short and conversational — this is a phone call, not a chat.'
      : 'Keep responses short — this is a WhatsApp chat. Use plain text (no markdown), short paragraphs, ' +
        'and at most one relevant emoji per message, only when it fits naturally.'

  function summarizeListing(l: Listing): string {
    const specs = isLandListing(l) ? `${l.area_sqft}sqft lot` : `${l.bedrooms}bd/${l.bathrooms}ba, ${l.area_sqft}sqft`
    return (
      `- ${l.listing_code}: ${l.title} — ${l.property_type} (${l.listing_type}), ${specs}, ` +
      `${formatListingPrice(l)}${listingPriceSuffix(l)}, ` +
      `${l.city ?? l.area_name ?? 'location on file'}` +
      (l.confotur_eligible ? ' · CONFOTUR-eligible (Ley 158-01 tax exemption)' : '') +
      (l.delivery_date ? ` · delivery ${formatDeliveryDate(l.delivery_date)}` : '')
    )
  }

  // assignedListingIds is a ranking hint, never an access filter — every
  // listing here is something this agent CAN and MUST discuss if asked.
  // Splitting into "your specialty" vs "also available" lets the agent lead
  // with its portfolio while browsing, without ever having a real inquiry
  // hit a listing it's not allowed to acknowledge.
  const hasSplit = !!assignedListingIds?.size && listings.some((l) => assignedListingIds.has(l.id))
  const primary = hasSplit ? listings.filter((l) => assignedListingIds!.has(l.id)) : listings
  const secondary = hasSplit ? listings.filter((l) => !assignedListingIds!.has(l.id)) : []

  const listingSummaries = !listings.length
    ? 'No listings are currently marked visible to AI agents.'
    : hasSplit
      ? [
          'Your specialty listings — lead with these when the caller is browsing without a specific property in mind:',
          primary.map(summarizeListing).join('\n'),
          secondary.length
            ? [
                '',
                "Other listings at this business — not your specialty, but still real inventory. If the caller asks about",
                'one of these by name, code, or description, answer fully and help them book it exactly like your own —',
                'never say you don\'t have it or don\'t know about it. You may mention a colleague specializes in it, but',
                'only after helping, never instead of helping:',
                secondary.map(summarizeListing).join('\n'),
              ].join('\n')
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : listings.map(summarizeListing).join('\n')

  function summarizeProject(p: PreventaProjectWithDetails): string {
    const unitSummary = p.unitTypes.length
      ? p.unitTypes
          .map(
            (u) =>
              `${u.name} (${u.bedrooms}bd/${u.bathrooms}ba, ${u.area_sqft}sqft) from ${u.currency} ${u.price.toLocaleString()}`
          )
          .join('; ')
      : 'unit types not yet listed'
    return (
      `- ${p.project_code}: ${p.name} — ${p.phase}, ${p.city ?? p.area_name ?? 'location on file'}, ` +
      `units: ${unitSummary}` +
      (p.reservation_amount
        ? ` · reservation ${p.reservation_currency} ${p.reservation_amount.toLocaleString()}`
        : '') +
      (p.delivery_date ? ` · delivery ${formatDeliveryDate(p.delivery_date)}` : '')
    )
  }

  const hasProjectSplit =
    !!assignedPreventaProjectIds?.size && preventaProjects.some((p) => assignedPreventaProjectIds.has(p.id))
  const primaryProjects = hasProjectSplit
    ? preventaProjects.filter((p) => assignedPreventaProjectIds!.has(p.id))
    : preventaProjects
  const secondaryProjects = hasProjectSplit ? preventaProjects.filter((p) => !assignedPreventaProjectIds!.has(p.id)) : []

  const projectSummaries = !preventaProjects.length
    ? ''
    : hasProjectSplit
      ? [
          'Your specialty pre-sale projects — lead with these when the caller is browsing without a specific project in mind:',
          primaryProjects.map(summarizeProject).join('\n'),
          secondaryProjects.length
            ? [
                '',
                'Other pre-sale projects at this business — not your specialty, but still real inventory. Answer fully',
                "if asked by name or code, never say you don't have it:",
                secondaryProjects.map(summarizeProject).join('\n'),
              ].join('\n')
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : preventaProjects.map(summarizeProject).join('\n')

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
    projectSummaries
      ? [
          'You can also discuss the following pre-sale/pre-construction projects (use search_presale_projects / ' +
            'get_presale_project_details for specifics instead of guessing). A project sells multiple unit types at ' +
            'different prices — always confirm which unit type the caller means before quoting a price or booking:',
          projectSummaries,
          '',
        ].join('\n')
      : '',
    'When the caller wants to see a property, use check_availability to find a real open slot before proposing a time,',
    'then confirm their name and phone number before calling book_viewing. If they are not ready to book, still call',
    'capture_lead once you have their name and phone number so the business can follow up.',
    'If the caller asks to speak with a human, or has a request you cannot handle, call request_callback with their',
    'name and phone number instead of guessing or leaving the conversation unresolved.',
    'If the caller asks about return on investment, rental income, or cap rate for a vacation_rental listing, call',
    'calculate_roi instead of doing that math yourself — state the occupancy/expenses assumptions it returns so the',
    "caller knows those are estimates, not the property's actual performance.",
    'Never invent listing, project, or unit-type details, prices, or availability that the tools did not return. And',
    'never refuse to discuss or claim ignorance of a property or pre-sale project that is actually listed above, in',
    'any section — a caller with a specific question about a real listing or project is a sale in progress, and',
    'losing it to a scripted "I don\'t have that information" is the one mistake this business cannot afford.',
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
