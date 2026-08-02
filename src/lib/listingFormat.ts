import type { Listing } from '@/types'

const RENTAL_PERIOD_SUFFIX: Record<string, string> = {
  night: '/noche',
  week: '/semana',
  month: '/mes',
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
