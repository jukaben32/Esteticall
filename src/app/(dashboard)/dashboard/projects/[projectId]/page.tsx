import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getPreventaProjectById } from '@/services/preventaProjects'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { ProjectDetailView } from '@/components/ProjectDetailView'

export default async function ProjectDetailPage(props: { params: Promise<{ projectId: string }> }) {
  const params = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [project, agents] = await Promise.all([
    getPreventaProjectById(supabase, business.id, params.projectId),
    listAgentsForBusiness(supabase, business.id),
  ])

  if (!project) notFound()

  return <ProjectDetailView initialProject={project} agents={agents} />
}
