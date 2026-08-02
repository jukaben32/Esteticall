'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import { NAV_SECTIONS } from '@/components/DashboardSidebar'

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
}

export function DashboardTopBar({
  businessName,
  planName,
  unreadCount,
}: {
  businessName: string
  planName: string
  unreadCount: number
}) {
  const pathname = usePathname()

  const sectionLabel = useMemo(() => {
    const items = NAV_SECTIONS.flatMap((s) => s.items)
    const match = items.find((item) =>
      item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
    )
    return match?.label ?? 'Inicio'
  }, [pathname])

  return (
    <div className="hidden lg:flex items-center justify-between mb-4 gap-4">
      <h2 className="font-display font-semibold text-lg text-[var(--text-1)] shrink-0">{sectionLabel}</h2>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]" />
          <input
            placeholder="Buscar..."
            className="input-field pl-9 py-1.5 w-56 text-sm"
          />
        </div>

        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-1)]"
          title="Notificaciones"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold grid place-items-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-[var(--teal-50)] border border-[var(--teal-100)]">
          <span className="text-sm font-medium text-[var(--teal-800)] truncate max-w-[140px]">{businessName}</span>
          <span className="badge bg-[var(--teal-600)] text-white border-transparent text-[10px] uppercase">
            {PLAN_LABELS[planName] ?? planName}
          </span>
        </div>
      </div>
    </div>
  )
}
