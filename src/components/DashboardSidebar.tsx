'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  House,
  CalendarCheck,
  PhoneCall,
  UsersRound,
  Bot,
  BarChart3,
  Briefcase,
  BookOpen,
  MessagesSquare,
  MessageCircle,
  Globe,
  CreditCard,
  BellRing,
  Clock,
  LogOut,
  Menu,
  X,
  LifeBuoy,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export const NAV_SECTIONS = [
  {
    items: [
      { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
      { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
      { href: '/dashboard/listings', label: 'Propiedades', icon: House },
      { href: '/dashboard/call-log', label: 'Llamadas', icon: PhoneCall },
      { href: '/dashboard/viewings', label: 'Citas', icon: CalendarCheck },
      { href: '/dashboard/schedule', label: 'Horario', icon: Clock },
      { href: '/dashboard/clients', label: 'Clientes', icon: UsersRound },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { href: '/dashboard/ai-agents', label: 'Agentes IA', icon: Bot },
      { href: '/dashboard/services', label: 'Servicios', icon: Briefcase },
      { href: '/dashboard/knowledge', label: 'Conocimiento', icon: BookOpen },
      { href: '/dashboard/widget', label: 'Widget', icon: MessagesSquare },
      { href: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { href: '/dashboard/website', label: 'Sitio Web', icon: Globe },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { href: '/dashboard/plan', label: 'Plan', icon: CreditCard },
      { href: '/dashboard/notifications', label: 'Notificaciones', icon: BellRing },
      { href: '/dashboard/support', label: 'Soporte', icon: LifeBuoy },
      { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
    ],
  },
]

export function DashboardSidebar({
  businessName,
  planName,
  showAdminLink = false,
}: {
  businessName: string
  planName: string
  showAdminLink?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile drawer automatically whenever navigation happens.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <header className="lg:hidden h-14 shrink-0 flex items-center justify-between px-4 bg-[var(--teal-900)] text-[var(--bg-page)]">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--teal-700)] text-white font-display font-bold">
            I
          </span>
          <span className="font-display font-semibold">
            Inmobil<span className="text-[var(--teal-400)]">IA</span>Call
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="p-2 -mr-2 text-[var(--bg-page)]"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 shrink-0 bg-[var(--teal-900)] text-[var(--bg-page)] flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between gap-2 px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
              I
            </span>
            <span className="font-display font-semibold text-lg">
              Inmobil<span className="text-[var(--teal-400)]">IA</span>Call
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
            className="lg:hidden p-1 text-[var(--bg-page)]/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-white/10 shrink-0">
          <p className="text-sm font-medium truncate">{businessName}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--bg-page)]/50">{planName}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="section-label px-3 mb-2">{section.title}</p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={active ? 'sidebar-link-active' : 'sidebar-link'}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {showAdminLink && (
            <div>
              <p className="section-label px-3 mb-2">Plataforma</p>
              <div className="space-y-1">
                <Link
                  href="/admin/knowledge"
                  className={pathname.startsWith('/admin') ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <ShieldCheck className="w-[18px] h-[18px]" />
                  Admin de plataforma
                </Link>
              </div>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <button onClick={handleSignOut} className="sidebar-link w-full">
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
