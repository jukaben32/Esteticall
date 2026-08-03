const TIME_ZONE = 'America/Santo_Domingo'

export const APPOINTMENT_STATUS_STYLES: Record<string, string> = {
  pending_confirmation: 'bg-[var(--gold)]/15 text-[var(--gold)]',
  scheduled: 'bg-[var(--teal-50)] text-[var(--teal-700)]',
  completed: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending_confirmation: 'Pendiente',
  scheduled: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
}

export const PAYMENT_STYLES: Record<string, string> = {
  not_required: 'bg-[var(--bg-raised)] text-[var(--text-4)]',
  pending: 'bg-[var(--gold)]/15 text-[var(--gold)]',
  paid: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  cash: 'bg-[var(--teal-50)] text-[var(--teal-800)]',
  refunded: 'bg-[var(--bg-raised)] text-[var(--text-3)]',
}

export const PAYMENT_LABELS: Record<string, string> = {
  not_required: '—',
  pending: 'Sin pagar',
  paid: '✓ Pagado',
  cash: '✓ Pagado (efectivo)',
  refunded: 'Reembolsado',
}

// Calendar day the appointment instant falls on, from the business's own
// timezone rather than the viewer's browser — a viewing at 11pm UTC and a
// browser in another timezone shouldn't disagree with the DR business about
// which day that is. en-CA gives a plain numeric YYYY-MM-DD with no
// locale-dependent literal (unlike toLocaleString), so it's also immune to
// the server/client ICU whitespace hydration mismatch.
export function dayKeyInBusinessTZ(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}
