import { CalendarDays, MessageCircle, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react'

import { WhatsappManager } from '@/components/WhatsappManager'
import { createClient } from '@/lib/supabase/server'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { getBusinessForOwner } from '@/services/businesses'
import { getWhatsappConnection } from '@/services/whatsapp'

const IMPLEMENTATION_NOTES: Array<{
  icon: LucideIcon
  title: string
  text: string
}> = [
  {
    icon: MessageCircle,
    title: 'Same assistant, new channel',
    text: 'WhatsApp uses the same clinic tools, FAQs and appointment logic as the voice flow.',
  },
  {
    icon: ShieldCheck,
    title: 'Evolution API stays on your VPS',
    text: 'Vercel renders the dashboard, but the WhatsApp gateway must run on a self-hosted Evolution API server.',
  },
  {
    icon: CalendarDays,
    title: 'Bookings stay tracked',
    text: 'Leads and appointments created from WhatsApp are stored with source whatsapp so reporting stays clean.',
  },
  {
    icon: Sparkles,
    title: 'One channel, same knowledge base',
    text: 'The assistant can search listings, FAQs, appointments and payments before replying.',
  },
]

function statusBadgeClass(status?: string | null) {
  if (status === 'connected') return 'bg-[var(--teal-50)] text-[var(--teal-700)]'
  if (status === 'connecting') return 'bg-amber-50 text-amber-700'
  return 'bg-[var(--bg-raised)] text-[var(--text-3)]'
}

export default async function WhatsappPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [connection, agents] = await Promise.all([
    getWhatsappConnection(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="section-label text-[var(--text-4)]">Setup</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">WhatsApp</h1>
        <p className="max-w-3xl text-sm leading-6 text-[var(--text-3)]">
          Connect Evolution API so the same clinic assistant can answer WhatsApp, qualify patients and book
          appointments.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <WhatsappManager initialConnection={connection} agents={agents} />

        <div className="card-surface p-6 lg:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-3)]">
                Implementation notes
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-1)]">
                How WhatsApp fits the clinic stack
              </h2>
            </div>
            <span className={`badge border-transparent ${statusBadgeClass(connection?.status)}`}>
              {connection?.status ?? 'disconnected'}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {IMPLEMENTATION_NOTES.map((note) => {
              const Icon = note.icon
              return (
                <div key={note.title} className="flex gap-3 rounded-[22px] border border-[var(--border)] bg-white/75 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--bg-subtle)] text-[var(--teal-700)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-1)]">{note.title}</div>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-3)]">{note.text}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[var(--bg-raised)] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-3)]">
              Required environment
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-3)]">
              <p>
                <code>EVOLUTION_API_URL</code> and <code>EVOLUTION_API_KEY</code> enable the WhatsApp gateway.
              </p>
              <p>
                <code>OPENAI_API_KEY</code> powers the text assistant that answers and books through WhatsApp.
              </p>
              <p>
                The webhook route is <code>/api/whatsapp/webhook/[businessId]</code> and should be reachable from
                your Evolution API server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
