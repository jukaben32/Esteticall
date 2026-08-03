'use client'

import { AGENT_VOICES, AGENT_PERSONALITIES, AGENT_INTERRUPTION_LEVELS, AGENT_LANGUAGES } from '@/constants'

export interface AgentSettingsValue {
  name: string
  specialty: string
  voice: string
  personality: string
  sensitivity: number
  language: string
  greetingMessage: string
  systemPrompt: string
}

export function AgentSettingsFields({
  value,
  onChange,
}: {
  value: AgentSettingsValue
  onChange: (patch: Partial<AgentSettingsValue>) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Nombre del agente *</label>
        <input
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="input-field"
          placeholder="ej. Alexis — Especialista Residencial"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Voz</label>
          <select value={value.voice} onChange={(e) => onChange({ voice: e.target.value })} className="input-field">
            {AGENT_VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Personalidad</label>
          <select
            value={value.personality}
            onChange={(e) => onChange({ personality: e.target.value })}
            className="input-field"
          >
            {AGENT_PERSONALITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Sensibilidad de interrupción</label>
        <select
          value={value.sensitivity}
          onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
          className="input-field"
        >
          {AGENT_INTERRUPTION_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Idioma</label>
        <select
          value={value.language}
          onChange={(e) => onChange({ language: e.target.value })}
          className="input-field"
        >
          {AGENT_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Mensaje de saludo</label>
        <textarea
          value={value.greetingMessage}
          onChange={(e) => onChange({ greetingMessage: e.target.value })}
          className="input-field"
          rows={2}
          required
        />
        <p className="text-xs text-[var(--text-3)] mt-1">Lo primero que dice el agente al conectar la llamada.</p>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-2)] block mb-1">Prompt del sistema</label>
        <textarea
          value={value.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          className="input-field"
          rows={4}
        />
        <p className="text-xs text-[var(--text-3)] mt-1">Instrucciones de cómo debe comportarse el agente en llamada.</p>
      </div>
    </div>
  )
}
