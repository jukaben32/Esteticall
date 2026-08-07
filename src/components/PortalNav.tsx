'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarCheck, MessageCircleQuestion, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function PortalNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/portal/login')
    router.refresh()
  }

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-[var(--teal-700)] text-white font-display font-bold text-sm">
            I
          </span>
          <span className="font-display font-semibold text-[var(--text-1)]">Client Portal</span>
        </div>
        <nav className="flex items-center gap-1.5">
          <Link
            href="/portal"
            className={`btn-secondary !py-1.5 !text-xs ${pathname === '/portal' ? '!bg-[var(--teal-50)] !text-[var(--teal-700)] !border-transparent' : ''}`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            My Viewings
          </Link>
          <Link
            href="/portal/support"
            className={`btn-secondary !py-1.5 !text-xs ${pathname?.startsWith('/portal/support') ? '!bg-[var(--teal-50)] !text-[var(--teal-700)] !border-transparent' : ''}`}
          >
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            Support
          </Link>
          <button type="button" onClick={handleSignOut} className="btn-secondary !py-1.5 !text-xs">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  )
}
