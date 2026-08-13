-- ═══════════════════════════════════════════════════════════════════════════
-- Real Estate AI Calling Agent SaaS — Database Schema
-- Postgres / Supabase. Multi-tenant: every domain table hangs off `businesses`.
-- ═══════════════════════════════════════════════════════════════════════════

-- 0. EXTENSIONS & SHARED HELPERS
create extension if not exists pgcrypto;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. BUSINESSES
create table if not exists businesses (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  slug              text not null unique,
  industry          text not null default 'real_estate',
  logo_url          text,
  phone             text,
  contact_email     text,
  address           text,
  timezone          text not null default 'UTC',
  onboarding_step   text not null default 'created'
    check (onboarding_step in ('created','profile','agent','billing','done')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_businesses_owner_id on businesses (owner_id);
create index if not exists idx_businesses_slug on businesses (slug);

drop trigger if exists update_businesses_updated_at on businesses;
create trigger update_businesses_updated_at
  before update on businesses
  for each row execute function update_updated_at_column();

alter table businesses enable row level security;

create or replace function is_business_owner(target_business_id uuid)
returns boolean as $$
  select exists (
    select 1 from businesses
    where id = target_business_id
      and owner_id = auth.uid()
  );
$$ language sql stable security definer;

drop policy if exists "Owners can view their own business" on businesses;
create policy "Owners can view their own business"
  on businesses for select using (owner_id = auth.uid());
drop policy if exists "Owners can update their own business" on businesses;
create policy "Owners can update their own business"
  on businesses for update using (owner_id = auth.uid());
drop policy if exists "Authenticated users can create a business" on businesses;
create policy "Authenticated users can create a business"
  on businesses for insert with check (owner_id = auth.uid());
drop policy if exists "Public can view businesses by slug" on businesses;
create policy "Public can view businesses by slug"
  on businesses for select using (true);

-- 2. BUSINESS SUBSCRIPTIONS (Stripe)
create table if not exists business_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references businesses(id) on delete cascade unique,
  plan                    text not null default 'free'
    check (plan in ('free','pro','business')),
  status                  text not null default 'active'
    check (status in ('active','trialing','past_due','canceled','incomplete')),
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  website_builder_enabled boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_business_subscriptions_business_id on business_subscriptions (business_id);
create index if not exists idx_business_subscriptions_stripe_customer_id on business_subscriptions (stripe_customer_id);

drop trigger if exists update_business_subscriptions_updated_at on business_subscriptions;
create trigger update_business_subscriptions_updated_at
  before update on business_subscriptions
  for each row execute function update_updated_at_column();

alter table business_subscriptions enable row level security;

drop policy if exists "Business owners can view their subscription" on business_subscriptions;
create policy "Business owners can view their subscription"
  on business_subscriptions for select using (is_business_owner(business_id));
drop policy if exists "Business owners can manage their subscription" on business_subscriptions;
create policy "Business owners can manage their subscription"
  on business_subscriptions for all using (is_business_owner(business_id));

-- 3. AI AGENTS
create table if not exists ai_agents (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  specialty         text not null default 'Residential Specialist',
  voice             text not null default 'alloy',
  personality       text not null default 'friendly',
  sensitivity       numeric(3,2) not null default 0.5 check (sensitivity between 0 and 1),
  greeting_message  text not null default 'Hello! Thank you for calling. How can I help you today?',
  system_prompt     text not null default '',
  status            text not null default 'draft'
    check (status in ('draft','live','paused')),
  calls_handled     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_ai_agents_business_id on ai_agents (business_id);

drop trigger if exists update_ai_agents_updated_at on ai_agents;
create trigger update_ai_agents_updated_at
  before update on ai_agents
  for each row execute function update_updated_at_column();

alter table ai_agents enable row level security;

drop policy if exists "Business owners can manage their agents" on ai_agents;
create policy "Business owners can manage their agents"
  on ai_agents for all using (is_business_owner(business_id));
drop policy if exists "Public can view live agents" on ai_agents;
create policy "Public can view live agents"
  on ai_agents for select using (status = 'live');

-- 4. LISTINGS
create table if not exists listings (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references businesses(id) on delete cascade,
  listing_code        text not null unique default ('LST-' || substr(gen_random_uuid()::text, 1, 8)),
  title               text not null,
  description         text,
  listing_type        text not null default 'sale'
    check (listing_type in ('sale','rent')),
  property_type       text not null default 'house'
    check (property_type in ('house','apartment','townhouse','commercial','condo','land')),
  status              text not null default 'available'
    check (status in ('available','pending','sold','rented','withdrawn')),
  price               numeric(14,2) not null default 0,
  bedrooms            integer not null default 0,
  bathrooms           integer not null default 0,
  area_sqft           integer not null default 0,
  parking_spaces      integer not null default 0,
  year_built          integer,
  address_line        text,
  area_name           text,
  city                text,
  amenities           text[] not null default '{}',
  featured            boolean not null default false,
  visible_to_ai_agent boolean not null default true,
  virtual_tour_url    text,
  cover_photo_url     text,
  listed_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_listings_business_id on listings (business_id);
create index if not exists idx_listings_status on listings (status);

drop trigger if exists update_listings_updated_at on listings;
create trigger update_listings_updated_at
  before update on listings
  for each row execute function update_updated_at_column();

alter table listings enable row level security;

drop policy if exists "Business owners can manage their listings" on listings;
create policy "Business owners can manage their listings"
  on listings for all using (is_business_owner(business_id));
drop policy if exists "Public can view available listings" on listings;
create policy "Public can view available listings"
  on listings for select using (status = 'available');

-- 5. LISTING PHOTOS
create table if not exists listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  business_id  uuid not null references businesses(id) on delete cascade,
  url          text not null,
  is_cover     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_listing_photos_listing_id on listing_photos (listing_id);
create index if not exists idx_listing_photos_business_id on listing_photos (business_id);
create unique index if not exists uq_listing_photos_one_cover
  on listing_photos (listing_id) where (is_cover);

alter table listing_photos enable row level security;

drop policy if exists "Business owners can manage their listing photos" on listing_photos;
create policy "Business owners can manage their listing photos"
  on listing_photos for all using (is_business_owner(business_id));
drop policy if exists "Public can view photos of available listings" on listing_photos;
create policy "Public can view photos of available listings"
  on listing_photos for select using (
    exists (select 1 from listings l where l.id = listing_id and l.status = 'available')
  );

-- 6. AGENT LISTINGS (join: which AI agent(s) can talk about which listings)
create table if not exists agent_listings (
  agent_id     uuid not null references ai_agents(id) on delete cascade,
  listing_id   uuid not null references listings(id) on delete cascade,
  business_id  uuid not null references businesses(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (agent_id, listing_id)
);

create index if not exists idx_agent_listings_business_id on agent_listings (business_id);
create index if not exists idx_agent_listings_listing_id on agent_listings (listing_id);

alter table agent_listings enable row level security;

drop policy if exists "Business owners can manage agent-listing links" on agent_listings;
create policy "Business owners can manage agent-listing links"
  on agent_listings for all using (is_business_owner(business_id));

-- 7. CLIENTS (leads / customers — may or may not have a portal login)
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  auth_user_id  uuid references auth.users(id) on delete set null,
  name          text not null default 'Unknown',
  phone         text,
  email         text,
  budget        numeric(14,2),
  source        text not null default 'ai_call'
    check (source in ('ai_call','widget_chat','manual','website_form')),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_clients_business_id on clients (business_id);
create index if not exists idx_clients_auth_user_id on clients (auth_user_id);
create index if not exists idx_clients_phone on clients (phone);

drop trigger if exists update_clients_updated_at on clients;
create trigger update_clients_updated_at
  before update on clients
  for each row execute function update_updated_at_column();

alter table clients enable row level security;

drop policy if exists "Business owners can manage their clients" on clients;
create policy "Business owners can manage their clients"
  on clients for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own record" on clients;
create policy "Clients can view their own record"
  on clients for select using (auth.uid() = auth_user_id);

-- 8. CONVERSATIONS (call log — one row per AI voice/chat session)
create table if not exists conversations (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  agent_id           uuid references ai_agents(id) on delete set null,
  client_id          uuid references clients(id) on delete set null,
  listing_id         uuid references listings(id) on delete set null,
  channel            text not null default 'widget_voice'
    check (channel in ('widget_voice','widget_chat','phone')),
  status             text not null default 'in_progress'
    check (status in ('in_progress','completed','failed')),
  duration_seconds   integer not null default 0,
  outcome            text
    check (outcome is null or outcome in ('booked_viewing','qualified_lead','no_action','escalated')),
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists idx_conversations_business_id on conversations (business_id);
create index if not exists idx_conversations_agent_id on conversations (agent_id);
create index if not exists idx_conversations_started_at on conversations (started_at);

alter table conversations enable row level security;

drop policy if exists "Business owners can view their conversations" on conversations;
create policy "Business owners can view their conversations"
  on conversations for select using (is_business_owner(business_id));
drop policy if exists "Service role can manage conversations" on conversations;
create policy "Service role can manage conversations"
  on conversations for all using (auth.role() = 'service_role');

-- 9. CONVERSATION MESSAGES (transcript turns)
create table if not exists conversation_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  business_id      uuid not null references businesses(id) on delete cascade,
  role             text not null check (role in ('agent','caller','system')),
  content          text not null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_conversation_messages_conversation_id on conversation_messages (conversation_id);
create index if not exists idx_conversation_messages_business_id on conversation_messages (business_id);

alter table conversation_messages enable row level security;

drop policy if exists "Business owners can view their conversation messages" on conversation_messages;
create policy "Business owners can view their conversation messages"
  on conversation_messages for select using (is_business_owner(business_id));
drop policy if exists "Service role can manage conversation messages" on conversation_messages;
create policy "Service role can manage conversation messages"
  on conversation_messages for all using (auth.role() = 'service_role');

-- 9a. AI USAGE EVENTS (chat_completion + realtime_voice cost tracking, feeds the Analytics "AI API Spend" indicator)
create table if not exists ai_usage_events (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  conversation_id  uuid references conversations(id) on delete set null,
  kind             text not null check (kind in ('chat_completion','realtime_voice')),
  input_tokens     integer,
  output_tokens    integer,
  duration_seconds integer,
  cost_usd         numeric(10,6) not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists idx_ai_usage_events_business_id on ai_usage_events (business_id);
create index if not exists idx_ai_usage_events_created_at on ai_usage_events (created_at);

alter table ai_usage_events enable row level security;

drop policy if exists "Business owners can view their ai usage events" on ai_usage_events;
create policy "Business owners can view their ai usage events"
  on ai_usage_events for select using (is_business_owner(business_id));
drop policy if exists "Service role can manage ai usage events" on ai_usage_events;
create policy "Service role can manage ai usage events"
  on ai_usage_events for all using (auth.role() = 'service_role');

-- 10. APPOINTMENTS (viewings)
create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  listing_id      uuid references listings(id) on delete set null,
  client_id       uuid references clients(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  scheduled_at    timestamptz not null,
  status          text not null default 'scheduled'
    check (status in ('scheduled','pending_confirmation','completed','cancelled','no_show')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_appointments_business_id on appointments (business_id);
create index if not exists idx_appointments_scheduled_at on appointments (scheduled_at);
create index if not exists idx_appointments_client_id on appointments (client_id);

drop trigger if exists update_appointments_updated_at on appointments;
create trigger update_appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at_column();

alter table appointments enable row level security;

drop policy if exists "Business owners can manage their appointments" on appointments;
create policy "Business owners can manage their appointments"
  on appointments for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own appointments" on appointments;
create policy "Clients can view their own appointments"
  on appointments for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

-- 11. AVAILABILITY (weekly working hours the AI checks before offering a slot)
create table if not exists business_availability (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  day_of_week   integer not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time    time not null,
  end_time      time not null,
  slot_minutes  integer not null default 30,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (business_id, day_of_week)
);

create index if not exists idx_business_availability_business_id on business_availability (business_id);

alter table business_availability enable row level security;

drop policy if exists "Business owners can manage their availability" on business_availability;
create policy "Business owners can manage their availability"
  on business_availability for all using (is_business_owner(business_id));
drop policy if exists "Public can view active availability" on business_availability;
create policy "Public can view active availability"
  on business_availability for select using (is_active);

-- 12. KNOWLEDGE BASE (documents the AI agent can ground answers in)
create table if not exists knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  title         text not null,
  content       text not null,
  source_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_business_id on knowledge_documents (business_id);

drop trigger if exists update_knowledge_documents_updated_at on knowledge_documents;
create trigger update_knowledge_documents_updated_at
  before update on knowledge_documents
  for each row execute function update_updated_at_column();

alter table knowledge_documents enable row level security;

drop policy if exists "Business owners can manage their knowledge base" on knowledge_documents;
create policy "Business owners can manage their knowledge base"
  on knowledge_documents for all using (is_business_owner(business_id));

-- 13. WIDGETS (embeddable voice/chat widget configuration)
create table if not exists widgets (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade unique,
  is_enabled       boolean not null default true,
  primary_color    text not null default '#2563eb',
  greeting_message text not null default 'Hi! Ask me about any of our listings.',
  allowed_origins  text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_widgets_business_id on widgets (business_id);

drop trigger if exists update_widgets_updated_at on widgets;
create trigger update_widgets_updated_at
  before update on widgets
  for each row execute function update_updated_at_column();

alter table widgets enable row level security;

drop policy if exists "Business owners can manage their widget" on widgets;
create policy "Business owners can manage their widget"
  on widgets for all using (is_business_owner(business_id));
drop policy if exists "Public can view enabled widget config" on widgets;
create policy "Public can view enabled widget config"
  on widgets for select using (is_enabled);

-- 14. WEBSITES (site-builder config rendered at /sites/[slug])
create table if not exists websites (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade unique,
  is_published  boolean not null default false,
  headline      text,
  about         text,
  theme         text not null default 'light',
  custom_domain text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_websites_business_id on websites (business_id);
create index if not exists idx_websites_custom_domain on websites (custom_domain);

drop trigger if exists update_websites_updated_at on websites;
create trigger update_websites_updated_at
  before update on websites
  for each row execute function update_updated_at_column();

alter table websites enable row level security;

drop policy if exists "Business owners can manage their website" on websites;
create policy "Business owners can manage their website"
  on websites for all using (is_business_owner(business_id));
drop policy if exists "Public can view published websites" on websites;
create policy "Public can view published websites"
  on websites for select using (is_published);

-- 15. NOTIFICATIONS
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  type         text not null
    check (type in ('new_lead','appointment_booked','appointment_cancelled','subscription','system')),
  title        text not null,
  body         text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists idx_notifications_business_id on notifications (business_id);
create index if not exists idx_notifications_is_read on notifications (is_read);

alter table notifications enable row level security;

drop policy if exists "Business owners can manage their notifications" on notifications;
create policy "Business owners can manage their notifications"
  on notifications for all using (is_business_owner(business_id));

-- 16. SUPPORT TICKETS
create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  client_id    uuid references clients(id) on delete set null,
  subject      text not null default 'Support Request',
  status       text not null default 'open'
    check (status in ('open','in_progress','resolved','closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_support_tickets_business_id on support_tickets (business_id);
create index if not exists idx_support_tickets_client_id on support_tickets (client_id);

drop trigger if exists update_support_tickets_updated_at on support_tickets;
create trigger update_support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at_column();

alter table support_tickets enable row level security;

drop policy if exists "Clients can view their own tickets" on support_tickets;
create policy "Clients can view their own tickets"
  on support_tickets for select using (auth.uid() = client_id);
drop policy if exists "Clients can create tickets" on support_tickets;
create policy "Clients can create tickets"
  on support_tickets for insert with check (auth.uid() = client_id);
drop policy if exists "Business owners can manage all tickets" on support_tickets;
create policy "Business owners can manage all tickets"
  on support_tickets for all using (is_business_owner(business_id));

-- 17. SUPPORT MESSAGES
create table if not exists support_messages (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references support_tickets(id) on delete cascade,
  business_id  uuid not null references businesses(id) on delete cascade,
  sender       text not null check (sender in ('client','business')),
  body         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket_id on support_messages (ticket_id);
create index if not exists idx_support_messages_business_id on support_messages (business_id);

alter table support_messages enable row level security;

drop policy if exists "Clients can view messages on their own tickets" on support_messages;
create policy "Clients can view messages on their own tickets"
  on support_messages for select using (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.client_id = auth.uid()
    )
  );
drop policy if exists "Clients can send messages on their own tickets" on support_messages;
create policy "Clients can send messages on their own tickets"
  on support_messages for insert with check (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.client_id = auth.uid()
    )
  );
drop policy if exists "Business owners can manage all support messages" on support_messages;
create policy "Business owners can manage all support messages"
  on support_messages for all using (is_business_owner(business_id));

-- 18. BUSINESS SERVICES (the offerings a business's AI agents can quote —
-- e.g. "Property Viewing", "Investment Consultation" — decoupled from
-- listings so this works for non-real-estate verticals too)
create table if not exists business_services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(14,2),
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_business_services_business_id on business_services (business_id);

drop trigger if exists update_business_services_updated_at on business_services;
create trigger update_business_services_updated_at
  before update on business_services
  for each row execute function update_updated_at_column();

alter table business_services enable row level security;

drop policy if exists "Business owners can manage their services" on business_services;
create policy "Business owners can manage their services"
  on business_services for all using (is_business_owner(business_id));
drop policy if exists "Public can view active services" on business_services;
create policy "Public can view active services"
  on business_services for select using (is_active);

-- 19. LISTINGS — state/zip + price display (additive, matches the reference
-- template's full address block and "Price Display" field on the edit form)
alter table listings add column if not exists state text;
alter table listings add column if not exists zip text;
alter table listings add column if not exists price_display text not null default 'fixed'
  check (price_display in ('fixed', 'negotiable', 'starting_at', 'contact'));

-- 20. LISTINGS — vacation rentals (day/week/month, common for tourist-zone
-- Airbnb-style properties in the DR) + CONVERSATIONS — sentiment, derived
-- from the transcript once a call ends (see src/services/sentiment.ts).
-- property_type already included 'land' (solares) from the start.
alter table listings drop constraint if exists listings_listing_type_check;
alter table listings add constraint listings_listing_type_check
  check (listing_type in ('sale', 'rent', 'vacation_rental'));
alter table listings add column if not exists rental_period text
  check (rental_period in ('night', 'week', 'month'));
alter table conversations add column if not exists sentiment text
  check (sentiment in ('positive', 'neutral', 'negative'));

-- 21. APPOINTMENTS — reschedule/cancellation/payment tracking columns.
-- These already existed on the live project (added out-of-band before this
-- file tracked them) except for service_id; documenting them here so
-- schema.sql stops drifting from reality. clients.pre_approval_number backs
-- the "Pre-Approval #" field on the manual "New Viewing" form.
alter table appointments add column if not exists rescheduled_from timestamptz;
alter table appointments add column if not exists requested_scheduled_at timestamptz;
alter table appointments add column if not exists reschedule_requested_at timestamptz;
alter table appointments add column if not exists confirmed_by_agent_at timestamptz;
alter table appointments add column if not exists cancelled_at timestamptz;
alter table appointments add column if not exists cancellation_reason text;
alter table appointments add column if not exists cancelled_by text
  check (cancelled_by is null or cancelled_by in ('client', 'business', 'system'));
alter table appointments add column if not exists payment_status text not null default 'not_required'
  check (payment_status in ('not_required', 'pending', 'paid', 'cash', 'refunded'));
alter table appointments add column if not exists payment_amount numeric(14,2);
alter table appointments add column if not exists payment_currency text not null default 'usd';
alter table appointments add column if not exists stripe_checkout_session_id text;
alter table appointments add column if not exists stripe_payment_intent_id text;
alter table appointments add column if not exists paid_at timestamptz;
alter table appointments add column if not exists reminder_sent_at timestamptz;
alter table appointments add column if not exists service_id uuid
  references business_services(id) on delete set null;

alter table clients add column if not exists pre_approval_number text;

-- 22. AI AGENTS — language field (matches the reference template's "Language"
-- field on the agent settings form) + AGENT SERVICES (join table: which
-- services each individual agent is scoped to discuss — different from
-- agent_listings, which scopes listings. Mirrors that same additive pattern.)
alter table ai_agents add column if not exists language text not null default 'en';

create table if not exists agent_services (
  agent_id     uuid not null references ai_agents(id) on delete cascade,
  service_id   uuid not null references business_services(id) on delete cascade,
  business_id  uuid not null references businesses(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (agent_id, service_id)
);

create index if not exists idx_agent_services_business_id on agent_services (business_id);
create index if not exists idx_agent_services_service_id on agent_services (service_id);

alter table agent_services enable row level security;

drop policy if exists "Business owners can manage agent-service links" on agent_services;
create policy "Business owners can manage agent-service links"
  on agent_services for all using (is_business_owner(business_id));

-- 23. BUSINESS SERVICES — duration, price type, and catalog tracking (matches
-- the reference template's "Duration (minutes)" + "Price Type" fields on the
-- service form, and its pre-built 32-service catalog across 8 specialties).
-- catalog_key links a created service back to the static catalog entry it
-- came from (src/constants/index.ts CATALOG_SERVICES) so the gallery can show
-- "Added to your catalog" instead of creating duplicates.
-- price_type has 4 options, matching the reference template's "Price Type"
-- dropdown: fixed, starting_at, price_range (uses price + price_max), and
-- call_for_price (price/price_max stay null; UI shows "Call for Price").
alter table business_services add column if not exists duration_minutes integer not null default 60;
alter table business_services add column if not exists price_type text not null default 'fixed'
  check (price_type in ('fixed', 'starting_at', 'price_range', 'call_for_price'));
alter table business_services add column if not exists price_max numeric;
alter table business_services add column if not exists catalog_key text;

create index if not exists idx_business_services_catalog_key on business_services (business_id, catalog_key);

-- 24. KNOWLEDGE BASE — category + catalog tracking (matches the reference
-- template's FAQ category tags and its pre-built 40-question FAQ library
-- across 9 topics). catalog_key links a document back to the static
-- template it came from (src/data/faqTemplates.ts) so the library can show
-- "Ya está en tu base de conocimiento" instead of creating duplicates.
alter table knowledge_documents add column if not exists category text;
alter table knowledge_documents add column if not exists catalog_key text;
alter table knowledge_documents add column if not exists is_active boolean not null default true;

create index if not exists idx_knowledge_documents_catalog_key on knowledge_documents (business_id, catalog_key);
create index if not exists idx_knowledge_documents_active on knowledge_documents (business_id, is_active);

-- 25. WEBSITES — full site-builder rebuild (matches the reference template's
-- Website Builder: template picker, primary/secondary color, font, AI agent
-- assignment, branding, hero section stats/CTAs, footer, and a website-level
-- contact block distinct from the business's internal phone/email/address).
-- "Site URL" itself is NOT duplicated here — it's businesses.slug, already
-- unique and already what /sites/[slug] routes on.
alter table websites add column if not exists template text not null default 'clarity'
  check (template in ('clarity', 'pulse', 'serenity'));
alter table websites add column if not exists primary_color text not null default '#166534';
alter table websites add column if not exists secondary_color text not null default '#16a34a';
alter table websites add column if not exists font text not null default 'inter'
  check (font in ('inter', 'playfair', 'poppins'));
alter table websites add column if not exists ai_agent_id uuid references ai_agents(id) on delete set null;

-- Branding
alter table websites add column if not exists logo_url text;
alter table websites add column if not exists site_title text;
alter table websites add column if not exists site_description text;

-- Hero section (reuses existing `headline` as the hero headline; `about` as
-- the About Section body — both already existed, so not duplicated).
alter table websites add column if not exists hero_subheadline text;
alter table websites add column if not exists hero_image_url text;
alter table websites add column if not exists cta_primary_text text not null default 'Book a Viewing';
alter table websites add column if not exists cta_secondary_text text not null default 'Call Now';
alter table websites add column if not exists years_experience integer;
alter table websites add column if not exists clients_served integer;
alter table websites add column if not exists satisfaction_pct integer;
alter table websites add column if not exists about_title text not null default 'About Us';

-- Services featured on the public site — references the business's own
-- catalog (business_services, already built in Dashboard → Services)
-- instead of duplicating service data on the website.
alter table websites add column if not exists featured_service_ids uuid[] not null default '{}';

-- Footer
alter table websites add column if not exists footer_tagline text;
alter table websites add column if not exists footer_copyright text;

-- Website-level contact block (independent of businesses.phone/contact_email
-- so the public site can show different copy than internal records).
alter table websites add column if not exists contact_phone text;
alter table websites add column if not exists contact_email text;
alter table websites add column if not exists contact_address text;
alter table websites add column if not exists contact_hours text;
alter table websites add column if not exists contact_maps_url text;

-- Social media links — shown as brand icons in the site footer.
alter table websites add column if not exists social_youtube text;
alter table websites add column if not exists social_facebook text;
alter table websites add column if not exists social_instagram text;
alter table websites add column if not exists social_tiktok text;
alter table websites add column if not exists social_linkedin text;
alter table websites add column if not exists social_pinterest text;
alter table websites add column if not exists social_twitter text;

-- 25a. WEBSITE SUBSCRIBERS — contact-form leads (and any other opt-in
-- source) captured from the public site. Always written through the admin
-- client from /api/website/subscribe since visitors have no Supabase
-- session, so there's no public insert policy here — only a read policy
-- for the business owner.
create table if not exists website_subscribers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email       text not null,
  name        text,
  phone       text,
  message     text,
  source      text not null default 'website',
  created_at  timestamptz not null default now()
);
create index if not exists idx_website_subscribers_business_id on website_subscribers (business_id);
create index if not exists idx_website_subscribers_email on website_subscribers (email);
alter table website_subscribers enable row level security;
drop policy if exists "Business owners can view their website subscribers" on website_subscribers;
create policy "Business owners can view their website subscribers"
  on website_subscribers for select using (is_business_owner(business_id));

-- 26. WEBSITE TEAM MEMBERS (matches the reference template's "Team Members"
-- content section: Name, Role/Title, Bio, Photo, reorderable, Add/Remove).
create table if not exists website_team_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null default '',
  role        text not null default '',
  bio         text,
  photo_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_website_team_members_business_id on website_team_members (business_id);
drop trigger if exists update_website_team_members_updated_at on website_team_members;
create trigger update_website_team_members_updated_at
  before update on website_team_members
  for each row execute function update_updated_at_column();
alter table website_team_members enable row level security;
drop policy if exists "Business owners can manage their team members" on website_team_members;
create policy "Business owners can manage their team members"
  on website_team_members for all using (is_business_owner(business_id));
drop policy if exists "Public can view team members of published websites" on website_team_members;
create policy "Public can view team members of published websites"
  on website_team_members for select using (
    exists (select 1 from websites where websites.business_id = website_team_members.business_id and websites.is_published)
  );

-- 27. WEBSITE TESTIMONIALS
create table if not exists website_testimonials (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  quote       text not null default '',
  author_name text not null default '',
  author_role text,
  rating      integer not null default 5 check (rating between 1 and 5),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_website_testimonials_business_id on website_testimonials (business_id);
drop trigger if exists update_website_testimonials_updated_at on website_testimonials;
create trigger update_website_testimonials_updated_at
  before update on website_testimonials
  for each row execute function update_updated_at_column();
alter table website_testimonials enable row level security;
drop policy if exists "Business owners can manage their testimonials" on website_testimonials;
create policy "Business owners can manage their testimonials"
  on website_testimonials for all using (is_business_owner(business_id));
drop policy if exists "Public can view testimonials of published websites" on website_testimonials;
create policy "Public can view testimonials of published websites"
  on website_testimonials for select using (
    exists (select 1 from websites where websites.business_id = website_testimonials.business_id and websites.is_published)
  );

-- 28. WEBSITE SPECIALTIES — the reference template calls this panel
-- "Partners & Lenders" but the items it holds (Residential Sales, Commercial
-- Leasing, Property Management...) and its "+ Add Insurance" button are
-- generic template leftovers; what it actually powers on the public site is
-- the "Our Specialties" / "What We Offer" grid — named accordingly here.
create table if not exists website_specialties (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  label       text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_website_specialties_business_id on website_specialties (business_id);
alter table website_specialties enable row level security;
drop policy if exists "Business owners can manage their specialties" on website_specialties;
create policy "Business owners can manage their specialties"
  on website_specialties for all using (is_business_owner(business_id));
drop policy if exists "Public can view specialties of published websites" on website_specialties;
create policy "Public can view specialties of published websites"
  on website_specialties for select using (
    exists (select 1 from websites where websites.business_id = website_specialties.business_id and websites.is_published)
  );

-- 29. WEBSITE FAQS
create table if not exists website_faqs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  question    text not null default '',
  answer      text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_website_faqs_business_id on website_faqs (business_id);
alter table website_faqs enable row level security;
drop policy if exists "Business owners can manage their website FAQs" on website_faqs;
create policy "Business owners can manage their website FAQs"
  on website_faqs for all using (is_business_owner(business_id));
drop policy if exists "Public can view FAQs of published websites" on website_faqs;
create policy "Public can view FAQs of published websites"
  on website_faqs for select using (
    exists (select 1 from websites where websites.business_id = website_faqs.business_id and websites.is_published)
  );


-- 30. BUSINESSES — website + split city/state/zip (matches the reference
-- template's Business Profile form, where "address" is broken into Street
-- Address / City / State / ZIP Code) + appointment-payment Stripe keys
-- (matches the reference template's Settings → Stripe Payments tab: the
-- business's OWN Stripe account, used so their clients can pay viewing fees
-- online — separate from business_subscriptions.stripe_customer_id, which is
-- the platform owner's Stripe account billing this business for its plan).
alter table businesses add column if not exists website text;
alter table businesses add column if not exists city text;
alter table businesses add column if not exists state text;
alter table businesses add column if not exists zip_code text;
alter table businesses add column if not exists stripe_publishable_key text;
alter table businesses add column if not exists stripe_secret_key text;
alter table businesses add column if not exists stripe_connected boolean not null default false;

-- 31. LISTINGS — property_type: add 'industrial' (naves industriales) and
-- 'other' (catch-all) to the existing house/apartment/townhouse/commercial/
-- condo/land set.
alter table listings drop constraint if exists listings_property_type_check;
alter table listings add constraint listings_property_type_check
  check (property_type in ('house', 'apartment', 'townhouse', 'commercial', 'condo', 'land', 'industrial', 'other'));

-- 32. BUSINESS_AVAILABILITY — slot_minutes must be positive. A zero (or
-- negative) value sent getAvailableSlots() into an infinite loop — the
-- request would just hang until the serverless function timed out, which
-- the AI voice agent surfaced to callers as "technical problem checking
-- availability". The application code now guards against it too, but this
-- closes the gap at the source.
alter table business_availability drop constraint if exists business_availability_slot_minutes_check;
alter table business_availability add constraint business_availability_slot_minutes_check
  check (slot_minutes > 0);

-- 33. WEBSITES — About Section: Story is a second, optional paragraph
-- (Mission stays required-ish via the existing `about` column); About Photo
-- is an uploaded image instead of the old placeholder icon; Trust Badges
-- were previously a hardcoded, unchangeable list in the renderer — they're
-- now a per-business array, seeded with the old hardcoded values so existing
-- published sites render identically until an owner edits them.
alter table websites add column if not exists about_story text;
alter table websites add column if not exists about_photo_url text;
alter table websites add column if not exists trust_badges text[] not null default array[
  'Licensed Real Estate Agents',
  'Accepting New Clients',
  'Virtual Viewings Available',
  'Free Market Analysis'
];

-- 34. WEBSITE SERVICES — the Website Builder's own Services list (icon,
-- name, description, duration, price), authored directly in the builder
-- like Team Members / Testimonials / FAQ. Replaces the old "pick from your
-- actual business_services" checkbox picker (websites.featured_service_ids,
-- left in place but no longer read/written) — the reference template's
-- Services section is independent marketing copy, not tied to the services
-- actually bookable through the AI agent.
create table if not exists website_services (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  icon        text not null default 'home',
  name        text not null default '',
  description text,
  duration    text,
  price       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_website_services_business_id on website_services (business_id);
drop trigger if exists update_website_services_updated_at on website_services;
create trigger update_website_services_updated_at
  before update on website_services
  for each row execute function update_updated_at_column();
alter table website_services enable row level security;
drop policy if exists "Business owners can manage their website services" on website_services;
create policy "Business owners can manage their website services"
  on website_services for all using (is_business_owner(business_id));
drop policy if exists "Public can view services of published websites" on website_services;
create policy "Public can view services of published websites"
  on website_services for select using (
    exists (select 1 from websites where websites.business_id = website_services.business_id and websites.is_published)
  );

-- 35. SUPPORT TICKETS/MESSAGES — RLS bug fix. The original client policies
-- compared auth.uid() directly to client_id, but client_id is a foreign key
-- to clients.id (the row's own primary key), not to clients.auth_user_id —
-- those are different values, so the check could never pass and no client
-- could ever read or create their own tickets. Match the lookup pattern
-- already used correctly by the appointments/clients policies.
drop policy if exists "Clients can view their own tickets" on support_tickets;
create policy "Clients can view their own tickets"
  on support_tickets for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );
drop policy if exists "Clients can create tickets" on support_tickets;
create policy "Clients can create tickets"
  on support_tickets for insert with check (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

drop policy if exists "Clients can view messages on their own tickets" on support_messages;
create policy "Clients can view messages on their own tickets"
  on support_messages for select using (
    exists (
      select 1 from support_tickets t
      join clients c on c.id = t.client_id
      where t.id = ticket_id and c.auth_user_id = auth.uid()
    )
  );
drop policy if exists "Clients can send messages on their own tickets" on support_messages;
create policy "Clients can send messages on their own tickets"
  on support_messages for insert with check (
    exists (
      select 1 from support_tickets t
      join clients c on c.id = t.client_id
      where t.id = ticket_id and c.auth_user_id = auth.uid()
    )
  );

-- 36. PLATFORM KNOWLEDGE + WHATSAPP (Evolution API) — recovered from an
-- orphaned branch (claude/new-user-home-page-0xjc4d, 4 ago 2026) that never
-- got merged to main; ported here on 8 ago 2026 reconciled with everything
-- built on main since (Client Portal, idempotent schema, etc).
--
-- Platform knowledge: country/market-level facts shared by every business on
-- InmobilIACall (CONFOTUR/Ley 158-01, Ley 108-05) — as opposed to
-- knowledge_documents, which is each business's own private FAQ/policy
-- content. No business_id: one row here is read by every AI agent's system
-- prompt, in every business, without needing to be copied into each
-- tenant's own knowledge_documents. Managed from /admin/knowledge, gated by
-- PLATFORM_ADMIN_EMAILS (src/lib/platformAdmin.ts).
create table if not exists platform_knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  content       text not null,
  category      text,
  source_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists update_platform_knowledge_documents_updated_at on platform_knowledge_documents;
create trigger update_platform_knowledge_documents_updated_at
  before update on platform_knowledge_documents
  for each row execute function update_updated_at_column();

alter table platform_knowledge_documents enable row level security;

-- Non-sensitive, published market knowledge — safe for every business (and
-- the public-facing AI agent) to read. Writes happen via the service role
-- only (see /api/admin/knowledge), since RLS here only grants public SELECT.
drop policy if exists "Anyone can view platform knowledge" on platform_knowledge_documents;
create policy "Anyone can view platform knowledge"
  on platform_knowledge_documents for select using (true);

-- WhatsApp: adds 'whatsapp' as a channel/source value so Call Log,
-- Analytics, and Clients — which already read from
-- conversations/conversation_messages/clients without filtering by channel —
-- work for WhatsApp automatically, exactly like they did for the widget.
alter table conversations drop constraint if exists conversations_channel_check;
alter table conversations add constraint conversations_channel_check
  check (channel in ('widget_voice','widget_chat','phone','whatsapp'));

alter table clients drop constraint if exists clients_source_check;
alter table clients add constraint clients_source_check
  check (source in ('ai_call','widget_chat','manual','website_form','whatsapp'));

-- One WhatsApp connection per business (own number, own instance on the
-- Evolution API server). instance_token is the per-instance token Evolution
-- API issues on creation — separate from the global EVOLUTION_API_KEY, which
-- only manages instance lifecycle (create/delete), never sends messages.
create table if not exists whatsapp_connections (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade unique,
  agent_id        uuid references ai_agents(id) on delete set null,
  provider        text not null default 'evolution' check (provider in ('evolution')),
  instance_name   text not null unique,
  instance_token  text,
  phone_number    text,
  status          text not null default 'disconnected'
    check (status in ('disconnected','connecting','connected')),
  is_enabled      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_whatsapp_connections_business_id on whatsapp_connections (business_id);

drop trigger if exists update_whatsapp_connections_updated_at on whatsapp_connections;
create trigger update_whatsapp_connections_updated_at
  before update on whatsapp_connections
  for each row execute function update_updated_at_column();

alter table whatsapp_connections enable row level security;

drop policy if exists "Business owners can manage their whatsapp connection" on whatsapp_connections;
create policy "Business owners can manage their whatsapp connection"
  on whatsapp_connections for all using (is_business_owner(business_id));

-- 37. LISTINGS — Dominican Republic market fields (roadmap Fase 2):
-- currency (most RD inventory is quoted in USD, not always DOP — price
-- alone was ambiguous), confotur_eligible (Ley 158-01 tax exemption, a real
-- closing argument the AI agent should be able to mention), delivery_date
-- (expected completion date for pre-construction / off-plan projects,
-- common in the RD market).
alter table listings add column if not exists currency text not null default 'USD';
alter table listings drop constraint if exists listings_currency_check;
alter table listings add constraint listings_currency_check check (currency in ('USD', 'DOP'));
alter table listings add column if not exists confotur_eligible boolean not null default false;
alter table listings add column if not exists delivery_date date;
