// Cliente HTTP para la API de Hostaway (channel manager certificado por
// Airbnb/Booking/VRBO — ver docs.hostaway.com). No existe una "API de
// Airbnb" directa: Airbnb solo da acceso a partners certificados como
// Hostaway, así que este cliente es el único camino real hacia Airbnb.
//
// Autenticación real (OAuth2 Client Credentials, NO un API key estático):
//   POST /v1/accessTokens  { grant_type: 'client_credentials', client_id: <Account ID>, client_secret: <API Key> }
// El access_token resultante dura ~24 meses y se manda como Bearer token.
//
// Nota: los nombres exactos de los campos de /listings y /reservations
// (arrivalDate, guestName, totalPrice, etc.) están tomados de la
// documentación pública de Hostaway, pero deben confirmarse contra una
// cuenta real antes de ir a producción — src/services/channelSync.ts lee
// estos campos de forma defensiva por esa razón.

const HOSTAWAY_BASE_URL = 'https://api.hostaway.com/v1'

interface HostawayEnvelope<T> {
  status: 'success' | 'error' | 'fail'
  result: T
}

export interface HostawayListingPayload {
  name: string
  price: number
  currencyCode: string
  personCapacity: number
  bedroomsNumber: number
  bathroomsNumber: number
  address?: string
  city?: string
  countryCode?: string
  lat?: number
  lng?: number
  description?: string
  listingImages?: { url: string }[]
}

export interface HostawayListing {
  id: number
  name: string
  price: number
  currencyCode: string
  status: string
}

export interface HostawayBooking {
  id: number
  reservationId?: string
  listingMapId: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  arrivalDate: string
  departureDate: string
  nights?: number
  totalPrice?: number
  currency?: string
  status?: string
}

export class HostawayClient {
  private accountId: string
  private clientSecret: string
  private accessToken: string | null = null

  constructor(credentials: { accountId: string; clientSecret: string }) {
    this.accountId = credentials.accountId
    this.clientSecret = credentials.clientSecret
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const res = await fetch(`${HOSTAWAY_BASE_URL}/accessTokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-control': 'no-cache',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.accountId,
        client_secret: this.clientSecret,
        scope: 'general',
      }),
    })

    if (!res.ok) {
      throw new Error(`No se pudo autenticar con Hostaway (HTTP ${res.status}) — revisa el Account ID y el Client Secret`)
    }

    const data = await res.json().catch(() => null)
    if (!data?.access_token) {
      throw new Error('Hostaway no devolvió un access_token válido')
    }

    this.accessToken = data.access_token as string
    return this.accessToken
  }

  private async request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken()
    const res = await fetch(`${HOSTAWAY_BASE_URL}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = (await res.json().catch(() => null)) as HostawayEnvelope<T> | null
    if (!res.ok || !data || data.status === 'error' || data.status === 'fail') {
      throw new Error(`Hostaway API error (HTTP ${res.status}): ${JSON.stringify(data)}`)
    }
    return data.result
  }

  // Usado solo para validar que las credenciales funcionan al conectar la
  // cuenta — no hace falta ningún dato del resultado, basta con no lanzar.
  async verifyCredentials(): Promise<void> {
    await this.getAccessToken()
  }

  async createListing(data: HostawayListingPayload) {
    return this.request<{ id: number }>('POST', '/listings', data)
  }

  async updateListing(externalListingId: number, data: Partial<HostawayListingPayload>) {
    return this.request<void>('PUT', `/listings/${externalListingId}`, data)
  }

  async getListing(externalListingId: number) {
    return this.request<HostawayListing>('GET', `/listings/${externalListingId}`)
  }

  async getBookings(params: { listingId?: number } = {}) {
    const query = params.listingId ? `?listingMapId=${params.listingId}` : ''
    return this.request<HostawayBooking[]>('GET', `/reservations${query}`)
  }
}
