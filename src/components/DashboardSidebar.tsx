'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_SECTIONS = [
  {
    items: [
      { href: '/dashboard', label: 'Overview' },
      { href: '/dashboard/analytics', label: 'Analytics' },
      { href: '/dashboard/listings', label: 'Listings' },
      { href: '/dashboard/call-log', label: 'Call Log' },
      { href: '/dashboard/viewings', label: 'Viewings' },
      { href: '/dashboard/schedule', label: 'Schedule' },
      { href: '/dashboard/clients', label: 'Clients' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/dashboard/ai-agents', label: 'AI Agents' },
      { href: '/dashboard/services', label: 'Services' },
      { href: '/dashboard/knowledge', label: 'Knowledge' },
      { href: '/dashboard/widget', label: 'Widget' },
      { href: '/dashboard/website', label: 'Website' },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/plan', label: 'Plan' },
      { href: '/dashboard/notifications', label: 'Notifications' },
    ],
  },
]

export function DashboardSidebar({ businessName, planName }: { businessName: string; planName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] p-4 flex flex-col">
      <div className="mb-6">
        <p className="font-semibold">{businessName}</p>
        <p className="text-xs uppercase text-[var(--text-3)]">{planName} plan</p>
      </div>

      <nav className="flex-1 space-y-6">
        {NAV_SECTIONS.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="text-xs uppercase tracking-wide text-[var(--text-4)] mb-2">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      pathname === item.href
                        ? 'bg-[var(--teal-50)] text-[var(--teal-700)] font-medium'
                        : 'hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button onClick={handleSignOut} className="btn-secondary mt-4 w-full">
        Sign Out
      </button>
    </aside>
  )
}
