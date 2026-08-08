'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, X, ExternalLink } from 'lucide-react'
import type { PlatformKnowledgeDocument } from '@/types'

const CATEGORY_BADGE: Record<string, string> = {
  'Proceso y legal': 'bg-slate-100 text-slate-700',
}
const DEFAULT_BADGE = 'bg-[var(--bg-raised)] text-[var(--text-3)]'

function badgeClass(category: string | null) {
  if (!category) return DEFAULT_BADGE
  return CATEGORY_BADGE[category] ?? DEFAULT_BADGE
}

type FormValues = { title: string; content: string; category: string; sourceUrl: string }
const EMPTY_FORM: FormValues = { title: '', content: '', category: '', sourceUrl: '' }

function DocumentFormModal({
  title,
  initial,
  onCancel,
  onSubmit,
  submitLabel,
}: {
  title: string
  initial: FormValues
  onCancel: () => void
  onSubmit: (values: FormValues) => Promise<void>
  submitLabel: string
}) {
  const [values, setValues] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!values.title.trim() || !values.content.trim()) return
    setError(null)
    setSaving(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-[var(--bg-page)] rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg text-[var(--text-1)]">{title}</h3>
          <button type="button" onClick={onCancel} className="text-[var(--text-3)] hover:text-[var(--text-1)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Título / pregunta *</label>
          <input
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            className="input-field w-full mt-1"
            placeholder="¿Qué es CONFOTUR?"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--text-2)]">Contenido / respuesta *</label>
          <textarea
            value={values.content}
            onChange={(e) => setValues({ ...values, content: e.target.value })}
            className="input-field w-full mt-1"
            rows={5}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[var(--text-2)]">Categoría (opcional)</label>
            <input
              value={values.category}
              onChange={(e) => setValues({ ...values, category: e.target.value })}
              className="input-field w-full mt-1"
              placeholder="Proceso y legal"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-2)]">Fuente (opcional)</label>
            <input
              value={values.sourceUrl}
              onChange={(e) => setValues({ ...values, sourceUrl: e.target.value })}
              className="input-field w-full mt-1"
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PlatformKnowledgeManager({
  initialDocuments,
}: {
  initialDocuments: PlatformKnowledgeDocument[]
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [adding, setAdding] = useState(false)
  const [editingDoc, setEditingDoc] = useState<PlatformKnowledgeDocument | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function createDocument(values: FormValues) {
    const res = await fetch('/api/admin/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'No se pudo crear el documento')
    setDocuments((prev) => [body.document, ...prev])
    setAdding(false)
  }

  async function saveEdit(id: string, values: FormValues) {
    const res = await fetch(`/api/admin/knowledge/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? 'No se pudo actualizar el documento')
    setDocuments((prev) => prev.map((d) => (d.id === id ? body.document : d)))
    setEditingDoc(null)
  }

  async function deleteDocument(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'No se pudo eliminar')
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo documento
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-[var(--text-3)]">
          Todavía no hay conocimiento de plataforma. Agrega el primero — aplicará de inmediato a todo
          negocio afiliado.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-[var(--text-1)]">{doc.title}</p>
                    {doc.category && <span className={`badge ${badgeClass(doc.category)}`}>{doc.category}</span>}
                  </div>
                  <p className="text-sm text-[var(--text-3)] whitespace-pre-wrap">{doc.content}</p>
                  {doc.source_url && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--teal-700)] font-medium mt-2"
                    >
                      Fuente <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingDoc(doc)}
                    className="p-2 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-2 rounded-lg text-[var(--text-3)] hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <DocumentFormModal
          title="Nuevo documento de plataforma"
          initial={EMPTY_FORM}
          submitLabel="Crear"
          onCancel={() => setAdding(false)}
          onSubmit={createDocument}
        />
      )}

      {editingDoc && (
        <DocumentFormModal
          title="Editar documento"
          initial={{
            title: editingDoc.title,
            content: editingDoc.content,
            category: editingDoc.category ?? '',
            sourceUrl: editingDoc.source_url ?? '',
          }}
          submitLabel="Guardar"
          onCancel={() => setEditingDoc(null)}
          onSubmit={(values) => saveEdit(editingDoc.id, values)}
        />
      )}
    </div>
  )
}
