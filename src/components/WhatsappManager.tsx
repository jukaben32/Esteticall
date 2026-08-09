'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Power, QrCode, ServerCrash } from 'lucide-react'
import type { AiAgent, WhatsappConnection } from '@/types'

const STATUS_LABEL: Record<WhatsappConnection['status'], string> = {
  connected: 'Conectado',
  connecting: 'Conectando...',
  disconnected: 'Desconectado',
}

const STATUS_BADGE: Record<WhatsappConnection['status'], string> = {
  connected: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  connecting: 'bg-amber-50 text-amber-700',
  disconnected: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
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

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const res = await fetch('/api/whatsapp')
      const body = await res.json()
      if (body.connection) {
        setConnection(body.connection)
        if (body.connection.status === 'connected' && pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setQrCode(null)
        }
      }
    }, 4000)
  }

  async function handleConnect() {
    if (!agentId) {
      setError('Selecciona que agente IA va a responder por WhatsApp')
      return
    }

    setError(null)
    setNotConfigured(false)
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      })
      const body = await res.json()
      if (!res.ok) {
        if (body.notConfigured) setNotConfigured(true)
        setError(body.error ?? 'No se pudo conectar WhatsApp')
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
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'No se pudo desconectar')
        return
      }

      setConnection(null)
      setQrCode(null)
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(patch: { agentId?: string; isEnabled?: boolean }) {
    const res = await fetch('/api/whatsapp', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const body = await res.json()
    if (res.ok) setConnection(body.connection)
  }

  if (notConfigured) {
    return (
      <div className="card-surface space-y-3 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-amber-50">
          <ServerCrash className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-[var(--text-1)]">Falta el servidor de WhatsApp</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-3)]">
            WhatsApp usa Evolution API, que corre en tu propio servidor (VPS) y no en Vercel. Despliega Evolution API
            ahi y agrega <code className="text-xs">EVOLUTION_API_URL</code> y{' '}
            <code className="text-xs">EVOLUTION_API_KEY</code> como variables de entorno. En cuanto esten
            configuradas, este mismo boton conecta tu numero.
          </p>
        </div>
        <button onClick={() => setNotConfigured(false)} className="btn-secondary">
          Entendido
        </button>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="card-surface space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--teal-50)]">
            <MessageCircle className="h-6 w-6 text-[var(--teal-700)]" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Conecta tu WhatsApp</h2>
            <p className="text-sm text-[var(--text-3)]">
              Tu asistente inmobiliario respondera, calificara prospectos y agendara visitas por WhatsApp
              automaticamente.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Agente IA que va a responder</label>
          <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="input-field mt-1 w-full">
            <option value="">Selecciona un agente...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.status !== 'live' ? '(no esta en vivo todavia)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleConnect} disabled={loading} className="btn-primary">
          <QrCode className="h-4 w-4" />
          {loading ? 'Conectando...' : 'Conectar WhatsApp'}
        </button>
      </div>
    )
  }

  const currentAgent = agents.find((a) => a.id === connection.agent_id)

  return (
    <div className="card-surface space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--teal-50)]">
            <MessageCircle className="h-6 w-6 text-[var(--teal-700)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-[var(--text-1)]">WhatsApp</h2>
              <span className={`badge border-transparent ${STATUS_BADGE[connection.status]}`}>
                {STATUS_LABEL[connection.status]}
              </span>
            </div>
            <p className="text-sm text-[var(--text-3)]">
              {connection.phone_number ??
                (connection.status === 'connecting' ? 'Escanea el codigo para vincular' : 'Sin numero vinculado')}
            </p>
          </div>
        </div>
        <button onClick={handleDisconnect} disabled={loading} className="btn-secondary">
          <Power className="h-4 w-4" />
          Desconectar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {connection.status === 'connecting' && qrCode && (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Codigo QR de WhatsApp" className="mx-auto h-48 w-48 rounded-lg" />
          <p className="mt-3 text-sm text-[var(--text-3)]">
            Abre WhatsApp en tu telefono -> Dispositivos vinculados -> Vincular un dispositivo, y escanea este codigo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Agente IA asignado</label>
          <select
            value={connection.agent_id ?? ''}
            onChange={(e) => handleUpdate({ agentId: e.target.value })}
            className="input-field mt-1 w-full"
          >
            <option value="">Sin agente asignado</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {currentAgent && currentAgent.status !== 'live' && (
            <p className="mt-1 text-xs text-amber-600">Este agente no esta en vivo - activalo en Agentes IA.</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-2)]">Estado</label>
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={connection.is_enabled}
              onChange={(e) => handleUpdate({ isEnabled: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm text-[var(--text-2)]">Responder automaticamente</span>
          </label>
        </div>
      </div>
    </div>
  )
}
