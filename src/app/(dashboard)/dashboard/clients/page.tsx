import { UsersRound, CalendarCheck, CheckCircle2, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listClientsForBusiness } from '@/services/clients'
import { listAppointmentsForBusiness } from '@/services/appointments'
import { listAvailabilityForBusiness } from '@/services/schedule'
import { ClientsTable } from '@/components/ClientsTable'

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [clients, appointments, availability] = await Promise.all([
    listClientsForBusiness(supabase, business.id),
    listAppointmentsForBusiness(supabase, business.id),
    listAvailabilityForBusiness(supabase, business.id),
  ])

  // Not tracked per-appointment yet — approximate with the business's own
  // booking slot length so the viewing history table still shows something
  // meaningful instead of a placeholder.
  const durationMinutes = availability.find((a) => a.is_active)?.slot_minutes ?? 60

  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const totalRevenue = appointments.reduce((sum, appt) => {
    if (appt.payment_status !== 'paid' && appt.payment_status !== 'cash') return sum
    return sum + (appt.service?.price ?? 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl text-[var(--text-1)]">Clientes</h1>
        <p className="text-sm text-[var(--text-3)] mt-1">Perfiles de clientes e historial de visitas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={UsersRound} label="Total de clientes" value={clients.length} />
        <StatCard icon={CalendarCheck} label="Citas totales" value={appointments.length} />
        <StatCard icon={CheckCircle2} label="Citas completadas" value={completedCount} />
        <StatCard icon={DollarSign} label="Ingresos totales" value={`$${totalRevenue.toLocaleString()}`} />
      </div>

      <div className="card-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[var(--teal-50)] text-[var(--teal-700)] grid place-items-center shrink-0">
            <UsersRound className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-display font-semibold text-[var(--text-1)]">Perfiles de clientes</h2>
            <p className="text-sm text-[var(--text-3)]">
              {clients.length} {clients.length === 1 ? 'cliente único' : 'clientes únicos'} · haz clic para ver su
              historial de visitas
            </p>
          </div>
        </div>
        <ClientsTable initialClients={clients} appointments={appointments} durationMinutes={durationMinutes} />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
}) {
  return (
    <div className="stat-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-3)] uppercase tracking-wide">{label}</p>
        <Icon className="w-4 h-4 text-[var(--teal-600)]" />
      </div>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
