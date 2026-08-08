import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { WhatsappConnection } from '@/types'
import {
  evolutionCreateInstance,
  evolutionGetQrCode,
  evolutionGetConnectionState,
  evolutionSetWebhook,
  evolutionSendText,
  evolutionDeleteInstance,
} from '@/lib/evolutionApi'

type DB = SupabaseClient<Database>

export async function getWhatsappConnection(supabase: DB, businessId: string): Promise<WhatsappConnection | null> {
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle()
  if (error) throw error
  return data
}

function slugifyInstanceName(businessId: string): string {
  // Evolution API instance names are used in URL paths, so keep them
  // filesystem/URL-safe. Prefixed so instances from different apps sharing
  // the same Evolution API server are easy to tell apart.
  return `inmobiliacall-${businessId}`
}

// Creates (or re-creates) the Evolution API instance for this business, wires
// its webhook back to our /api/whatsapp/webhook/[businessId], and returns the
// QR code to scan. Safe to call again while status is 'connecting' — Evolution
// API's /instance/create is idempotent per instanceName in practice, and this
// upserts the connection row either way.
export async function connectWhatsapp(
  supabase: DB,
  businessId: string,
  agentId: string | null,
  appUrl: string
): Promise<{ connection: WhatsappConnection; qrCode: string | null }> {
  const instanceName = slugifyInstanceName(businessId)
  const { instanceToken } = await evolutionCreateInstance(instanceName)
  if (!instanceToken) throw new Error('Evolution API no devolvió un token de instancia')

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/whatsapp/webhook/${businessId}`
  await evolutionSetWebhook(instanceName, instanceToken, webhookUrl)
  const qrCode = await evolutionGetQrCode(instanceName, instanceToken)

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .upsert(
      {
        business_id: businessId,
        agent_id: agentId,
        instance_name: instanceName,
        instance_token: instanceToken,
        status: 'connecting',
        is_enabled: true,
      },
      { onConflict: 'business_id' }
    )
    .select('*')
    .single()
  if (error) throw error

  return { connection: data, qrCode }
}

// Polled by the dashboard while status is 'connecting' to detect once the
// phone has actually scanned the QR code.
export async function refreshWhatsappStatus(supabase: DB, connection: WhatsappConnection): Promise<WhatsappConnection> {
  if (!connection.instance_token) return connection
  const state = await evolutionGetConnectionState(connection.instance_name, connection.instance_token)
  const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected'
  if (status === connection.status) return connection

  const { data, error } = await supabase
    .from('whatsapp_connections')
    .update({ status })
    .eq('id', connection.id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateWhatsappConnection(
  supabase: DB,
  businessId: string,
  patch: { agentId?: string | null; isEnabled?: boolean }
): Promise<WhatsappConnection> {
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .update({
      ...(patch.agentId !== undefined ? { agent_id: patch.agentId } : {}),
      ...(patch.isEnabled !== undefined ? { is_enabled: patch.isEnabled } : {}),
    })
    .eq('business_id', businessId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function disconnectWhatsapp(supabase: DB, connection: WhatsappConnection): Promise<void> {
  await evolutionDeleteInstance(connection.instance_name)
  const { error } = await supabase.from('whatsapp_connections').delete().eq('id', connection.id)
  if (error) throw error
}

export async function sendWhatsappMessage(connection: WhatsappConnection, toNumber: string, text: string): Promise<void> {
  if (!connection.instance_token) throw new Error('WhatsApp connection has no instance token')
  await evolutionSendText(connection.instance_name, connection.instance_token, toNumber, text)
}
