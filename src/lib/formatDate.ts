const TIME_ZONE = 'America/Santo_Domingo'

// Built manually from Intl.DateTimeFormat parts (locale 'en-US' for stable,
// unambiguous part values) instead of toLocaleString('es-DO'), because the
// ICU data bundled with Node can format the AM/PM separator as a plain space
// while browsers use a narrow no-break space — that invisible difference
// causes a React hydration mismatch between server- and client-rendered text.
function getParts(iso: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(iso))
  const map: Record<string, string> = {}
  for (const part of parts) map[part.type] = part.value
  return map
}

export function formatDateTime(iso: string): string {
  const p = getParts(iso)
  const period = p.dayPeriod === 'AM' ? 'a. m.' : 'p. m.'
  return `${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute} ${period}`
}

export function formatDate(iso: string): string {
  const p = getParts(iso)
  return `${p.day}/${p.month}/${p.year}`
}

// "hace 7 horas" style — computed once, server-side, at request time (never
// call this from a 'use client' render, or the ticking clock becomes a
// hydration mismatch). Falls back to the absolute date past ~30 days.
export function formatRelativeTime(iso: string): string {
  const diffSeconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSeconds < 60) return 'justo ahora'
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 30) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`
  return formatDate(iso)
}
