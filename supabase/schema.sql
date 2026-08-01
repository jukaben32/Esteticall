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

create policy "Owners can view their own business"
  on businesses for select using (owner_id = auth.uid());
create policy "Owners can update their own business"
  on businesses for update using (owner_id = auth.uid());
create policy "Authenticated users can create a business"
  on businesses for insert with check (owner_id = auth.uid());
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

create trigger update_business_subscriptions_updated_at
  before update on business_subscriptions
  for each row execute function update_updated_at_column();

alter table business_subscriptions enable row level security;

create policy "Business owners can view their subscription"
  on business_subscriptions for select using (is_business_owner(business_id));
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

create trigger update_ai_agents_updated_at
  before update on ai_agents
  for each row execute function update_updated_at_column();

alter table ai_agents enable row level security;

create policy "Business owners can manage their agents"
  on ai_agents for all using (is_business_owner(business_id));
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

create trigger update_listings_updated_at
  before update on listings
  for each row execute function update_updated_at_column();

alter table listings enable row level security;

create policy "Business owners can manage their listings"
  on listings for all using (is_business_owner(business_id));
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

create policy "Business owners can manage their listing photos"
  on listing_photos for all using (is_business_owner(business_id));
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

create trigger update_clients_updated_at
  before update on clients
  for each row execute function update_updated_at_column();

alter table clients enable row level security;

create policy "Business owners can manage their clients"
  on clients for all using (is_business_owner(business_id));
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

create policy "Business owners can view their conversations"
  on conversations for select using (is_business_owner(business_id));
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

create policy "Business owners can view their conversation messages"
  on conversation_messages for select using (is_business_owner(business_id));
create policy "Service role can manage conversation messages"
  on conversation_messages for all using (auth.role() = 'service_role');

-- 10. APPOINTMENTS (viewings)
create table if not exists appointments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  listing_id      uuid references listings(id) on delete set null,
  client_id       uuid references clients(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  scheduled_at    timestamptz not null,
  status          text not null default 'scheduled'
    check (status in ('scheduled','completed','cancelled','no_show')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_appointments_business_id on appointments (business_id);
create index if not exists idx_appointments_scheduled_at on appointments (scheduled_at);
create index if not exists idx_appointments_client_id on appointments (client_id);

create trigger update_appointments_updated_at
  before update on appointments
  for each row execute function update_updated_at_column();

alter table appointments enable row level security;

create policy "Business owners can manage their appointments"
  on appointments for all using (is_business_owner(business_id));
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

create policy "Business owners can manage their availability"
  on business_availability for all using (is_business_owner(business_id));
create policy "Public can view active availability"
  on business_availability for select using (is_active);

-- 12. KNOWLEDGE BASE (documents the AI agent can ground answers in)
create table if not exists knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  title         text not null,
  content       text not null,
  source_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_business_id on knowledge_documents (business_id);

create trigger update_knowledge_documents_updated_at
  before update on knowledge_documents
  for each row execute function update_updated_at_column();

alter table knowledge_documents enable row level security;

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

create trigger update_widgets_updated_at
  before update on widgets
  for each row execute function update_updated_at_column();

alter table widgets enable row level security;

create policy "Business owners can manage their widget"
  on widgets for all using (is_business_owner(business_id));
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

create trigger update_websites_updated_at
  before update on websites
  for each row execute function update_updated_at_column();

alter table websites enable row level security;

create policy "Business owners can manage their website"
  on websites for all using (is_business_owner(business_id));
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

create trigger update_support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at_column();

alter table support_tickets enable row level security;

create policy "Clients can view their own tickets"
  on support_tickets for select using (auth.uid() = client_id);
create policy "Clients can create tickets"
  on support_tickets for insert with check (auth.uid() = client_id);
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

create policy "Clients can view messages on their own tickets"
  on support_messages for select using (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.client_id = auth.uid()
    )
  );
create policy "Clients can send messages on their own tickets"
  on support_messages for insert with check (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_id and t.client_id = auth.uid()
    )
  );
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

create trigger update_business_services_updated_at
  before update on business_services
  for each row execute function update_updated_at_column();

alter table business_services enable row level security;

create policy "Business owners can manage their services"
  on business_services for all using (is_business_owner(business_id));
create policy "Public can view active services"
  on business_services for select using (is_active);
