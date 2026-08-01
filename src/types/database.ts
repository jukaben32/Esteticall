// Hand-maintained mirror of supabase/schema.sql.
// Regenerate with `supabase gen types typescript` once the project is linked;
// keep this file's shape in sync with the SQL until then.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          industry: string
          logo_url: string | null
          phone: string | null
          contact_email: string | null
          address: string | null
          timezone: string
          onboarding_step: 'created' | 'profile' | 'agent' | 'billing' | 'done'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['businesses']['Row']> & {
          owner_id: string
          name: string
          slug: string
        }
        Update: Partial<Database['public']['Tables']['businesses']['Row']>
        Relationships: []
      }
      business_subscriptions: {
        Row: {
          id: string
          business_id: string
          plan: 'free' | 'pro' | 'business'
          status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          website_builder_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['business_subscriptions']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['business_subscriptions']['Row']>
        Relationships: []
      }
      ai_agents: {
        Row: {
          id: string
          business_id: string
          name: string
          specialty: string
          voice: string
          personality: string
          sensitivity: number
          greeting_message: string
          system_prompt: string
          status: 'draft' | 'live' | 'paused'
          calls_handled: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ai_agents']['Row']> & {
          business_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['ai_agents']['Row']>
        Relationships: []
      }
      listings: {
        Row: {
          id: string
          business_id: string
          listing_code: string
          title: string
          description: string | null
          listing_type: 'sale' | 'rent'
          property_type: 'house' | 'apartment' | 'townhouse' | 'commercial' | 'condo' | 'land'
          status: 'available' | 'pending' | 'sold' | 'rented' | 'withdrawn'
          price: number
          bedrooms: number
          bathrooms: number
          area_sqft: number
          parking_spaces: number
          year_built: number | null
          address_line: string | null
          area_name: string | null
          city: string | null
          amenities: string[]
          featured: boolean
          visible_to_ai_agent: boolean
          virtual_tour_url: string | null
          cover_photo_url: string | null
          listed_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['listings']['Row']> & {
          business_id: string
          title: string
        }
        Update: Partial<Database['public']['Tables']['listings']['Row']>
        Relationships: []
      }
      listing_photos: {
        Row: {
          id: string
          listing_id: string
          business_id: string
          url: string
          is_cover: boolean
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['listing_photos']['Row']> & {
          listing_id: string
          business_id: string
          url: string
        }
        Update: Partial<Database['public']['Tables']['listing_photos']['Row']>
        Relationships: []
      }
      agent_listings: {
        Row: {
          agent_id: string
          listing_id: string
          business_id: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['agent_listings']['Row']> & {
          agent_id: string
          listing_id: string
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['agent_listings']['Row']>
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          business_id: string
          auth_user_id: string | null
          name: string
          phone: string | null
          email: string | null
          budget: number | null
          source: 'ai_call' | 'widget_chat' | 'manual' | 'website_form'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['clients']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Row']>
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          agent_id: string | null
          client_id: string | null
          listing_id: string | null
          channel: 'widget_voice' | 'widget_chat' | 'phone'
          status: 'in_progress' | 'completed' | 'failed'
          duration_seconds: number
          outcome: 'booked_viewing' | 'qualified_lead' | 'no_action' | 'escalated' | null
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['conversations']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Row']>
        Relationships: []
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          business_id: string
          role: 'agent' | 'caller' | 'system'
          content: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['conversation_messages']['Row']> & {
          conversation_id: string
          business_id: string
          role: 'agent' | 'caller' | 'system'
          content: string
        }
        Update: Partial<Database['public']['Tables']['conversation_messages']['Row']>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          listing_id: string | null
          client_id: string | null
          conversation_id: string | null
          scheduled_at: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['appointments']['Row']> & {
          business_id: string
          scheduled_at: string
        }
        Update: Partial<Database['public']['Tables']['appointments']['Row']>
        Relationships: []
      }
      business_availability: {
        Row: {
          id: string
          business_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['business_availability']['Row']> & {
          business_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Update: Partial<Database['public']['Tables']['business_availability']['Row']>
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          id: string
          business_id: string
          title: string
          content: string
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['knowledge_documents']['Row']> & {
          business_id: string
          title: string
          content: string
        }
        Update: Partial<Database['public']['Tables']['knowledge_documents']['Row']>
        Relationships: []
      }
      widgets: {
        Row: {
          id: string
          business_id: string
          is_enabled: boolean
          primary_color: string
          greeting_message: string
          allowed_origins: string[]
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['widgets']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['widgets']['Row']>
        Relationships: []
      }
      websites: {
        Row: {
          id: string
          business_id: string
          is_published: boolean
          headline: string | null
          about: string | null
          theme: string
          custom_domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['websites']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['websites']['Row']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          business_id: string
          type: 'new_lead' | 'appointment_booked' | 'appointment_cancelled' | 'subscription' | 'system'
          title: string
          body: string | null
          is_read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & {
          business_id: string
          type: Database['public']['Tables']['notifications']['Row']['type']
          title: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
        Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          subject: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['support_tickets']['Row']> & {
          business_id: string
        }
        Update: Partial<Database['public']['Tables']['support_tickets']['Row']>
        Relationships: []
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          business_id: string
          sender: 'client' | 'business'
          body: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['support_messages']['Row']> & {
          ticket_id: string
          business_id: string
          sender: 'client' | 'business'
          body: string
        }
        Update: Partial<Database['public']['Tables']['support_messages']['Row']>
        Relationships: []
      }
      business_services: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          price: number | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['business_services']['Row']> & {
          business_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['business_services']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
