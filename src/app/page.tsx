'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PLAN_LIMITS } from '@/constants'

const STEPS = [
  { n: '01', title: 'Conecta', body: 'Enlaza tu catálogo de tratamientos y tu agenda en minutos. Sin instalaciones.' },
  { n: '02', title: 'Tu agente atiende', body: 'Tu agente IA responde y orienta a tus pacientes 24/7 con voz natural.' },
  { n: '03', title: 'Agenda citas', body: 'Reserva en tu calendario y confirma al paciente automáticamente.' },
  { n: '04', title: 'Trata tú', body: 'Recibe la agenda organizada y enfócate solo en el tratamiento.' },
]

const DEMO_TREATMENTS = [
  { title: 'Toxina Botulínica - Frente', price: 'Desde $250', category: 'Inyectables' },
  { title: 'HydraFacial', price: '$150', category: 'Faciales' },
  { title: 'Depilación Láser - Piernas', price: '$200', category: 'Láser' },
  { title: 'Criolipólisis', price: 'Desde $300', category: 'Corporal' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const plans = Object.values(PLAN_LIMITS)

  return (
    <main className="bg-[var(--bg-page)] text-[var(--text-2)]">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[var(--bg-page)]/90 backdrop-blur border-b border-[var(--border)]">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-[var(--teal-700)] text-white font-display font-bold text-lg">
              E
            </span>
            <span className="font-display font-semibold text-lg text-[var(--text-1)] tracking-tight">
              Esteti<span className="text-[var(--teal-700)]">C</span>all
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-[var(--teal-700)] transition-colors">Funciones</a>
            <a href="#how" className="hover:text-[var(--teal-700)] transition-colors">Cómo funciona</a>
            <a href="#treatments" className="hover:text-[var(--teal-700)] transition-colors">Tratamientos</a>
            <a href="#pricing" className="hover:text-[var(--teal-700)] transition-colors">Precios</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/signup" className="btn-primary">
              Probar gratis
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-[var(--text-1)]"
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden bg-[var(--bg-page)] border-t border-[var(--border)]">
            <div className="px-5 py-4 flex flex-col gap-3 text-sm font-medium">
              <a href="#features" onClick={() => setMenuOpen(false)} className="py-2">Funciones</a>
              <a href="#how" onClick={() => setMenuOpen(false)} className="py-2">Cómo funciona</a>
              <a href="#treatments" onClick={() => setMenuOpen(false)} className="py-2">Tratamientos</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="py-2">Precios</a>
              <hr className="border-[var(--border)]" />
              <Link href="/login" className="py-2">Iniciar sesión</Link>
              <Link href="/signup" className="py-2 text-[var(--teal-700)] font-semibold">Probar gratis</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[36rem] h-[36rem] rounded-full bg-[var(--teal-50)]/60 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal-700)]">
              Agente de voz con IA para spas médico-estéticos
            </p>
            <h1 className="mt-4 font-display font-semibold text-[var(--text-1)] text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Tu recepción <span className="italic text-[var(--teal-700)]">nunca duerme.</span>
            </h1>
            <p className="mt-6 text-lg text-[var(--text-2)] max-w-xl">
              EstetiCall responde, orienta y agenda citas por ti con un agente de voz natural
              disponible 24/7. Tú te enfocas en el tratamiento; nosotros hacemos el seguimiento.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6 py-3 text-sm">
                Empezar gratis
              </Link>
              <a href="#how" className="btn-secondary px-6 py-3 text-sm">
                Ver cómo funciona
              </a>
            </div>

            <p className="mt-6 text-sm text-[var(--text-3)]">
              Sin contrato largo · Cancela cuando quieras · Soporte en español
            </p>
          </div>

          <div className="animate-fade-up">
            <div className="card-raised p-5 max-w-md ml-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] font-display font-bold">
                    A
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-1)]">Alexis · Agente IA</p>
                    <p className="text-xs text-[var(--text-3)] flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[var(--teal-700)] pulse-ring" /> Llamada en curso
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-[var(--teal-700)] bg-[var(--teal-50)] px-2.5 py-1 rounded-full">
                  02:14
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="bg-[var(--bg-raised)] rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-xs text-[var(--text-3)] mb-0.5">Alexis</p>
                  Hola María, soy Alexis de Piel &amp; Spa. ¿Le interesa agendar su sesión de HydraFacial?
                </div>
                <div className="bg-[var(--teal-50)] rounded-2xl rounded-tr-sm p-3 max-w-[85%] ml-auto text-[var(--text-2)]">
                  <p className="text-xs text-[var(--teal-800)] mb-0.5">María R.</p>
                  ¡Sí! Me gustaría agendar para este jueves.
                </div>
                <div className="bg-[var(--bg-raised)] rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-xs text-[var(--text-3)] mb-0.5">Alexis</p>
                  Perfecto, ¿le viene bien el jueves a las 4:00 PM?
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 bg-[var(--teal-700)] text-white rounded-2xl p-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div className="text-xs leading-tight">
                  <p className="font-semibold">Cita agendada</p>
                  <p className="opacity-90">Jue 17 jul · 4:00 PM · HydraFacial</p>
                </div>
              </div>
            </div>

            <div className="max-w-md ml-auto mt-4 flex items-center gap-4 text-xs text-[var(--text-3)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-700)]" /> Voz natural
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-700)]" /> ES / EN
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal-700)]" /> Agenda automática
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="how" className="py-16 sm:py-24 bg-[var(--bg-raised)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal-700)]">Cómo funciona</p>
            <h2 className="mt-3 font-display font-semibold text-[var(--text-1)] text-3xl sm:text-4xl tracking-tight">
              De la primera llamada a la cita, sin que nadie de tu equipo conteste el teléfono.
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)] rounded-3xl overflow-hidden border border-[var(--border)]">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-[var(--bg-surface)] p-7">
                <span className="font-display text-3xl text-[var(--teal-100)] font-bold">{step.n}</span>
                <h3 className="mt-3 font-semibold text-[var(--text-1)]">{step.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-3)]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal-700)]">Funciones</p>
            <h2 className="mt-3 font-display font-semibold text-[var(--text-1)] text-3xl sm:text-4xl tracking-tight">
              Un asistente telefónico que también cuida a tus pacientes.
            </h2>
          </div>

          <div className="mt-12 grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-[var(--teal-900)] text-[var(--bg-page)] rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full bg-[var(--teal-700)]/30 blur-2xl" />
              <h3 className="font-display text-2xl sm:text-3xl font-semibold">Llamadas humanas, a escala</h3>
              <p className="mt-3 text-[var(--bg-page)]/75 max-w-md">
                Voz natural con entonación real, en español e inglés. Tu agente mantiene una conversación
                fluida, responde dudas sobre tratamientos y hace el cribado de contraindicaciones antes de agendar.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-[var(--bg-page)]/85">
                <li className="flex items-center gap-2"><span className="text-[var(--teal-400)]">✓</span> Cribado de contraindicaciones antes de tratamientos sensibles</li>
                <li className="flex items-center gap-2"><span className="text-[var(--teal-400)]">✓</span> Manejo de objeciones y preguntas frecuentes</li>
                <li className="flex items-center gap-2"><span className="text-[var(--teal-400)]">✓</span> Llamadas ilimitadas en horario del paciente</li>
              </ul>
            </div>

            <div className="bg-[var(--teal-50)] rounded-3xl p-8 border border-[var(--teal-700)]/20">
              <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">Agenda sin fricción</h3>
              <p className="mt-3 text-sm text-[var(--text-2)]/80">
                Cada cita se crea en tu calendario y se confirma automáticamente. Cero ida y vuelta de mensajes.
              </p>
              <div className="mt-6 bg-white rounded-2xl p-4 text-sm shadow-sm">
                <p className="text-[var(--text-3)] text-xs">Próxima cita</p>
                <p className="font-semibold text-[var(--text-1)] mt-1">Jue 17 jul · 4:00 PM</p>
                <p className="text-[var(--teal-700)] text-xs mt-0.5">HydraFacial</p>
              </div>
            </div>

            <div className="lg:col-span-3 card-surface p-8 sm:p-10 grid sm:grid-cols-3 gap-8 items-center">
              <div className="sm:col-span-1">
                <h3 className="font-display text-xl font-semibold text-[var(--text-1)]">Sigue todo el pipeline</h3>
                <p className="mt-2 text-sm text-[var(--text-3)]">Cada llamada, paciente y cita queda registrada y accesible.</p>
              </div>
              <div className="sm:col-span-2 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-2xl bg-[var(--bg-raised)] py-5">
                  <p className="font-display text-2xl text-[var(--teal-700)]">Llamadas</p>
                  <p className="text-xs text-[var(--text-3)] mt-1">Registro completo</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-raised)] py-5">
                  <p className="font-display text-2xl text-[var(--teal-700)]">Pacientes</p>
                  <p className="text-xs text-[var(--text-3)] mt-1">Base de leads</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-raised)] py-5">
                  <p className="font-display text-2xl text-[var(--teal-700)]">Citas</p>
                  <p className="text-xs text-[var(--text-3)] mt-1">Agenda al día</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tratamientos */}
      <section id="treatments" className="py-16 sm:py-24 bg-[var(--bg-raised)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal-700)]">Tratamientos</p>
            <h2 className="mt-3 font-display font-semibold text-[var(--text-1)] text-3xl sm:text-4xl tracking-tight">
              Lo que tu agente ofrece en cada llamada.
            </h2>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEMO_TREATMENTS.map((t) => (
              <div key={t.title} className="card-surface p-5">
                <div className="aspect-video rounded-xl bg-[var(--teal-50)] mb-4" />
                <p className="font-semibold text-[var(--text-1)]">{t.title}</p>
                <p className="text-[var(--teal-700)] font-semibold mt-1">{t.price}</p>
                <p className="text-xs text-[var(--text-3)] mt-1">{t.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--teal-700)]">Precios</p>
            <h2 className="mt-3 font-display font-semibold text-[var(--text-1)] text-3xl sm:text-4xl tracking-tight">
              Planes que crecen con tu clínica.
            </h2>
            <p className="mt-3 text-[var(--text-3)]">Sin permanencia. Empieza gratis y paga solo cuando escales.</p>
          </div>

          <div className="mt-12 grid lg:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => {
              const popular = plan.id === 'pro'
              return (
                <div
                  key={plan.id}
                  className={
                    popular
                      ? 'bg-[var(--teal-900)] text-[var(--bg-page)] rounded-3xl p-7 relative shadow-lg'
                      : 'card-surface p-7'
                  }
                >
                  {popular && (
                    <span className="absolute -top-3 left-7 text-xs font-semibold bg-[var(--teal-700)] text-white px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  )}
                  <h3 className={`font-semibold ${popular ? '' : 'text-[var(--text-1)]'}`}>{plan.name}</h3>
                  <p className={`mt-5 font-display text-4xl ${popular ? '' : 'text-[var(--text-1)]'}`}>
                    ${plan.priceUsd}
                    <span className={`text-base font-sans ${popular ? 'text-[var(--bg-page)]/70' : 'text-[var(--text-3)]'}`}>
                      /mes
                    </span>
                  </p>
                  <ul className={`mt-6 space-y-2 text-sm ${popular ? 'text-[var(--bg-page)]/85' : 'text-[var(--text-2)]'}`}>
                    <li className="flex gap-2">
                      <span className="text-[var(--teal-400)]">✓</span>
                      {plan.agentLimit === 0 ? 'Agentes IA ilimitados' : `${plan.agentLimit} agente(s) IA`}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--teal-400)]">✓</span>
                      {plan.bookingLimit === 0 ? 'Citas ilimitadas' : `${plan.bookingLimit} citas/mes`}
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--teal-400)]">✓</span> Sitio web + widget de voz
                    </li>
                  </ul>
                  <Link
                    href={plan.priceUsd === 0 ? '/signup' : `/signup?plan=${plan.id}`}
                    className={
                      popular
                        ? 'mt-7 block text-center text-sm font-semibold bg-[var(--teal-700)] text-white rounded-full py-3 hover:bg-[var(--teal-800)] transition-colors'
                        : 'mt-7 block text-center text-sm font-semibold border border-[var(--border)] rounded-full py-3 hover:border-[var(--teal-700)]/40 transition-colors'
                    }
                  >
                    {plan.priceUsd === 0 ? 'Empezar' : 'Elegir plan'}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="bg-[var(--teal-700)] rounded-3xl px-7 py-12 sm:px-14 sm:py-16 text-center text-white relative overflow-hidden">
            <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative font-display font-semibold text-3xl sm:text-4xl tracking-tight">
              Atiende más con menos trabajo.
            </h2>
            <p className="relative mt-3 text-white/85 max-w-xl mx-auto">
              Deja que tu agente IA responda, oriente y agende. Tú solo tienes que recibir al paciente.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="text-sm font-semibold bg-white text-[var(--teal-700)] px-6 py-3 rounded-full hover:bg-[var(--bg-page)] transition-colors">
                Empezar gratis
              </Link>
              <a href="#treatments" className="text-sm font-semibold text-white border border-white/40 px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
                Ver tratamientos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-3)]">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-[var(--teal-700)] text-white font-display font-bold">
              E
            </span>
            <span className="font-display font-semibold text-[var(--text-1)]">
              Esteti<span className="text-[var(--teal-700)]">C</span>all
            </span>
          </div>
          <p>© 2026 EstetiCall. Hecho para spas médico-estéticos y clínicas.</p>
          <div className="flex gap-5">
            <a href="#features" className="hover:text-[var(--text-1)] transition-colors">Funciones</a>
            <a href="#pricing" className="hover:text-[var(--text-1)] transition-colors">Precios</a>
            <Link href="/login" className="hover:text-[var(--text-1)] transition-colors">Acceder</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
