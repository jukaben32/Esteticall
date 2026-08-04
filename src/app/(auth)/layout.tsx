import type { ReactNode } from 'react'
import Link from 'next/link'
import { PhoneCall, CalendarCheck, BarChart3, ShieldCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: PhoneCall,
    title: 'Nunca pierdas una consulta',
    body: 'La IA responde 24/7, incluso fuera de horario.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda visitas automáticamente',
    body: 'Los clientes agendan mientras conversan.',
  },
  {
    icon: BarChart3,
    title: 'Analítica en tiempo real',
    body: 'Sigue llamadas, leads y conversiones.',
  },
]

const STATS = [
  { value: '24/7', label: 'Disponibilidad' },
  { value: '3 min', label: 'Tiempo de configuración' },
  { value: '10x', label: 'Más leads' },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-page)]">
      {/* ─── Panel de marca ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-[var(--teal-900)] text-[var(--bg-page)] relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(600px circle at 15% 15%, rgba(14,124,90,0.35), transparent 60%), radial-gradient(500px circle at 85% 85%, rgba(61,185,138,0.20), transparent 60%)',
          }}
        />

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
              I
            </span>
            <span className="font-display font-semibold text-xl">
              Inmobil<span className="text-[var(--teal-400)]">IA</span>Call
            </span>
          </Link>

          <p className="mt-3 text-xs uppercase tracking-widest text-[var(--bg-page)]/45 font-semibold">
            AI Voice Receptionist Platform
          </p>

          <h1 className="font-display text-3xl xl:text-4xl font-semibold leading-tight mt-10 max-w-md">
            El recepcionista IA de tu agencia <span className="text-[var(--teal-400)]">nunca duerme</span>.
          </h1>
          <p className="text-[var(--bg-page)]/65 mt-4 max-w-sm text-[15px] leading-relaxed">
            Atiende clientes, agenda visitas y captura leads automáticamente — mientras tú te enfocas en cerrar
            tratos.
          </p>

          <div className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-white/10 shrink-0">
                  <f.icon className="w-[18px] h-[18px] text-[var(--teal-400)]" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-[var(--bg-page)]/55">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-8 pt-8 border-t border-white/10">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-2xl font-semibold text-[var(--teal-400)]">{s.value}</p>
              <p className="text-[11px] text-[var(--bg-page)]/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Panel de formulario ────────────────────── */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8">
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-6">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
            I
          </span>
          <span className="font-display font-semibold text-lg text-[var(--text-1)]">
            Inmobil<span className="text-[var(--teal-700)]">IA</span>Call
          </span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-4 mb-4 text-[11px] font-medium text-[var(--text-3)]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--teal-600)]" />
              SSL Seguro
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <span>99.9% Uptime</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
