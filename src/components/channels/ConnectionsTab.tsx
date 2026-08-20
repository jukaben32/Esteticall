'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { Wifi, Copy, Check, RefreshCw, Loader2, Trash2, Pause, Play, Plus } from 'lucide-react'
import type { ChannelProviderAccount, ChannelHostConnectionWithStats } from '@/types'

const CHANNEL_LABELS: Record<string, string> = { airbnb: 'Airbnb', booking: 'Booking.com', vrbo: 'VRBO' }
const CHANNEL_EMOJI: Record<string, string> = { airbnb: '🏠', booking: '📘', vrbo: '🏖️' }

interface ConnectionsTabProps {
  providerAccount: ChannelProviderAccount | null
  setProviderAccount: (account: ChannelProviderAccount | null) => void
  hostConnections: ChannelHostConnectionWithStats[]
  setHostConnections: Dispatch<SetStateAction<ChannelHostConnectionWithStats[]>>
  webhookUrl: string
  onSynced: () => void
}

export function ConnectionsTab({
  providerAccount,
  setProviderAccount,
  hostConnections,
  setHostConnections,
  webhookUrl,
  onSynced,
}: ConnectionsTabProps) {
  return (
    <div className="space-y-6">
      <ProviderAccountCard providerAccount={providerAccount} setProviderAccount={setProviderAccount} webhookUrl={webhookUrl} />
      {providerAccount?.status === 'active' && (
        <HostConnectionsList hostConnections={hostConnections} setHostConnections={setHostConnections} onSynced={onSynced} />
      )}
    </div>
  )
}

function ProviderAccountCard({
  providerAccount,
  setProviderAccount,
  webhookUrl,
}: {
  providerAccount: ChannelProviderAccount | null
  setProviderAccount: (account: ChannelProviderAccount | null) => void
  webhookUrl: string
}) {
  const [showForm, setShowForm] = useState(!providerAccount)
  const [accountId, setAccountId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/channels/provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, clientSecret, webhookSecret }),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo conectar con Hostaway')
      return
    }
    const { account } = await res.json()
    setProviderAccount(account)
    setShowForm(false)
  }

  async function handleDisconnect() {
    if (
      !confirm(
        '¿Desconectar tu cuenta de Hostaway? Esto elimina todos los dueños, propiedades vinculadas y reservas registradas en esta app (no borra nada en Airbnb).'
      )
    )
      return
    const res = await fetch('/api/channels/provider', { method: 'DELETE' })
    if (res.ok) {
      setProviderAccount(null)
      setShowForm(true)
    }
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (providerAccount && !showForm) {
    return (
      <div className="rounded-xl border-2 border-green-200 bg-green-50/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-white grid place-items-center text-green-600 shrink-0">
              <Wifi className="w-5 h-5" />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-1)]">Hostaway conectado</p>
              <p className="text-xs text-[var(--text-3)]">Account ID: {providerAccount.account_id}</p>
            </div>
          </div>
          <button onClick={handleDisconnect} className="text-sm text-red-600 hover:text-red-700 shrink-0">
            Desconectar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 bg-white rounded-lg border border-[var(--border)] px-3 py-2">
          <code className="text-xs text-[var(--text-3)] truncate flex-1">{webhookUrl}</code>
          <button onClick={copyWebhook} className="p-1.5 rounded text-[var(--text-3)] hover:bg-[var(--bg-raised)] shrink-0" title="Copiar URL de webhook">
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-xs text-[var(--text-3)] mt-1.5">
          Registra esta URL como webhook en tu cuenta de Hostaway (Settings → API → Webhooks) para recibir reservas en tiempo real.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleConnect} className="card-surface p-5 space-y-3">
      <div>
        <h2 className="font-display font-semibold text-[var(--text-1)]">Conecta tu cuenta de Hostaway</h2>
        <p className="text-sm text-[var(--text-3)] mt-1">
          Airbnb no da acceso directo a su API — Hostaway es un partner certificado que sí lo tiene. Esta es la cuenta
          maestra de tu agencia; cada propietario que co-administres se conecta después, por separado, sin mezclar sus
          cuentas de Airbnb. Encuentra tu Account ID y Client Secret en Hostaway → Settings → API.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          placeholder="Account ID"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="input-field"
          required
        />
        <input
          type="password"
          placeholder="Client Secret"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          className="input-field"
          required
        />
        <input
          type="password"
          placeholder="Webhook Secret (opcional, recomendado)"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          className="input-field sm:col-span-2"
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verificando…' : 'Conectar Hostaway'}
        </button>
      </div>
    </form>
  )
}

function HostConnectionsList({
  hostConnections,
  setHostConnections,
  onSynced,
}: {
  hostConnections: ChannelHostConnectionWithStats[]
  setHostConnections: Dispatch<SetStateAction<ChannelHostConnectionWithStats[]>>
  onSynced: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  async function toggleStatus(conn: ChannelHostConnectionWithStats) {
    const nextStatus = conn.status === 'disabled' ? 'active' : 'disabled'
    const res = await fetch(`/api/channels/host-connections/${conn.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) {
      const { connection } = await res.json()
      setHostConnections((prev) => prev.map((c) => (c.id === conn.id ? { ...c, ...connection } : c)))
    }
  }

  async function remove(connId: string) {
    if (!confirm('¿Eliminar este dueño co-anfitrionado? Se desvinculan sus propiedades y se borra su historial de reservas.')) return
    const res = await fetch(`/api/channels/host-connections/${connId}`, { method: 'DELETE' })
    if (res.ok) setHostConnections((prev) => prev.filter((c) => c.id !== connId))
  }

  async function sync(connId: string) {
    setSyncingId(connId)
    const res = await fetch(`/api/channels/host-connections/${connId}/sync`, { method: 'POST' })
    setSyncingId(null)
    if (res.ok) {
      const result = await res.json()
      onSynced()
      alert(`Sincronizado: ${result.pushed} propiedades publicadas, ${result.pulled} reservas encontradas, ${result.errors} errores`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-[var(--text-1)]">Co-anfitrionaje — dueños conectados</h2>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1 inline" />
          Agregar dueño
        </button>
      </div>

      {showForm && (
        <NewHostConnectionForm
          onCreated={(conn) => {
            setHostConnections((prev) => [{ ...conn, listingCount: 0, activeListingCount: 0, pendingCommission: 0, paidCommission: 0 }, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {hostConnections.length === 0 && !showForm && (
        <p className="py-6 text-center text-sm text-[var(--text-3)]">
          Aún no tienes dueños conectados. Usa tu cartera de leads existente — el &ldquo;Co-Host Network&rdquo; de Airbnb
          todavía no opera en RD, pero co-anfitrionar no lo necesita.
        </p>
      )}

      <div className="divide-y divide-[var(--border)]">
        {hostConnections.map((conn) => (
          <div key={conn.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-3 min-w-0 sm:flex-1">
              <span className="w-10 h-10 rounded-lg bg-[var(--teal-50)] grid place-items-center text-lg shrink-0">
                {CHANNEL_EMOJI[conn.channel]}
              </span>
              <div className="min-w-0">
                <p className="font-medium truncate">{conn.owner_name}</p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {CHANNEL_LABELS[conn.channel]} · {conn.commission_pct}% comisión · {conn.listingCount} propiedad
                  {conn.listingCount === 1 ? '' : 'es'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-[52px] sm:pl-0">
              <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)]">
                ${conn.pendingCommission.toFixed(0)} pendiente
              </span>
              <StatusBadge status={conn.status} />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => sync(conn.id)}
                  disabled={syncingId === conn.id}
                  title="Sincronizar propiedades y reservas"
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                >
                  {syncingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleStatus(conn)}
                  title={conn.status === 'disabled' ? 'Reanudar' : 'Pausar'}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                >
                  {conn.status === 'disabled' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove(conn.id)}
                  title="Eliminar"
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    pending: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    disabled: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = { active: 'Activo', pending: 'Pendiente', error: 'Error', disabled: 'Pausado' }
  return <span className={`badge border-transparent ${styles[status] ?? ''}`}>{labels[status] ?? status}</span>
}

function NewHostConnectionForm({
  onCreated,
  onClose,
}: {
  onCreated: (connection: import('@/types').ChannelHostConnection) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ ownerName: '', ownerPhone: '', ownerEmail: '', channel: 'airbnb', commissionPct: '18' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/channels/host-connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo agregar al dueño')
      return
    }
    const { connection } = await res.json()
    onCreated(connection)
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <input
        placeholder="Nombre del propietario"
        value={form.ownerName}
        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
        className="input-field col-span-2"
        required
      />
      <input
        placeholder="Teléfono"
        value={form.ownerPhone}
        onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
        className="input-field"
      />
      <input
        placeholder="Email"
        type="email"
        value={form.ownerEmail}
        onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
        className="input-field"
      />
      <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="input-field">
        <option value="airbnb">Airbnb</option>
        <option value="booking">Booking.com</option>
        <option value="vrbo">VRBO</option>
      </select>
      <input
        placeholder="% de comisión (ej. 18)"
        type="number"
        min="0"
        max="100"
        value={form.commissionPct}
        onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
        className="input-field"
      />
      <div className="col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Agregando…' : 'Agregar dueño'}
        </button>
      </div>
    </form>
  )
}
