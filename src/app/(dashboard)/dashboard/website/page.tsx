import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner, getSubscription } from '@/services/businesses'
import { getWebsiteContentForBusiness } from '@/services/websites'
import { listAgentsForBusiness } from '@/services/aiAgents'
import { WebsiteEditor } from '@/components/WebsiteEditor'

export default async function WebsitePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const business = await getBusinessForOwner(supabase, user!.id)
  if (!business) return null

  const [content, agents, subscription] = await Promise.all([
    getWebsiteContentForBusiness(supabase, business.id),
    listAgentsForBusiness(supabase, business.id),
    getSubscription(supabase, business.id),
  ])

  return (
    <WebsiteEditor
      business={business}
      initialContent={content}
      agents={agents}
      websiteBuilderEnabled={subscription?.website_builder_enabled ?? false}
    />
  )
}
