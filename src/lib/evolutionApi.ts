// Thin REST client for Evolution API v2 (self-hosted WhatsApp gateway,
// https://github.com/EvolutionAPI/evolution-api). Endpoint shapes below were
// verified against the official docs and community examples as of Aug 2026 —
// Evolution API has changed its contract between major versions before, so
// re-check https://doc.evolution-api.com/v2 if a call starts failing after
// upgrading the server.
//
// Two kinds of credentials, never mixed:
// - EVOLUTION_API_KEY (global admin key, env var): create/delete instances.
// - instance_token (per-instance, returned when the instance is created,
//   stored on whatsapp_connections): everything scoped to that instance —
//   QR code, connection state, webhook, sending messages.

export class EvolutionApiNotConfiguredError extends Error {
  constructor() {
    super(
      'Evolution API no está configurada todavía. Agrega EVOLUTION_API_URL y EVOLUTION_API_KEY ' +
        '(las credenciales de tu servidor/VPS de Evolution API) para activar WhatsApp.'
    )
    this.name = 'EvolutionApiNotConfiguredError'
  }
}

function baseUrl(): string {
  const url = process.env.EVOLUTION_API_URL
  if (!url) throw new EvolutionApiNotConfiguredError()
  return url.replace(/\/$/, '')
}

function globalApiKey(): string {
  const key = process.env.EVOLUTION_API_KEY
  if (!key) throw new EvolutionApiNotConfiguredError()
  return key
}

async function evolutionFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', apikey: apiKey, ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Evolution API ${path} -> ${res.status}: ${detail.slice(0, 300)}`)
  }
  return res.json()
}

export async function evolutionCreateInstance(
  instanceName: string
): Promise<{ instanceToken: string | null }> {
  const data = await evolutionFetch('/instance/create', globalApiKey(), {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    }),
  })
  // v2 returns the instance token as `hash` (sometimes nested under `hash.apikey`
  // depending on version) — read both shapes defensively.
  const instanceToken: string | null =
    typeof data?.hash === 'string' ? data.hash : (data?.hash?.apikey ?? null)
  return { instanceToken }
}

export async function evolutionGetQrCode(instanceName: string, instanceToken: string): Promise<string | null> {
  const data = await evolutionFetch(`/instance/connect/${instanceName}`, instanceToken, { method: 'GET' })
  return data?.qrcode?.base64 ?? data?.base64 ?? null
}

export async function evolutionGetConnectionState(
  instanceName: string,
  instanceToken: string
): Promise<'open' | 'close' | 'connecting'> {
  const data = await evolutionFetch(`/instance/connectionState/${instanceName}`, instanceToken, {
    method: 'GET',
  })
  return data?.instance?.state ?? 'close'
}

export async function evolutionSetWebhook(
  instanceName: string,
  instanceToken: string,
  webhookUrl: string
): Promise<void> {
  await evolutionFetch(`/webhook/set/${instanceName}`, instanceToken, {
    method: 'POST',
    body: JSON.stringify({
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    }),
  })
}

export async function evolutionSendText(instanceName: string, instanceToken: string, number: string, text: string): Promise<void> {
  await evolutionFetch(`/message/sendText/${instanceName}`, instanceToken, {
    method: 'POST',
    body: JSON.stringify({ number, text }),
  })
}

export async function evolutionDeleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/logout/${instanceName}`, globalApiKey(), { method: 'DELETE' }).catch(() => {
    // Logout can 404 if the instance was never connected — deletion below is what matters.
  })
  await evolutionFetch(`/instance/delete/${instanceName}`, globalApiKey(), { method: 'DELETE' })
}
