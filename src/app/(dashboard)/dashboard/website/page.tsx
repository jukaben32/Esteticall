import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { getWebsiteContentForBusiness } from '@/services/websites'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { listServicesForBusiness } from '@/services/businessServices'
import { WebsiteEditor } from '@/components/WebsiteEditor'

export default async function WebsitePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [content, agents, services, subscription] = await Promise.all([
    getWebsiteContentForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
    listServicesForBusiness(supabase, business.id),
    getSubscription(supabase, business.id),
  ])

  return (
    <WebsiteEditor
      business={business}
      initialContent={content}
      agents={agents}
      services={services}
      websiteBuilderEnabled={subscription?.website_builder_enabled ?? false}
    />
  )
}
