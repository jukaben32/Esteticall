import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { listPreventaProjectsForBusiness } from '@/services/preventaProjects'
import { ProjectsTable } from '@/components/ProjectsTable'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const projects = await listPreventaProjectsForBusiness(supabase, business.id)

  const active = projects.filter((p) => p.status === 'active').length
  const soldOut = projects.filter((p) => p.status === 'sold_out').length
  const totalUnitTypes = projects.reduce((sum, p) => sum + p.unitTypes.length, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total de proyectos" value={projects.length} />
        <StatCard label="Activos" value={active} />
        <StatCard label="Agotados" value={soldOut} />
        <StatCard label="Tipos de unidad" value={totalUnitTypes} />
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-semibold text-xl text-[var(--text-1)]">Proyectos en Preventa</h1>
            <p className="text-sm text-[var(--text-3)]">
              {projects.length} proyectos · {projects.filter((p) => p.featured).length} destacados
            </p>
          </div>
        </div>
        <ProjectsTable initialProjects={projects} />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card p-4">
      <p className="text-xs text-[var(--text-3)]">{label}</p>
      <p className="font-display text-2xl font-semibold mt-1 text-[var(--teal-700)]">{value}</p>
    </div>
  )
}
