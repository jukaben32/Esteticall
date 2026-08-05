'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Settings2, Play } from 'lucide-react'
import type { AiAgent, BusinessService } from '@/types'
import { AgentSettingsFields, type AgentSettingsValue } from './AgentSettingsFields'
import { AgentAssignServices } from './AgentAssignServices'
import { AgentLiveTest } from './AgentLiveTest'

function toSettingsValue(agent: AiAgent): AgentSettingsValue {
  return {
    name: agent.name,
    specialty: agent.specialty,
    voice: agent.voice,
    personality: agent.personality,
    sensitivity: agent.sensitivity,
    language: agent.language,
    greetingMessage: agent.greeting_message,
    systemPrompt: agent.system_prompt,
  }
}

export function AgentStudio({
  initialAgent,
  services,
  initialServiceIds,
}: {
  initialAgent: AiAgent
  services: BusinessService[]
  initialServiceIds: string[]
}) {
  const [agent, setAgent] = useState(initialAgent)
  const [tab, setTab] = useState<'configure' | 'test'>('configure')
  const [form, setForm] = useState<AgentSettingsValue>(toSettingsValue(initialAgent))
  const [serviceIds, setServiceIds] = useState(initialServiceIds)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, serviceIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'No se pudo guardar')
        return
      }
      const { agent: updated } = await res.json()
      setAgent(updated)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/dashboard/ai-agents" className="inline-flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--text-1)]">
          <ChevronLeft className="w-4 h-4" />
          Agentes IA
        </Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">{agent.name}</h1>
          <p className="text-sm text-[var(--text-3)]">
            <span
              className={`badge border-transparent mr-2 ${
                agent.status === 'live' ? 'bg-[var(--teal-50)] text-[var(--teal-800)]' : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
              }`}
            >
              {agent.status === 'live' ? 'Activo' : agent.status === 'paused' ? 'Pausado' : 'Borrador'}
            </span>
            Voz: {agent.voice} · {agent.personality}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        <TabButton active={tab === 'configure'} onClick={() => setTab('configure')} icon={Settings2}>
          Configurar
        </TabButton>
        <TabButton active={tab === 'test'} onClick={() => setTab('test')} icon={Play}>
          Probar en vivo
        </TabButton>
      </div>

      {tab === 'configure' ? (
        <div className="card-surface p-5 max-w-2xl">
          <div className="mb-4">
            <h2 className="font-display font-semibold text-[var(--text-1)]">Configuración del agente</h2>
            <p className="text-xs text-[var(--text-3)]">Actualiza cómo se comporta este agente en las llamadas</p>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <AgentSettingsFields value={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} />

          <div className="border-t border-[var(--border)] mt-5 pt-5">
            <AgentAssignServices services={services} selectedIds={serviceIds} onChange={setServiceIds} />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {savedAt && !saving && <span className="text-xs text-[var(--teal-700)]">Guardado ✓</span>}
          </div>
        </div>
      ) : (
        <AgentLiveTest agent={agent} businessId={agent.business_id} />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-[var(--teal-700)] text-[var(--teal-700)]'
          : 'border-transparent text-[var(--text-3)] hover:text-[var(--text-1)]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  )
}
