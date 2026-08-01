import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBusinessForOwner } from '@/services/businesses'
import { getConversationTranscript } from '@/services/conversations'

export async function GET(_request: Request, { params }: { params: { conversationId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const business = await getBusinessForOwner(supabase, user.id)
  if (!business) return NextResponse.json({ error: 'No business for this user' }, { status: 404 })

  // RLS (business_owner policy on conversation_messages) scopes this to rows
  // whose business_id the caller owns, so a foreign conversationId just 404s.
  const messages = await getConversationTranscript(supabase, params.conversationId)
  return NextResponse.json({ messages })
}
