'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'
import type { PreventaProjectWithDetails } from '@/types'
import { NewProjectForm } from '@/components/NewProjectForm'

const PHASE_LABELS: Record<string, string> = {
  lanzamiento: 'Lanzamiento',
  en_construccion: 'En construcción',
  entrega: 'Entrega',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  sold_out: 'Agotado',
}

export function ProjectsTable({ initialProjects }: { initialProjects: PreventaProjectWithDetails[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [phase, setPhase] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (phase !== 'all' && p.phase !== phase) return false
      if (search && !`${p.name} ${p.area_name} ${p.city}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [projects, search, phase])

  async function toggleVisibility(project: PreventaProjectWithDetails) {
    const res = await fetch(`/api/preventa-projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_ai_agent: !project.visible_to_ai_agent }),
    })
    if (res.ok) {
      const { project: updated } = await res.json()
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    }
  }

  async function remove(projectId: string) {
    if (!confirm('¿Eliminar este proyecto? Esto también elimina sus tipos de unidad y fotos.')) return
    const res = await fetch(`/api/preventa-projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          placeholder="Buscar por nombre, zona o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[200px]"
        />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className="input-field w-auto">
          <option value="all">Todas las fases</option>
          {Object.entries(PHASE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Agregar proyecto
        </button>
      </div>

      {showForm && (
        <NewProjectForm
          onCreated={(project) => {
            setProjects((prev) => [{ ...project, unitTypes: [], photos: [], agents: [] }, ...prev])
            setShowForm(false)
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="divide-y divide-[var(--border)]">
        {filtered.map((project) => (
          <div key={project.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-3 min-w-0 sm:flex-1">
              {project.cover_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.cover_photo_url}
                  alt={project.name}
                  className="w-14 h-14 rounded-lg object-cover border border-[var(--border)] shrink-0"
                />
              ) : (
                <span className="w-14 h-14 rounded-lg border border-dashed border-[var(--border)] grid place-items-center text-[var(--text-4)] text-[10px] text-center leading-tight shrink-0">
                  Sin foto
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {project.name} {project.featured && '⭐'}
                </p>
                <p className="text-xs text-[var(--text-3)] truncate">
                  {project.area_name}, {project.city}
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  {project.unitTypes.length} tipo{project.unitTypes.length === 1 ? '' : 's'} de unidad
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-[68px] sm:pl-0">
              <span className="badge bg-[var(--teal-50)] border-transparent text-[var(--teal-800)]">
                {PHASE_LABELS[project.phase] ?? project.phase}
              </span>
              <span className="badge">{STATUS_LABELS[project.status] ?? project.status}</span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  title="Ver detalle"
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => toggleVisibility(project)}
                  title={project.visible_to_ai_agent ? 'Ocultar (no visible para la IA)' : 'Mostrar (visible para la IA)'}
                  className="p-1.5 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                >
                  {project.visible_to_ai_agent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => remove(project.id)}
                  title="Eliminar"
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-3)]">Ningún proyecto coincide con estos filtros.</p>
        )}
      </div>
    </div>
  )
}
