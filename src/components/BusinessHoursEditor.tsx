'use client'

import { useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import type { BusinessAvailability } from '@/types'

const DAY_LABELS = [
  { short: 'Dom', full: 'Domingo' },
  { short: 'Lun', full: 'Lunes' },
  { short: 'Mar', full: 'Martes' },
  { short: 'Mié', full: 'Miércoles' },
  { short: 'Jue', full: 'Jueves' },
  { short: 'Vie', full: 'Viernes' },
  { short: 'Sáb', full: 'Sábado' },
]

interface DayForm {
  dayOfWeek: number
  startTime: string
  endTime: string
  slotMinutes: number
  isActive: boolean
}

function toForm(existing: BusinessAvailability[]): DayForm[] {
  return DAY_LABELS.map((_, dayOfWeek) => {
    const row = existing.find((r) => r.day_of_week === dayOfWeek)
    return {
      dayOfWeek,
      startTime: row?.start_time.slice(0, 5) ?? '09:00',
      endTime: row?.end_time.slice(0, 5) ?? '17:00',
      slotMinutes: row?.slot_minutes ?? 30,
      isActive: row?.is_active ?? false,
    }
  })
}

function durationLabel(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const minutes = eh * 60 + em - (sh * 60 + sm)
  if (minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h${rest}m`
}

export function BusinessHoursEditor({ initialAvailability }: { initialAvailability: BusinessAvailability[] }) {
  const [days, setDays] = useState<DayForm[]>(toForm(initialAvailability))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const activeCount = useMemo(() => days.filter((d) => d.isActive).length, [days])

  function updateDay(index: number, patch: Partial<DayForm>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
    setSaved(false)
  }

  async function saveAll() {
    setSaving(true)
    await Promise.all(
      days.map((day) =>
        fetch('/api/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(day),
        })
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card-surface p-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-[var(--teal-700)]" />
        <p className="text-sm font-semibold text-[var(--text-1)]">Horario semanal</p>
      </div>
      <p className="text-xs text-[var(--text-3)] mb-1">
        Activa cada día y define su horario de apertura/cierre.
      </p>
      <p className="text-xs text-[var(--text-4)] mb-4">
        Abierto {activeCount} {activeCount === 1 ? 'día' : 'días'} a la semana
      </p>

      <div className="space-y-2">
        {days.map((day, i) => (
          <div key={day.dayOfWeek} className="flex flex-wrap items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
            <div className="flex items-center gap-2.5 w-24 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={day.isActive}
                onClick={() => updateDay(i, { isActive: !day.isActive })}
                className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${
                  day.isActive ? 'bg-[var(--teal-600)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    day.isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-[var(--text-1)]">{DAY_LABELS[day.dayOfWeek].full}</span>
            </div>

            <input
              type="time"
              value={day.startTime}
              onChange={(e) => updateDay(i, { startTime: e.target.value })}
              className="input-field w-auto py-1.5"
              disabled={!day.isActive}
            />
            <span className="text-sm text-[var(--text-3)]">→</span>
            <input
              type="time"
              value={day.endTime}
              onChange={(e) => updateDay(i, { endTime: e.target.value })}
              className="input-field w-auto py-1.5"
              disabled={!day.isActive}
            />

            <select
              value={day.slotMinutes}
              onChange={(e) => updateDay(i, { slotMinutes: Number(e.target.value) })}
              className="input-field w-auto py-1.5"
              disabled={!day.isActive}
            >
              {[15, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  turnos de {m} min
                </option>
              ))}
            </select>

            {day.isActive && (
              <span className="ml-auto text-xs text-[var(--text-4)]">{durationLabel(day.startTime, day.endTime)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4">
        {saved && <span className="text-xs text-[var(--teal-700)] font-medium">Guardado ✓</span>}
        <button onClick={saveAll} disabled={saving} className="btn-primary">
          {saving ? 'Guardando…' : 'Guardar horario'}
        </button>
        <p className="text-xs text-[var(--text-4)]">Los cambios aplican a las respuestas de agenda del agente IA</p>
      </div>
    </div>
  )
}
