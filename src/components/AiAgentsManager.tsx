'use client'

import { useState } from 'react'
import type { AiAgent } from '@/types'
import { AGENT_VOICES, AGENT_PERSONALITIES } from '@/constants'

export function AiAgentsManager({
  initialAgents,
  agentLimit,
}: {
  initialAgents: AiAgent[]
  agentLimit: number
}) {
  const [agents, setAgents] = useState(initialAgents)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    specialty: 'Residential Specialist',
    voice: AGENT_VOICES[0] as string,
    personality: 'friendly',
    sensitivity: 0.5,
    greetingMessage: 'Hello! Thank you for calling. How can I help you today?',
  })

  const atLimit = agentLimit !== 0 && agents.length >= agentLimit

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Could not create agent')
      return
    }
    const { agent } = await res.json()
    setAgents((prev) => [agent, ...prev])
    setShowForm(false)
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

  return (
    <div>
      {!showForm && (
        <button className="btn-primary mb-4" onClick={() => setShowForm(true)} disabled={atLimit}>
          {atLimit ? 'Agent limit reached — upgrade plan' : '+ New Agent'}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card-surface p-4 mb-4 grid grid-cols-2 gap-3">
          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
          <input
            placeholder="Agent name (e.g. Alexis)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 border rounded-lg px-3 py-2"
            required
          />
          <input
            placeholder="Specialty"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={form.voice}
            onChange={(e) => setForm({ ...form, voice: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            {AGENT_VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={form.personality}
            onChange={(e) => setForm({ ...form, personality: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            {AGENT_PERSONALITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <label className="text-sm">Sensitivity</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={form.sensitivity}
              onChange={(e) => setForm({ ...form, sensitivity: Number(e.target.value) })}
            />
          </div>
          <textarea
            placeholder="Greeting message"
            value={form.greetingMessage}
            onChange={(e) => setForm({ ...form, greetingMessage: e.target.value })}
            className="col-span-2 border rounded-lg px-3 py-2"
            rows={2}
          />
          <div className="col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Agent
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="card-surface p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{agent.name}</p>
              <p className="text-xs text-[var(--text-3)]">
                {agent.specialty} · {agent.voice} · {agent.calls_handled} calls handled
              </p>
            </div>
            <button
              onClick={() => toggleLive(agent)}
              className={`text-xs rounded-full px-3 py-1 ${
                agent.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {agent.status === 'live' ? 'Live · Handling calls' : 'Paused'}
            </button>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-sm text-[var(--text-3)]">No agents yet — create your first one above.</p>
        )}
      </div>
    </div>
  )
}
