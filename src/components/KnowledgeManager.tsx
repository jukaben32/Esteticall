'use client'

import { useState } from 'react'
import type { KnowledgeDocument } from '@/types'

export function KnowledgeManager({ initialDocuments }: { initialDocuments: KnowledgeDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', sourceUrl: '' })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const { document } = await res.json()
      setDocuments((prev) => [document, ...prev])
      setForm({ title: '', content: '', sourceUrl: '' })
      setShowForm(false)
    }
  }

  async function remove(documentId: string) {
    if (!confirm('¿Eliminar este documento?')) return
    const res = await fetch(`/api/knowledge/${documentId}`, { method: 'DELETE' })
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== documentId))
  }

  return (
    <div>
      {!showForm && (
        <button className="btn-primary mb-4" onClick={() => setShowForm(true)}>
          + Agregar documento
        </button>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card-surface p-4 mb-4 space-y-3">
          <input
            placeholder="Título (ej. Política de cancelación)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field w-full"
            required
          />
          <textarea
            placeholder="Contenido que el agente IA debe conocer y puede citar"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="input-field w-full"
            rows={4}
            required
          />
          <input
            placeholder="URL de origen (opcional)"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            className="input-field w-full"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="card-surface p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-[var(--text-1)]">{doc.title}</p>
              <p className="text-xs text-[var(--text-3)] line-clamp-2">{doc.content}</p>
              {doc.source_url && (
                <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--teal-600)]">
                  {doc.source_url}
                </a>
              )}
            </div>
            <button onClick={() => remove(doc.id)} className="text-red-600 text-sm shrink-0">
              Eliminar
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-sm text-[var(--text-3)]">
            Todavía no hay conocimiento cargado — agrega datos, políticas o preguntas frecuentes para tu agente IA.
          </p>
        )}
      </div>
    </div>
  )
}
