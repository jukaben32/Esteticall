'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Power, QrCode, ServerCrash, ShieldCheck, Sparkles } from 'lucide-react'
import type { AiAgent, WhatsappConnection } from '@/types'

const STATUS_LABEL: Record<WhatsappConnection['status'], string> = {
  connected: 'Connected',
  connecting: 'Connecting...',
  disconnected: 'Disconnected',
}

const STATUS_BADGE: Record<WhatsappConnection['status'], string> = {
  connected: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  connecting: 'bg-amber-50 text-amber-700',
  disconnected: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
}

function InfoChip({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-white/80 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-3)]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[var(--text-1)]">{value}</div>
    </div>
  )
}

export function WhatsappManager({
  initialConnection,
  agents,
}: {
  initialConnection: WhatsappConnection | null
  agents: AiAgent[]
}) {
  const [connection, setConnection] = useState(initialConnection)
  const [agentId, setAgentId] = useState(initialConnection?.agent_id ?? agents[0]?.id ?? '')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [syncedAgentId, setSyncedAgentId] = useState(connection?.agent_id)
  if (syncedAgentId !== connection?.agent_id) {
    setSyncedAgentId(connection?.agent_id)
    if (connection?.agent_id) {
      setAgentId(connection.agent_id)
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function startPolling() {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/whatsapp')
        const body = await response.json()
        if (body.connection) {
          setConnection(body.connection)
          if (body.connection.status === 'connected') {
            setQrCode(null)
            stopPolling()
          }
        }
      } catch {
        // Keep polling. Connection state will be refreshed on the next tick.
      }
    }, 4000)
  }

  async function handleConnect() {
    if (!agentId) {
      setError('Choose which AI agent should answer WhatsApp messages.')
      return
    }

    setError(null)
    setNotConfigured(false)
    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      const body = await response.json()
      if (!response.ok) {
        if (body.notConfigured) {
          setNotConfigured(true)
        }
        setError(body.error ?? 'Could not connect WhatsApp')
        return
      }

      setConnection(body.connection)
      setQrCode(body.qrCode)
      startPolling()
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      const body = await response.json()
      if (!response.ok) {
        setError(body.error ?? 'Could not disconnect WhatsApp')
        return
      }

      setConnection(null)
      setQrCode(null)
      stopPolling()
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(patch: { agentId?: string | null; isEnabled?: boolean }) {
    setError(null)
    const response = await fetch('/api/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.error ?? 'Could not update WhatsApp connection')
      return
    }

    setConnection(body.connection)
  }

  const selectedAgent = agents.find((agent) => agent.id === (connection?.agent_id ?? agentId))

  if (notConfigured) {
    return (
      <div className="card-surface p-6 lg:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <ServerCrash className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
              WhatsApp needs Evolution API
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--text-3)]">
              WhatsApp connects through Evolution API on your own VPS. Add <code>EVOLUTION_API_URL</code> and{' '}
              <code>EVOLUTION_API_KEY</code>, then scan the QR code from this panel.
            </p>
          </div>
          <button type="button" onClick={() => setNotConfigured(false)} className="btn-primary">
            Understood
          </button>
        </div>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="card-surface overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div className="space-y-5 p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
                    WhatsApp
                  </h2>
                  <span className={`badge border-transparent ${STATUS_BADGE.disconnected}`}>Disconnected</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-3)]">
                  Connect your clinic number so the same AI assistant can answer WhatsApp messages and turn chats into
                  appointments.
                </p>
              </div>
            </div>

            {error ? <p className="text-sm text-[var(--coral)]">{error}</p> : null}

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
                AI agent that answers
              </label>
              <select value={agentId} onChange={(event) => setAgentId(event.target.value)} className="input-field w-full">
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                    {agent.status !== 'live' ? ' (not live yet)' : ''}
                  </option>
                ))}
              </select>
              {!agents.length ? (
                <p className="mt-2 text-xs text-[var(--text-3)]">
                  Create at least one live AI agent before connecting WhatsApp.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleConnect} disabled={loading || !agentId} className="btn-primary">
                <QrCode className="h-4 w-4" />
                {loading ? 'Connecting...' : 'Connect WhatsApp'}
              </button>
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--bg-raised)] p-6 lg:border-l lg:border-t-0">
            <div className="rounded-[14px] border border-[var(--border)] bg-white/70 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
                Setup flow
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-3)]">
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                    1
                  </span>
                  <p>Deploy Evolution API on your VPS and point it to this app.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                    2
                  </span>
                  <p>Choose the AI agent that will answer messages from the clinic number.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                    3
                  </span>
                  <p>Scan the QR code and WhatsApp starts feeding the same booking workflow.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-white/70 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
                Environment
              </div>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-3)]">
                <p>
                  <code>EVOLUTION_API_URL</code> and <code>EVOLUTION_API_KEY</code> are required.
                </p>
                <p>
                  <code>OPENAI_API_KEY</code> powers the WhatsApp text assistant.
                </p>
                <p>
                  WhatsApp conversations will be stored with channel <code>whatsapp</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(19,122,114,0.05),rgba(255,255,255,0))] px-6 py-5 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--teal-700)]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
                  WhatsApp
                </h2>
                <span className={`badge border-transparent ${STATUS_BADGE[connection.status]}`}>
                  {STATUS_LABEL[connection.status]}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--text-3)]">
                {connection.phone_number ??
                  (connection.status === 'connecting'
                    ? 'Scan the QR code to finish linking the number.'
                    : 'No number linked yet.')}
              </p>
            </div>
          </div>

          <button type="button" onClick={handleDisconnect} disabled={loading} className="btn-secondary">
            <Power className="h-4 w-4" />
            Disconnect
          </button>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="space-y-5 p-6 lg:p-8">
          {error ? <p className="text-sm text-[var(--coral)]">{error}</p> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
                AI agent
              </label>
              <select
                value={connection.agent_id ?? ''}
                onChange={(event) => void handleUpdate({ agentId: event.target.value || null })}
                className="input-field w-full"
              >
                <option value="">No agent assigned</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              {selectedAgent && selectedAgent.status !== 'live' ? (
                <p className="mt-2 text-xs text-amber-700">This agent is not live yet. Activate it from AI Agents.</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
                Auto reply
              </label>
              <label className="inline-flex items-center gap-3 rounded-[11px] border border-[var(--border)] bg-white/80 px-4 py-3">
                <input
                  type="checkbox"
                  checked={connection.is_enabled}
                  onChange={(event) => void handleUpdate({ isEnabled: event.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-[var(--text-1)]">Respond automatically on WhatsApp</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InfoChip label="Provider" value="Evolution API" />
            <InfoChip label="Instance" value={connection.instance_name} />
            <InfoChip label="Agent" value={selectedAgent?.name ?? 'Not assigned'} />
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-raised)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
              <ShieldCheck className="h-4 w-4 text-[var(--teal-700)]" />
              WhatsApp uses the same clinic knowledge base
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-3)]">
              Replies can search services, FAQ entries, appointments and billing flows with the same tools used by the
              voice agent.
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-[var(--bg-raised)] p-6 lg:border-l lg:border-t-0">
          {connection.status === 'connecting' && qrCode ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-white/80 p-5 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                <QrCode className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-1)]">
                Scan the QR code
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-3)]">
                Open WhatsApp on the clinic phone, go to Linked Devices, and scan this code to finish the connection.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="WhatsApp QR code"
                className="mx-auto mt-4 h-56 w-56 rounded-2xl border border-[var(--border)] bg-white p-3"
              />
            </div>
          ) : (
            <div className="rounded-[16px] border border-[var(--border)] bg-white/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
                <Sparkles className="h-4 w-4 text-[var(--teal-700)]" />
                Connection ready
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-3)]">
                WhatsApp is linked to the clinic workspace. Keep the auto reply switch on if you want the assistant to
                answer incoming messages automatically.
              </p>
              <div className="mt-5 grid gap-3">
                <InfoChip label="Status" value={STATUS_LABEL[connection.status]} />
                <InfoChip label="Number" value={connection.phone_number ?? 'Not synced yet'} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
