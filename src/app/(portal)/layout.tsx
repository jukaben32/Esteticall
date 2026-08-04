import type { ReactNode } from 'react'

// Public, unauthenticated shell for /portal/[appointmentId] — the "View in
// Client Portal" link from booking confirmation emails. Deliberately outside
// the (dashboard) layout: no sidebar, no auth check, just the booking card.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[var(--bg-subtle)]">{children}</div>
}
