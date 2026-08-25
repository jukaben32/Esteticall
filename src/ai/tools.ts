import type { AiAgent, Business, BusinessService, KnowledgeDocument, Package, PlatformKnowledgeDocument, RealtimeTool } from '@/types'
import { formatServicePrice } from '@/lib/serviceFormat'
import { formatKnowledgeForPrompt } from '@/services/knowledge'

// Tool definitions handed to the OpenAI Realtime session. Execution happens
// server-side in POST /api/ai/tools — the browser only ever holds an
// ephemeral client secret, never the service-role key, so every tool call
// the model makes is relayed there instead of hitting Supabase directly.
export const REALTIME_TOOLS: RealtimeTool[] = [
  {
    type: 'function',
    name: 'search_treatments',
    description:
      "Search this business's treatment/service catalog by name or maximum price. Use this whenever the caller " +
      'asks what treatments are offered, how much something costs, or is browsing without a specific treatment in mind.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text match against treatment name/description, optional' },
        maxPrice: { type: 'number' },
      },
    },
  },
  {
    type: 'function',
    name: 'get_treatment_details',
    description: 'Get full details (price, duration, whether it requires signed consent) for one treatment by name.',
    parameters: {
      type: 'object',
      properties: { treatmentName: { type: 'string' } },
      required: ['treatmentName'],
    },
  },
  {
    type: 'function',
    name: 'recommend_package',
    description:
      'Search this business\'s prepaid session packages/memberships (e.g. "6 sesiones de láser facial"), optionally ' +
      'for a specific treatment. Use this when the caller asks about packages, memberships, bundles, or a discount ' +
      'for booking multiple sessions.',
    parameters: {
      type: 'object',
      properties: { treatmentName: { type: 'string', description: 'Filter to packages built around this treatment, optional' } },
    },
  },
  {
    type: 'function',
    name: 'check_availability',
    description: 'Check the next available appointment slots for this business, optionally near a preferred date.',
    parameters: {
      type: 'object',
      properties: { preferredDate: { type: 'string', description: 'ISO date, optional' } },
    },
  },
  {
    type: 'function',
    name: 'book_appointment',
    description:
      'Book an appointment once the caller has picked a slot returned by check_availability, and you have their ' +
      'name and phone number. For a treatment that requires consent or carries contraindication risk (botox, ' +
      'láser, peelings, and anything the caller mentions a health condition, pregnancy, allergy, or medication ' +
      'around), first ask about pregnancy/breastfeeding, known allergies, and current medications, then pass what ' +
      'they said as healthScreeningNotes and set needsReview to true if anything they said could be a ' +
      'contraindication — the appointment is still booked, just held for staff confirmation instead of auto-confirmed.',
    parameters: {
      type: 'object',
      properties: {
        treatmentName: { type: 'string' },
        datetime: { type: 'string', description: 'ISO 8601 datetime, must be a slot from check_availability' },
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
        healthScreeningNotes: {
          type: 'string',
          description: "Summary of the caller's own words about pregnancy/allergies/medications, if asked",
        },
        needsReview: {
          type: 'boolean',
          description: 'True if the health screening surfaced anything staff should confirm before the treatment',
        },
      },
      required: ['datetime', 'clientName', 'clientPhone'],
    },
  },
  {
    type: 'function',
    name: 'capture_lead',
    description:
      'Save the caller as a lead once you have their name and phone number — even if they do not book an appointment.',
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
      },
      required: ['clientName', 'clientPhone'],
    },
  },
  {
    type: 'function',
    name: 'request_callback',
    description:
      'Use this when the caller asks to be called back by a human instead of continuing with you — e.g. they want ' +
      'to speak to a person, ask a clinical question you cannot answer, or have a booking issue you cannot resolve. ' +
      'Requires their name and phone number. This notifies the business immediately; it does not book an appointment.',
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: 'string' },
        clientPhone: { type: 'string' },
        reason: { type: 'string', description: "Brief reason for the callback, in the caller's own words" },
        preferredTime: { type: 'string', description: 'When they would like to be called back, if mentioned' },
      },
      required: ['clientName', 'clientPhone'],
    },
  },
]

export function buildSystemPrompt(opts: {
  business: Business
  agent: AiAgent
  services: BusinessService[]
  assignedServiceIds?: Set<string>
  packages?: Package[]
  knowledgeDocs?: KnowledgeDocument[]
  platformKnowledgeDocs?: PlatformKnowledgeDocument[]
  channel?: 'voice' | 'text'
}): string {
  const {
    business,
    agent,
    services,
    assignedServiceIds,
    packages = [],
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

  function summarizeService(s: BusinessService): string {
    return (
      `- ${s.name}: ${formatServicePrice(s)}, ${s.duration_minutes} min` +
      (s.requires_consent ? ' · requiere consentimiento informado firmado' : '') +
      (s.description ? ` — ${s.description}` : '')
    )
  }

  // assignedServiceIds is a ranking hint, never an access filter — every
  // service here is something this agent CAN and MUST discuss if asked.
  // Splitting into "your specialty" vs "also available" lets the agent lead
  // with its own treatments while browsing, without ever having a real
  // inquiry hit a treatment it's not allowed to acknowledge.
  const hasSplit = !!assignedServiceIds?.size && services.some((s) => assignedServiceIds.has(s.id))
  const primary = hasSplit ? services.filter((s) => assignedServiceIds!.has(s.id)) : services
  const secondary = hasSplit ? services.filter((s) => !assignedServiceIds!.has(s.id)) : []

  const serviceSummaries = !services.length
    ? 'No treatments are currently active in the catalog.'
    : hasSplit
      ? [
          'Your specialty treatments — lead with these when the caller is browsing without something specific in mind:',
          primary.map(summarizeService).join('\n'),
          secondary.length
            ? [
                '',
                "Other treatments at this business — not your specialty, but still real offerings. If the caller asks",
                'about one of these by name, answer fully and help them book it exactly like your own — never say you',
                "don't have it or don't know about it:",
                secondary.map(summarizeService).join('\n'),
              ].join('\n')
            : '',
        ]
          .filter(Boolean)
          .join('\n')
      : services.map(summarizeService).join('\n')

  function summarizePackage(p: Package): string {
    return `- ${p.name}: ${p.session_count} sesiones por $${p.price.toLocaleString()}`
  }

  return [
    `You are ${agent.name}, the ${agent.specialty} for ${business.name}, a medical/aesthetic spa.`,
    `Personality: ${agent.personality}. ${mediumInstruction}`,
    agent.greeting_message ? `Open the conversation with: "${agent.greeting_message}"` : '',
    '',
    'You can discuss the following treatments (use search_treatments / get_treatment_details for specifics instead of guessing):',
    serviceSummaries,
    '',
    packages.length
      ? ['Available session packages/memberships (use recommend_package for specifics):', packages.map(summarizePackage).join('\n'), ''].join(
          '\n'
        )
      : '',
    'When the caller wants to book, use check_availability to find a real open slot before proposing a time, then',
    'confirm their name and phone number before calling book_appointment. For any treatment that requires consent or',
    'carries a contraindication risk, ask about pregnancy/breastfeeding, allergies, and current medications first —',
    'pass what they say as healthScreeningNotes and set needsReview when anything they mention could be a',
    'contraindication. Never diagnose or give clinical advice yourself; a flagged appointment is confirmed by staff',
    'before the visit, not by you.',
    'If they are not ready to book, still call capture_lead once you have their name and phone number so the',
    'business can follow up.',
    'If the caller asks to speak with a human, has a clinical question you cannot safely answer, or a request you',
    'cannot handle, call request_callback with their name and phone number instead of guessing.',
    'Never invent treatment details, prices, or availability that the tools did not return. And never refuse to',
    'discuss or claim ignorance of a treatment that is actually listed above, in any section — a caller with a',
    "specific question about a real treatment is a booking in progress, and losing it to a scripted \"I don't have",
    'that information" is the one mistake this business cannot afford.',
    platformKnowledgeText
      ? [
          '',
          'General market knowledge (applies to every business on this platform — laws, regulations, and processes',
          'for this market, not specific to this business):',
          platformKnowledgeText,
        ].join('\n')
      : '',
    knowledgeText
      ? ['', 'Business knowledge base (policies, process notes specific to this business):', knowledgeText].join('\n')
      : '',
    platformKnowledgeText || knowledgeText
      ? [
          '',
          'Only state legal, regulatory, or clinical facts (aftercare, contraindications, policies) that appear',
          'verbatim in the sections above. If the caller asks something clinical that is not covered there, say you',
          'are not sure and offer request_callback instead of guessing.',
        ].join('\n')
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}
