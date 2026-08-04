'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface PublicService {
  id: string
  name: string
  price: number | null
  priceType: string | null
  durationMinutes: number | null
}

interface PublicSlot {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  datetime: string // ISO
}

type Step = 'service' | 'date' | 'time' | 'details' | 'confirmed'

const STEP_ORDER: Step[] = ['service', 'date', 'time', 'details']

// The "Book" tab of the floating widget: Select a Service → Pick a Date →
// Pick a Time → Your Details → confirmation. Talks only to the public,
// unauthenticated /api/widget/public/[businessId]/{services,slots,book}
// routes, so it works both embedded on a third-party site and on the
// public /sites/[slug] page.
export function WidgetBookingPanel({
  businessId,
  primaryColor,
  isDark,
}: {
  businessId: string
  primaryColor: string
  isDark: boolean
}) {
  const [step, setStep] = useState<Step>('service')
  const [services, setServices] = useState<PublicService[] | null>(null)
  const [slots, setSlots] = useState<PublicSlot[] | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', budget: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<{ scheduledAt: string } | null>(null)

  useEffect(() => {
    fetch(`/api/widget/public/${businessId}/services`)
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]))
  }, [businessId])

  useEffect(() => {
    if (step !== 'date' || slots) return
    fetch(`/api/widget/public/${businessId}/slots?daysAhead=45`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
  }, [step, slots, businessId])

  const availableDates = useMemo(() => {
    const set = new Set((slots ?? []).map((s) => s.date))
    return Array.from(set).sort()
  }, [slots])

  const timesForSelectedDate = useMemo(
    () => (slots ?? []).filter((s) => s.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [slots, selectedDate]
  )

  const selectedService = services?.find((s) => s.id === selectedServiceId) ?? null
  const stepIndex = STEP_ORDER.indexOf(step)

  function goBack() {
    const i = STEP_ORDER.indexOf(step)
    if (i > 0) setStep(STEP_ORDER[i - 1])
  }

  async function submitBooking() {
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/widget/public/${businessId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          scheduledAt: selectedSlot.datetime,
          clientName: form.name,
          clientEmail: form.email,
          clientPhone: form.phone || undefined,
          budget: form.budget || undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setConfirmed({ scheduledAt: data.appointment.scheduled_at })
      setStep('confirmed')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const subtleText = isDark ? 'text-neutral-400' : 'text-neutral-500'
  const border = isDark ? 'border-neutral-700' : 'border-neutral-200'
  const inputCls = `w-full rounded-lg border px-3 py-2 text-sm bg-transparent ${border} ${
    isDark ? 'placeholder:text-neutral-500' : 'placeholder:text-neutral-400'
  }`

  if (step === 'confirmed' && confirmed) {
    const when = new Date(confirmed.scheduledAt)
    return (
      <div className="py-3 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 mx-auto" style={{ color: primaryColor }} />
        <p className="text-sm font-semibold">Viewing Requested!</p>
        <p className={`text-xs ${subtleText}`}>
          We will confirm your viewing for{' '}
          {when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
          {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}.
        </p>
        <p className={`text-xs ${subtleText}`}>Check your email for confirmation details.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* step dots */}
      <div className="flex items-center gap-1">
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i <= stepIndex ? primaryColor : isDark ? '#404040' : '#e5e5e5' }}
          />
        ))}
      </div>

      {step === 'service' && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Select a Service</p>
          {services === null && <p className={`text-xs ${subtleText}`}>Loading…</p>}
          {services?.length === 0 && <p className={`text-xs ${subtleText}`}>No services available yet.</p>}
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {services?.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${border} ${
                  selectedServiceId === s.id ? 'ring-2' : ''
                }`}
                style={selectedServiceId === s.id ? { borderColor: primaryColor } : undefined}
              >
                <p className="font-medium">{s.name}</p>
                <p className={`text-xs ${subtleText}`}>
                  {s.durationMinutes ? `${s.durationMinutes} min` : ''}
                  {s.price ? ` · $${s.price}` : ''}
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('date')}
            disabled={!selectedServiceId}
            className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: primaryColor }}
          >
            Next
          </button>
        </div>
      )}

      {step === 'date' && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Pick a Date</p>
          {slots === null && <p className={`text-xs ${subtleText}`}>Loading slots…</p>}
          {slots !== null && availableDates.length === 0 && (
            <p className={`text-xs ${subtleText}`}>No availability found. Please check back later.</p>
          )}
          <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
            {availableDates.map((d) => {
              const date = new Date(`${d}T00:00:00`)
              return (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDate(d)
                    setStep('time')
                  }}
                  className={`rounded-lg border py-1.5 text-xs ${border} ${selectedDate === d ? 'ring-2' : ''}`}
                  style={selectedDate === d ? { borderColor: primaryColor } : undefined}
                >
                  <span className="block font-medium">{date.getDate()}</span>
                  <span className={subtleText}>{date.toLocaleDateString(undefined, { month: 'short' })}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={goBack} className={`flex-1 rounded-lg border py-2 text-sm ${border}`}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'time' && (
        <div className="space-y-2">
          <p className="text-xs font-medium">
            Pick a Time <span className={subtleText}>· {selectedDate}</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
            {timesForSelectedDate.map((s) => (
              <button
                key={s.datetime}
                onClick={() => setSelectedSlot(s)}
                className={`rounded-lg border py-1.5 text-xs ${border} ${
                  selectedSlot?.datetime === s.datetime ? 'ring-2' : ''
                }`}
                style={selectedSlot?.datetime === s.datetime ? { borderColor: primaryColor } : undefined}
              >
                {s.time}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={goBack} className={`flex-1 rounded-lg border py-2 text-sm ${border}`}>
              Back
            </button>
            <button
              onClick={() => setStep('details')}
              disabled={!selectedSlot}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-2">
          <p className="text-xs font-medium">Your Details</p>
          {selectedService && selectedSlot && (
            <p className={`text-xs ${subtleText}`}>
              {selectedService.name} · {selectedSlot.date} {selectedSlot.time}
            </p>
          )}
          <input
            className={inputCls}
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              placeholder="jane@example.com"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <input
            className={inputCls}
            placeholder="Budget range (optional), e.g. $400k–$700k"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
          />
          <textarea
            className={inputCls}
            placeholder="Any additional information…"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={goBack} className={`flex-1 rounded-lg border py-2 text-sm ${border}`}>
              Back
            </button>
            <button
              onClick={submitBooking}
              disabled={!form.name || !form.email || submitting}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? 'Booking…' : 'Book Viewing'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
