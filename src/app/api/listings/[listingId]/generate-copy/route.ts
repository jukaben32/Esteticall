import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBusinessForOwner } from '@/services/businesses'
import { chatCompletionCostUsd, logAiUsage } from '@/services/aiUsage'

async function requireBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }
  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return { error: 'No business for this user' as const }
  return { business }
}

const PROPERTY_TYPE_ES: Record<string, string> = {
  house: 'casa',
  apartment: 'apartamento',
  townhouse: 'townhouse',
  commercial: 'local comercial',
  condo: 'condominio',
  land: 'solar',
  industrial: 'nave industrial',
  other: 'propiedad',
}

const LISTING_TYPE_ES: Record<string, string> = {
  sale: 'en venta',
  rent: 'en alquiler',
  vacation_rental: 'renta vacacional',
}

// Internal dashboard tool ("Generar con IA" button in NewListingForm /
// EditListingModal), not a conversational agent — a single Chat Completions
// call, no tools, no conversation state. Takes whatever the user has typed
// into the form so far (title, type, specs, amenities…) rather than
// requiring the listing to be saved first, so it's useful while drafting a
// brand-new listing too.
export async function POST(request: Request, props: { params: Promise<{ listingId: string }> }) {
  const params = await props.params;
  const ctx = await requireBusiness()
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 })
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY no está configurada' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data: listing, error: listingError } = await admin
    .from('listings')
    .select('id')
    .eq('id', params.listingId)
    .eq('business_id', ctx.business.id)
    .maybeSingle()
  if (listingError) throw listingError
  if (!listing) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const facts = [
    body.title ? `Título: ${body.title}` : null,
    `Tipo: ${PROPERTY_TYPE_ES[body.propertyType] ?? body.propertyType ?? 'propiedad'} ${LISTING_TYPE_ES[body.listingType] ?? ''}`.trim(),
    body.price ? `Precio: ${body.currency ?? 'USD'} ${body.price}${body.rentalPeriod ? ` por ${body.rentalPeriod}` : ''}` : null,
    body.propertyType !== 'land' && body.bedrooms ? `${body.bedrooms} habitaciones` : null,
    body.propertyType !== 'land' && body.bathrooms ? `${body.bathrooms} baños` : null,
    body.areaSqft ? `${body.areaSqft} ${body.propertyType === 'land' ? 'm²' : 'pies²'} de área` : null,
    body.yearBuilt ? `Construida en ${body.yearBuilt}` : null,
    body.city ? `Ubicación: ${[body.areaName, body.city].filter(Boolean).join(', ')}` : null,
    body.confoturEligible ? 'Elegible para la exención fiscal CONFOTUR (Ley 158-01)' : null,
    body.deliveryDate ? `Fecha de entrega estimada: ${body.deliveryDate}` : null,
    Array.isArray(body.amenities) && body.amenities.length > 0 ? `Comodidades: ${body.amenities.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  if (!facts.trim()) {
    return NextResponse.json({ error: 'Llena al menos el tipo y el precio antes de generar la descripción' }, { status: 400 })
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'Escribes descripciones de propiedades inmobiliarias en español para el mercado dominicano. Usa un tono ' +
            'profesional y atractivo, 3-5 oraciones, un solo párrafo, sin markdown ni emojis. Usa ÚNICAMENTE los ' +
            'datos que te dan — nunca inventes comodidades, ubicaciones o cifras que no aparezcan en la lista.',
        },
        { role: 'user', content: `Datos de la propiedad:\n${facts}\n\nEscribe la descripción.` },
      ],
    }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    return NextResponse.json({ error: errBody.error?.message ?? 'No se pudo generar la descripción' }, { status: 502 })
  }

  const data = await res.json()
  const description = data.choices?.[0]?.message?.content?.trim()

  const inputTokens = data?.usage?.prompt_tokens ?? 0
  const outputTokens = data?.usage?.completion_tokens ?? 0
  await logAiUsage(admin, {
    businessId: ctx.business.id,
    kind: 'chat_completion',
    inputTokens,
    outputTokens,
    costUsd: chatCompletionCostUsd(inputTokens, outputTokens, 'gpt-4o-mini'),
  })

  if (!description) return NextResponse.json({ error: 'No se pudo generar la descripción' }, { status: 502 })

  return NextResponse.json({ description })
}
