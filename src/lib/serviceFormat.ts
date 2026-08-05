export type ServicePriceType = 'fixed' | 'starting_at' | 'price_range' | 'call_for_price'

// Matches the reference template's "Price Type" dropdown, in the same order.
export const SERVICE_PRICE_TYPE_OPTIONS: { value: ServicePriceType; label: string }[] = [
  { value: 'fixed', label: 'Precio fijo' },
  { value: 'price_range', label: 'Rango de precio' },
  { value: 'starting_at', label: 'Desde' },
  { value: 'call_for_price', label: 'Consultar precio' },
]

export function servicePriceTypeLabel(priceType: string | null | undefined): string {
  return SERVICE_PRICE_TYPE_OPTIONS.find((o) => o.value === priceType)?.label ?? 'Precio fijo'
}

/** Human-readable price for a service row, e.g. "$100", "Desde $100", "$100 - $200", "Consultar precio". */
export function formatServicePrice(service: {
  price: number | null
  price_max?: number | null
  price_type: string | null
}): string {
  if (service.price_type === 'call_for_price') return 'Consultar precio'
  if (service.price == null) return 'Consultar precio'

  const price = `$${service.price.toLocaleString()}`

  if (service.price_type === 'price_range') {
    return service.price_max != null ? `${price} - $${service.price_max.toLocaleString()}` : price
  }
  if (service.price_type === 'starting_at') return `Desde ${price}`
  return price
}
