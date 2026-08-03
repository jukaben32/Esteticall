'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mic, Play, Copy, Pencil, Trash2, Power } from 'lucide-react'
import type { AiAgent, BusinessService } from '@/types'
import type { AgentTemplate } from '@/constants'
import { interruptionLabel } from '@/constants'
import { AgentEditModal } from './AgentEditModal'
import { AgentTemplatesGallery } from './AgentTemplatesGallery'
import { AgentTemplatePreview } from './AgentTemplatePreview'

export function AiAgentsManager({
  initialAgents,
  agentLimit,
  services,
  initialServiceIdsByAgent,
}: {
  initialAgents: AiAgent[]
  agentLimit: number
  services: BusinessService[]
  initialServiceIdsByAgent: Record<string, string[]>
}) {
  const [agents, setAgents] = useState(initialAgents)
  const [serviceIdsByAgent, setServiceIdsByAgent] = useState(initialServiceIdsByAgent)
  const [modalAgent, setModalAgent] = useState<AiAgent | 'new' | null>(null)
  const [templateFromModal, setTemplateFromModal] = useState<AgentTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const atLimit = agentLimit !== 0 && agents.length >= agentLimit

  function handleSaved(agent: AiAgent, serviceIds: string[]) {
    setAgents((prev) => {
      const exists = prev.some((a) => a.id === agent.id)
      return exists ? prev.map((a) => (a.id === agent.id ? agent : a)) : [agent, ...prev]
    })
    setServiceIdsByAgent((prev) => ({ ...prev, [agent.id]: serviceIds }))
    setModalAgent(null)
    setTemplateFromModal(null)
  }

  async function toggleLive(agent: AiAgent) {
    const nextStatus = agent.status === 'live' ? 'paused' : 'live'
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) {
      const { agent: updated } = await res.json()
      setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    }
  }

  async function handleDuplicate(agent: AiAgent) {
    setError(null)
    const res = await fetch(`/api/agents/${agent.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'duplicate' }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'No se pudo duplicar el agente')
      return
    }
    const { agent: created } = await res.json()
    setAgents((prev) => [created, ...prev])
    setServiceIdsByAgent((prev) => ({ ...prev, [created.id]: serviceIdsByAgent[agent.id] ?? [] }))
  }

  async function handleDelete(agent: AiAgent) {
    if (!confirm(`¿Eliminar el agente "${agent.name}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id))
    }
  }

  function handleActivateTemplate(template: AgentTemplate) {
    setPreviewTemplate(null)
    setTemplateFromModal(template)
    setModalAgent('new')
  }

  return (
    <div className="space-y-6">
      <section className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">
              Agentes activos ({agents.length}/{agentLimit || '∞'})
            </h2>
            <p className="text-sm text-[var(--text-3)]">Tus agentes de voz desplegados atendiendo llamadas</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setTemplateFromModal(null)
              setModalAgent('new')
            }}
            disabled={atLimit}
          >
            + Nuevo agente
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {atLimit && (
          <p className="text-xs text-[var(--gold)] mb-3">
            Alcanzaste el límite de agentes de tu plan — mejora tu plan para crear más.
          </p>
        )}

        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="card-surface p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] shrink-0">
                  <Mic className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--text-1)] truncate">{agent.name}</p>
                    <span
                      className={`badge border-transparent shrink-0 ${
                        agent.status === 'live'
                          ? 'bg-[var(--teal-50)] text-[var(--teal-800)]'
                          : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
                      }`}
                    >
                      {agent.status === 'live' ? 'Activo' : agent.status === 'paused' ? 'Pausado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-3)] truncate">
                    Voz: {agent.voice} · {agent.personality} · interrupción {interruptionLabel(agent.sensitivity)}
                  </p>
                  <p className="text-xs text-[var(--text-3)]">
                    {(serviceIdsByAgent[agent.id] ?? []).length} servicios asignados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/dashboard/ai-agents/${agent.id}`} className="btn-secondary !py-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Probar
                </Link>
                <IconButton label={agent.status === 'live' ? 'Pausar' : 'Activar'} onClick={() => toggleLive(agent)}>
                  <Power className="w-4 h-4" />
                </IconButton>
                <IconButton label="Duplicar" onClick={() => handleDuplicate(agent)}>
                  <Copy className="w-4 h-4" />
                </IconButton>
                <IconButton label="Editar" onClick={() => setModalAgent(agent)}>
                  <Pencil className="w-4 h-4" />
                </IconButton>
                <IconButton label="Eliminar" onClick={() => handleDelete(agent)} danger>
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <p className="text-sm text-[var(--text-3)]">
              Todavía no hay agentes — crea el primero arriba o activa una plantilla abajo.
            </p>
          )}
        </div>
      </section>

      <AgentTemplatesGallery
        activeAgentNames={agents.map((a) => a.name)}
        atLimit={atLimit}
        onActivate={handleActivateTemplate}
        onPreview={setPreviewTemplate}
      />

      {modalAgent && (
        <AgentEditModal
          agent={modalAgent === 'new' ? undefined : modalAgent}
          template={modalAgent === 'new' ? templateFromModal ?? undefined : undefined}
          services={services}
          initialServiceIds={modalAgent === 'new' ? [] : serviceIdsByAgent[modalAgent.id] ?? []}
          onClose={() => {
            setModalAgent(null)
            setTemplateFromModal(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {previewTemplate && (
        <AgentTemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onActivate={() => handleActivateTemplate(previewTemplate)}
          disabled={atLimit}
        />
      )}
    </div>
  )
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${
        danger
          ? 'text-[var(--text-3)] hover:text-red-600 hover:bg-red-50'
          : 'text-[var(--text-3)] hover:text-[var(--teal-700)] hover:bg-[var(--teal-50)]'
      }`}
    >
      {children}
    </button>
  )
}
