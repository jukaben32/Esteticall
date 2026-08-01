'use client'

import { useState } from 'react'
import type { BusinessAvailability } from '@/types'

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

export function ScheduleEditor({ initialAvailability }: { initialAvailability: BusinessAvailability[] }) {
  const [days, setDays] = useState<DayForm[]>(toForm(initialAvailability))
  const [savingDay, setSavingDay] = useState<number | null>(null)

  function updateDay(index: number, patch: Partial<DayForm>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  async function saveDay(index: number) {
    setSavingDay(index)
    const day = days[index]
    await fetch('/api/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(day),
    })
    setSavingDay(null)
  }

  return (
    <div className="space-y-2">
      {days.map((day, i) => (
        <div key={day.dayOfWeek} className="card-surface p-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 w-32">
            <input
              type="checkbox"
              checked={day.isActive}
              onChange={(e) => updateDay(i, { isActive: e.target.checked })}
            />
            <span className="text-sm font-medium">{DAY_LABELS[day.dayOfWeek]}</span>
          </label>
          <input
            type="time"
            value={day.startTime}
            onChange={(e) => updateDay(i, { startTime: e.target.value })}
            className="input-field w-auto"
            disabled={!day.isActive}
          />
          <span className="text-sm text-[var(--text-3)]">a</span>
          <input
            type="time"
            value={day.endTime}
            onChange={(e) => updateDay(i, { endTime: e.target.value })}
            className="input-field w-auto"
            disabled={!day.isActive}
          />
          <select
            value={day.slotMinutes}
            onChange={(e) => updateDay(i, { slotMinutes: Number(e.target.value) })}
            className="input-field w-auto"
            disabled={!day.isActive}
          >
            {[15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                turnos de {m} min
              </option>
            ))}
          </select>
          <button className="btn-secondary ml-auto" onClick={() => saveDay(i)} disabled={savingDay === i}>
            {savingDay === i ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      ))}
    </div>
  )
}
