'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { AiAgent, BusinessService } from '@/types'
import type { AgentTemplate } from '@/constants'
import { AgentSettingsFields, type AgentSettingsValue } from './AgentSettingsFields'
import { AgentAssignServices } from './AgentAssignServices'

function defaultsFromAgent(agent?: AiAgent, template?: AgentTemplate): AgentSettingsValue {
  if (template) {
    return {
      name: template.name,
      specialty: template.role,
      voice: template.voice,
      personality: template.personality,
      sensitivity: template.sensitivity,
      language: 'en',
      greetingMessage: template.greetingMessage,
      systemPrompt: template.systemPrompt,
    }
  }
  if (!agent) {
    return {
      name: '',
      specialty: 'Especialista Residencial',
      voice: 'alloy',
      personality: 'friendly',
      sensitivity: 0.5,
      language: 'en',
      greetingMessage: '¡Hola! Gracias por llamar. ¿Cómo puedo ayudarte hoy?',
      systemPrompt: '',
    }
  }
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

export function AgentEditModal({
  agent,
  template,
  services,
  initialServiceIds = [],
  onClose,
  onSaved,
}: {
  agent?: AiAgent
  template?: AgentTemplate
  services: BusinessService[]
  initialServiceIds?: string[]
  onClose: () => void
  onSaved: (agent: AiAgent, serviceIds: string[]) => void
}) {
  const isEdit = Boolean(agent)
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<AgentSettingsValue>(defaultsFromAgent(agent, template))
  const [serviceIds, setServiceIds] = useState<string[]>(initialServiceIds)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function patchForm(patch: Partial<AgentSettingsValue>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function goNext() {
    if (form.name.trim().length < 2 || form.greetingMessage.trim().length < 5) {
      setError('Completa el nombre y el mensaje de saludo antes de continuar.')
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, serviceIds, status: agent?.status ?? 'draft' }
      const res = await fetch(isEdit ? `/api/agents/${agent!.id}` : '/api/agents', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'No se pudo guardar el agente')
        return
      }
      const { agent: saved } = await res.json()
      onSaved(saved, serviceIds)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="card-raised w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="font-display font-semibold text-lg text-[var(--text-1)]">
              {isEdit ? 'Editar agente' : 'Nuevo agente'}
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              Paso {step} de 2 — {step === 1 ? 'Configuración del agente' : 'Asignar servicios'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <StepDot n={2} active={step === 2} done={false} />
            <button onClick={onClose} aria-label="Cerrar" className="text-[var(--text-3)] hover:text-[var(--text-1)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {step === 1 ? (
            <AgentSettingsFields value={form} onChange={patchForm} />
          ) : (
            <AgentAssignServices services={services} selectedIds={serviceIds} onChange={setServiceIds} />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-5 pt-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="btn-secondary"
            disabled={saving}
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {step === 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              Siguiente: Asignar servicios →
            </button>
          ) : (
            <button type="button" onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`grid place-items-center w-6 h-6 rounded-full text-xs font-semibold ${
        active
          ? 'bg-[var(--teal-700)] text-white'
          : done
            ? 'bg-[var(--teal-50)] text-[var(--teal-700)]'
            : 'bg-[var(--bg-raised)] text-[var(--text-3)]'
      }`}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </span>
  )
}
