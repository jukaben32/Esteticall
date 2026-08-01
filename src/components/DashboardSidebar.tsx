'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Home,
  Calendar,
  Phone,
  Users,
  Bot,
  BarChart3,
  Briefcase,
  BookOpen,
  MessageSquare,
  Globe,
  CreditCard,
  Bell,
  Clock,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_SECTIONS = [
  {
    items: [
      { href: '/dashboard', label: 'Inicio', icon: LayoutGrid },
      { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
      { href: '/dashboard/listings', label: 'Propiedades', icon: Home },
      { href: '/dashboard/call-log', label: 'Llamadas', icon: Phone },
      { href: '/dashboard/viewings', label: 'Citas', icon: Calendar },
      { href: '/dashboard/schedule', label: 'Horario', icon: Clock },
      { href: '/dashboard/clients', label: 'Clientes', icon: Users },
    ],
  },
  {
    title: 'Herramientas',
    items: [
      { href: '/dashboard/ai-agents', label: 'Agentes IA', icon: Bot },
      { href: '/dashboard/services', label: 'Servicios', icon: Briefcase },
      { href: '/dashboard/knowledge', label: 'Conocimiento', icon: BookOpen },
      { href: '/dashboard/widget', label: 'Widget', icon: MessageSquare },
      { href: '/dashboard/website', label: 'Sitio Web', icon: Globe },
    ],
  },
  {
    title: 'Cuenta',
    items: [
      { href: '/dashboard/plan', label: 'Plan', icon: CreditCard },
      { href: '/dashboard/notifications', label: 'Notificaciones', icon: Bell },
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
    <aside className="w-64 shrink-0 bg-[var(--teal-900)] text-[var(--bg-page)] flex flex-col">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10 shrink-0">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
          E
        </span>
        <span className="font-display font-semibold text-lg">
          Estate<span className="text-[var(--teal-400)]">Call</span>
        </span>
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
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button onClick={handleSignOut} className="sidebar-link w-full">
          <LogOut className="w-[18px] h-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
