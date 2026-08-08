import type { Listing } from '@/types'

const RENTAL_PERIOD_SUFFIX: Record<string, string> = {
  night: '/noche',
  week: '/semana',
  month: '/mes',
}

const CURRENCY_PREFIX: Record<string, string> = { USD: '$', DOP: 'RD$' }

// Most RD inventory is quoted in USD, but not all — every price display in
// the app should go through this instead of hardcoding "$" so a DOP-priced
// listing doesn't silently read as USD.
export function formatListingPrice(listing: Pick<Listing, 'price' | 'currency'>): string {
  return `${CURRENCY_PREFIX[listing.currency] ?? '$'}${listing.price.toLocaleString()}`
}

export function listingPriceSuffix(listing: Pick<Listing, 'listing_type' | 'rental_period'>): string {
  if (listing.listing_type === 'rent') return '/mes'
  if (listing.listing_type === 'vacation_rental') {
    return listing.rental_period ? RENTAL_PERIOD_SUFFIX[listing.rental_period] ?? '' : ''
  }
  return ''
}

export function isLandListing(listing: Pick<Listing, 'property_type'>): boolean {
  return listing.property_type === 'land'
}

const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Parses the "YYYY-MM-DD" date string directly instead of going through
// Date + toLocaleDateString(locale) — that combination depends on the
// runtime's ICU data, which differs between Node (server render) and the
// browser (hydration) for some locales, causing a hydration mismatch (same
// class of bug already fixed for time formatting in lib/formatDate.ts).
export function formatDeliveryDate(dateKey: string): string {
  const [year, month] = dateKey.split('-')
  const monthName = SPANISH_MONTHS[Number(month) - 1]
  return monthName ? `${monthName} ${year}` : dateKey
}
