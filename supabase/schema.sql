-- ═══════════════════════════════════════════════════════════════════════════
-- EstetiCall — Database Schema
-- Postgres / Supabase. Multi-tenant: every domain table hangs off `businesses`.
-- Adaptado del schema de Real-Estate-Multi-AI-Agent-SaaS (InmobilIACall) para
-- el vertical de spas médico-estéticos / clínicas estéticas. Se conserva el
-- núcleo genérico (negocio, suscripción, agentes IA, citas, conversaciones,
-- knowledge base, widget, website builder, WhatsApp, soporte) y se reemplaza
-- lo específico de bienes raíces (listings, preventa, channels/Hostaway) por
-- las tablas propias de un spa médico-estético: fichas de tratamiento,
-- consentimientos informados, galería antes/después, paquetes/membresías y
-- bitácora de auditoría para datos de salud.
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
  industry          text not null default 'medspa',
  logo_url          text,
  phone             text,
  contact_email     text,
  address           text,
  website           text,
  city              text,
  state             text,
  zip_code          text,
  timezone          text not null default 'UTC',
  stripe_publishable_key text,
  stripe_secret_key      text,
  stripe_connected       boolean not null default false,
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

-- Alias kept for parity with services that read business-scoped data (no
-- separate staff/team-member table exists yet — access is owner-only today).
create or replace function has_business_access(target_business_id uuid)
returns boolean as $$
  select is_business_owner(target_business_id);
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
  voice_credit_seconds_balance integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_business_subscriptions_business_id on business_subscriptions (business_id);
create index if not exists idx_business_subscriptions_stripe_customer_id on business_subscriptions (stripe_customer_id);

-- Purchased voice-minute recharge balance, in seconds — topped up by the
-- one-time Stripe checkout in services/billing.ts, spent once a business's
-- plan-included monthly voice minutes run out. A plpgsql function (not a
-- plain UPDATE from the app) keeps the +/- arithmetic atomic under
-- concurrent calls.
create or replace function adjust_voice_credit_balance(p_business_id uuid, p_delta_seconds integer) returns void as $$
begin
  update business_subscriptions
  set voice_credit_seconds_balance = greatest(0, voice_credit_seconds_balance + p_delta_seconds)
  where business_id = p_business_id;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists update_business_subscriptions_updated_at on business_subscriptions;
create trigger update_business_subscriptions_updated_at
  before update on business_subscriptions
  for each row execute function update_updated_at_column();

alter table business_subscriptions enable row level security;

-- Members may only read their subscription — every write (plan changes,
-- Stripe fields) goes through the service-role Stripe webhook.
drop policy if exists "subscription read by business members" on business_subscriptions;
create policy "subscription read by business members"
  on business_subscriptions for select using (has_business_access(business_id));
drop policy if exists "subscription writes by service role" on business_subscriptions;
create policy "subscription writes by service role"
  on business_subscriptions for all using (auth.role() = 'service_role');

-- Auto-create a free subscription row whenever a business is created, so no
-- client code needs INSERT permission on business_subscriptions.
create or replace function create_default_subscription() returns trigger as $$
begin
  insert into business_subscriptions (business_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (business_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_create_default_subscription on businesses;
create trigger trg_create_default_subscription
after insert on businesses
for each row execute function create_default_subscription();

-- 3. AI AGENTS
create table if not exists ai_agents (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  specialty         text not null default 'Aesthetic Consultant',
  voice             text not null default 'alloy',
  personality       text not null default 'friendly',
  language          text not null default 'es',
  sensitivity       numeric(3,2) not null default 0.5 check (sensitivity between 0 and 1),
  greeting_message  text not null default '¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte hoy?',
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

-- 4. CLIENTS (patients — leads / customers, may or may not have a portal login)
create table if not exists clients (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  auth_user_id      uuid references auth.users(id) on delete set null,
  name              text not null default 'Unknown',
  phone             text,
  email             text,
  date_of_birth     date,
  allergies         text,
  contraindications text,
  skin_type         text,
  source            text not null default 'ai_call'
    check (source in ('ai_call','widget_chat','manual','website_form','whatsapp')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
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

-- 5. CONVERSATIONS (call log — one row per AI voice/chat session)
create table if not exists conversations (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references businesses(id) on delete cascade,
  agent_id           uuid references ai_agents(id) on delete set null,
  client_id          uuid references clients(id) on delete set null,
  channel            text not null default 'widget_voice'
    check (channel in ('widget_voice','widget_chat','phone','whatsapp')),
  status             text not null default 'in_progress'
    check (status in ('in_progress','completed','failed')),
  duration_seconds   integer not null default 0,
  outcome            text
    check (outcome is null or outcome in ('appointment_booked','qualified_lead','no_action','escalated')),
  sentiment          text check (sentiment in ('positive', 'neutral', 'negative')),
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

-- 6. CONVERSATION MESSAGES (transcript turns)
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

-- 7. AI USAGE EVENTS (chat_completion + realtime_voice cost tracking, feeds
-- the Analytics "AI API Spend" indicator)
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

-- 8. BUSINESS SERVICES (the treatment catalog — e.g. "Toxina Botulínica",
-- "Limpieza Facial Profunda" — that a business's AI agents can quote and
-- clients can book against)
create table if not exists business_services (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  name              text not null,
  description       text,
  price             numeric(14,2),
  price_max         numeric(14,2),
  price_type        text not null default 'fixed'
    check (price_type in ('fixed', 'starting_at', 'price_range', 'call_for_price')),
  duration_minutes  integer not null default 60,
  requires_consent  boolean not null default false,
  catalog_key       text,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_business_services_business_id on business_services (business_id);
create index if not exists idx_business_services_catalog_key on business_services (business_id, catalog_key);

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

-- 9. AGENT SERVICES (join: which services each individual AI agent is scoped
-- to discuss/quote)
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

-- 10. PACKAGES (prepaid session bundles — e.g. "6 sesiones de láser facial")
create table if not exists packages (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  service_id      uuid references business_services(id) on delete set null,
  name            text not null,
  description     text,
  session_count   integer not null default 1 check (session_count > 0),
  price           numeric(14,2) not null default 0,
  validity_days   integer,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_packages_business_id on packages (business_id);

drop trigger if exists update_packages_updated_at on packages;
create trigger update_packages_updated_at
  before update on packages
  for each row execute function update_updated_at_column();

alter table packages enable row level security;

drop policy if exists "Business owners can manage their packages" on packages;
create policy "Business owners can manage their packages"
  on packages for all using (is_business_owner(business_id));
drop policy if exists "Public can view active packages" on packages;
create policy "Public can view active packages"
  on packages for select using (is_active);

-- 11. CLIENT PACKAGE CREDITS (a client's own purchased instance of a package
-- — tracks remaining sessions as they get redeemed against appointments)
create table if not exists client_package_credits (
  id                        uuid primary key default gen_random_uuid(),
  business_id               uuid not null references businesses(id) on delete cascade,
  client_id                 uuid not null references clients(id) on delete cascade,
  package_id                uuid not null references packages(id) on delete restrict,
  sessions_total            integer not null,
  sessions_used             integer not null default 0,
  payment_status            text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded')),
  stripe_checkout_session_id text,
  purchased_at              timestamptz not null default now(),
  expires_at                timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_client_package_credits_business_id on client_package_credits (business_id);
create index if not exists idx_client_package_credits_client_id on client_package_credits (client_id);

drop trigger if exists update_client_package_credits_updated_at on client_package_credits;
create trigger update_client_package_credits_updated_at
  before update on client_package_credits
  for each row execute function update_updated_at_column();

alter table client_package_credits enable row level security;

drop policy if exists "Business owners can manage their client package credits" on client_package_credits;
create policy "Business owners can manage their client package credits"
  on client_package_credits for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own package credits" on client_package_credits;
create policy "Clients can view their own package credits"
  on client_package_credits for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

-- 12. APPOINTMENTS
create table if not exists appointments (
  id                        uuid primary key default gen_random_uuid(),
  business_id               uuid not null references businesses(id) on delete cascade,
  client_id                 uuid references clients(id) on delete set null,
  service_id                uuid references business_services(id) on delete set null,
  package_credit_id         uuid references client_package_credits(id) on delete set null,
  conversation_id           uuid references conversations(id) on delete set null,
  scheduled_at              timestamptz not null,
  status                    text not null default 'scheduled'
    check (status in ('scheduled','pending_confirmation','completed','cancelled','no_show')),
  notes                     text,
  rescheduled_from          timestamptz,
  requested_scheduled_at    timestamptz,
  reschedule_requested_at   timestamptz,
  confirmed_by_agent_at     timestamptz,
  cancelled_at              timestamptz,
  cancellation_reason       text,
  cancelled_by              text check (cancelled_by is null or cancelled_by in ('client', 'business', 'system')),
  payment_status            text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'paid', 'cash', 'refunded')),
  payment_amount            numeric(14,2),
  payment_currency          text not null default 'usd',
  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  paid_at                   timestamptz,
  reminder_sent_at          timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
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

-- 13. TREATMENT RECORDS (simplified clinical note per visit — not a full EMR,
-- just enough to operate safely: what was done, contraindication flags, next
-- recommended date. notes_encrypted is encrypted at the application layer
-- with src/lib/encryption.ts before it ever reaches Postgres.)
create table if not exists treatment_records (
  id                        uuid primary key default gen_random_uuid(),
  business_id               uuid not null references businesses(id) on delete cascade,
  client_id                 uuid not null references clients(id) on delete cascade,
  appointment_id            uuid references appointments(id) on delete set null,
  service_id                uuid references business_services(id) on delete set null,
  treated_by                text,
  notes_encrypted           text,
  contraindications_flagged boolean not null default false,
  next_recommended_date     date,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_treatment_records_business_id on treatment_records (business_id);
create index if not exists idx_treatment_records_client_id on treatment_records (client_id);

drop trigger if exists update_treatment_records_updated_at on treatment_records;
create trigger update_treatment_records_updated_at
  before update on treatment_records
  for each row execute function update_updated_at_column();

alter table treatment_records enable row level security;

drop policy if exists "Business owners can manage their treatment records" on treatment_records;
create policy "Business owners can manage their treatment records"
  on treatment_records for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own treatment records" on treatment_records;
create policy "Clients can view their own treatment records"
  on treatment_records for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

-- 14. CONSENT FORMS (digital informed consent, required before certain
-- treatments — botox, láser, peelings. content_encrypted holds the consent
-- text/answers shown to the client, encrypted the same way as treatment
-- notes. signature_name is the typed legal name that stands in for a
-- signature.)
create table if not exists consent_forms (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  client_id         uuid not null references clients(id) on delete cascade,
  service_id        uuid references business_services(id) on delete set null,
  appointment_id    uuid references appointments(id) on delete set null,
  title             text not null,
  content_encrypted text not null,
  status            text not null default 'pending'
    check (status in ('pending', 'signed', 'declined')),
  signature_name    text,
  signed_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_consent_forms_business_id on consent_forms (business_id);
create index if not exists idx_consent_forms_client_id on consent_forms (client_id);

drop trigger if exists update_consent_forms_updated_at on consent_forms;
create trigger update_consent_forms_updated_at
  before update on consent_forms
  for each row execute function update_updated_at_column();

alter table consent_forms enable row level security;

drop policy if exists "Business owners can manage their consent forms" on consent_forms;
create policy "Business owners can manage their consent forms"
  on consent_forms for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own consent forms" on consent_forms;
create policy "Clients can view their own consent forms"
  on consent_forms for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );
-- Clients sign their own pending consent forms from the patient portal —
-- restricted to filling in signature fields, never rewriting the content.
drop policy if exists "Clients can sign their own pending consent forms" on consent_forms;
create policy "Clients can sign their own pending consent forms"
  on consent_forms for update using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
    and status = 'pending'
  );

-- 15. BEFORE/AFTER PHOTOS (private by default — visible only in the
-- dashboard and to the client themselves in the portal, never public)
create table if not exists before_after_photos (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references businesses(id) on delete cascade,
  client_id            uuid not null references clients(id) on delete cascade,
  treatment_record_id  uuid references treatment_records(id) on delete set null,
  photo_type           text not null check (photo_type in ('before', 'after')),
  url                  text not null,
  taken_at             timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

create index if not exists idx_before_after_photos_business_id on before_after_photos (business_id);
create index if not exists idx_before_after_photos_client_id on before_after_photos (client_id);

alter table before_after_photos enable row level security;

drop policy if exists "Business owners can manage their before/after photos" on before_after_photos;
create policy "Business owners can manage their before/after photos"
  on before_after_photos for all using (is_business_owner(business_id));
drop policy if exists "Clients can view their own before/after photos" on before_after_photos;
create policy "Clients can view their own before/after photos"
  on before_after_photos for select using (
    exists (select 1 from clients c where c.id = client_id and c.auth_user_id = auth.uid())
  );

-- 16. AUDIT LOG (access trail for sensitive health data — clinical notes and
-- consent forms. Writes happen from server-side service code only; there is
-- no client-side insert policy on purpose.)
create table if not exists audit_log (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  actor_label  text not null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_business_id on audit_log (business_id);
create index if not exists idx_audit_log_created_at on audit_log (created_at);

alter table audit_log enable row level security;

drop policy if exists "Business owners can view their audit log" on audit_log;
create policy "Business owners can view their audit log"
  on audit_log for select using (is_business_owner(business_id));
drop policy if exists "Service role can write audit log" on audit_log;
create policy "Service role can write audit log"
  on audit_log for insert with check (auth.role() = 'service_role');

-- 17. AVAILABILITY (weekly working hours the AI checks before offering a slot)
create table if not exists business_availability (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  day_of_week   integer not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time    time not null,
  end_time      time not null,
  slot_minutes  integer not null default 30 check (slot_minutes > 0),
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

-- 18. KNOWLEDGE BASE (documents the AI agent can ground answers in)
create table if not exists knowledge_documents (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  title         text not null,
  content       text not null,
  category      text,
  catalog_key   text,
  source_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_knowledge_documents_business_id on knowledge_documents (business_id);
create index if not exists idx_knowledge_documents_catalog_key on knowledge_documents (business_id, catalog_key);
create index if not exists idx_knowledge_documents_active on knowledge_documents (business_id, is_active);

drop trigger if exists update_knowledge_documents_updated_at on knowledge_documents;
create trigger update_knowledge_documents_updated_at
  before update on knowledge_documents
  for each row execute function update_updated_at_column();

alter table knowledge_documents enable row level security;

drop policy if exists "Business owners can manage their knowledge base" on knowledge_documents;
create policy "Business owners can manage their knowledge base"
  on knowledge_documents for all using (is_business_owner(business_id));

-- 19. PLATFORM KNOWLEDGE (country/market-level facts shared by every business
-- on EstetiCall — as opposed to knowledge_documents, which is each business's
-- own private content. No business_id: read by every AI agent's system
-- prompt. Managed from /admin/knowledge, gated by PLATFORM_ADMIN_EMAILS.)
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

drop policy if exists "Anyone can view platform knowledge" on platform_knowledge_documents;
create policy "Anyone can view platform knowledge"
  on platform_knowledge_documents for select using (true);

-- 20. WIDGETS (embeddable voice/chat widget configuration — a business can
-- have several, each optionally bound to a specific AI agent)
create table if not exists widgets (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  agent_id         uuid references ai_agents(id) on delete set null,
  name             text not null default 'Widget principal',
  is_enabled       boolean not null default true,
  primary_color    text not null default '#2563eb',
  position         text not null default 'bottom-right'
    check (position in ('bottom-right', 'bottom-left')),
  theme            text not null default 'light' check (theme in ('light', 'dark')),
  greeting_message text not null default '¡Hola! Pregúntame sobre nuestros tratamientos y disponibilidad.',
  allowed_origins  text[] not null default '{}',
  impressions      integer not null default 0,
  interactions     integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_widgets_business_id on widgets (business_id);
create index if not exists idx_widgets_agent_id on widgets (agent_id);
create unique index if not exists idx_widgets_business_agent_unique
  on widgets (business_id, agent_id)
  where agent_id is not null;

drop trigger if exists update_widgets_updated_at on widgets;
create trigger update_widgets_updated_at
  before update on widgets
  for each row execute function update_updated_at_column();

-- Atomic +1 for impressions/interactions — avoids read-modify-write races
-- when the embed script fires from many concurrent page loads.
create or replace function increment_widget_counter(widget_id uuid, column_name text)
returns void as $$
begin
  if column_name = 'impressions' then
    update widgets set impressions = impressions + 1 where id = widget_id;
  elsif column_name = 'interactions' then
    update widgets set interactions = interactions + 1 where id = widget_id;
  else
    raise exception 'Unknown widget counter column: %', column_name;
  end if;
end;
$$ language plpgsql security definer;

alter table widgets enable row level security;

drop policy if exists "Business owners can manage their widget" on widgets;
create policy "Business owners can manage their widget"
  on widgets for all using (is_business_owner(business_id));
drop policy if exists "Public can view enabled widget config" on widgets;
create policy "Public can view enabled widget config"
  on widgets for select using (is_enabled);

-- 21. WEBSITES (site-builder config rendered at /sites/[slug])
create table if not exists websites (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null references businesses(id) on delete cascade unique,
  is_published          boolean not null default false,
  template              text not null default 'clarity'
    check (template in ('clarity', 'pulse', 'serenity')),
  primary_color         text not null default '#166534',
  secondary_color       text not null default '#16a34a',
  font                  text not null default 'inter'
    check (font in ('inter', 'playfair', 'poppins')),
  ai_agent_id           uuid references ai_agents(id) on delete set null,
  custom_domain         text unique,
  -- Branding
  logo_url              text,
  site_title            text,
  site_description      text,
  -- Hero section
  headline              text,
  hero_subheadline      text,
  hero_image_url        text,
  cta_primary_text      text not null default 'Reservar una Cita',
  cta_secondary_text    text not null default 'Llamar Ahora',
  years_experience      integer,
  clients_served        integer,
  satisfaction_pct      integer,
  -- About section
  about_title           text not null default 'Sobre Nosotros',
  about                 text,
  about_story           text,
  about_photo_url       text,
  trust_badges          text[] not null default array[
    'Especialistas Certificados',
    'Productos y Equipos Aprobados',
    'Consulta Virtual Disponible',
    'Primera Valoración Gratuita'
  ],
  -- Footer
  footer_tagline        text,
  footer_copyright      text,
  -- Website-level contact block (independent of businesses.phone/contact_email)
  contact_phone         text,
  contact_email         text,
  contact_address       text,
  contact_hours         text,
  contact_maps_url      text,
  -- Social links
  social_youtube        text,
  social_facebook       text,
  social_instagram      text,
  social_tiktok         text,
  social_linkedin       text,
  social_pinterest      text,
  social_twitter        text,
  theme                 text not null default 'light',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
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

-- 22. WEBSITE CONTENT — team members, testimonials, specialties, FAQs, and
-- the marketing-copy services list shown on the public site (independent
-- from business_services, the catalog actually bookable through the AI
-- agent — matches the reference template's split between the two).
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

-- "Our Specialties" / "What We Offer" grid on the public site.
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

-- Marketing-copy treatments list authored directly in the builder (icon,
-- name, description, duration, price) — separate from business_services.
create table if not exists website_services (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  icon        text not null default 'sparkles',
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

-- Contact-form leads (and any other opt-in source) captured from the public
-- site. Always written through the admin client from /api/website/subscribe
-- since visitors have no Supabase session — no public insert policy here,
-- only a read policy for the business owner.
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

-- 23. NOTIFICATIONS
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

-- 24. SUPPORT TICKETS / MESSAGES
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

-- client_id is a foreign key to clients.id (the row's own primary key), not
-- to clients.auth_user_id — the policies below join through clients to match
-- the signed-in portal user, mirroring the appointments/clients pattern.
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
drop policy if exists "Business owners can manage all tickets" on support_tickets;
create policy "Business owners can manage all tickets"
  on support_tickets for all using (is_business_owner(business_id));

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
drop policy if exists "Business owners can manage all support messages" on support_messages;
create policy "Business owners can manage all support messages"
  on support_messages for all using (is_business_owner(business_id));

-- 25. WHATSAPP (self-hosted Evolution API — https://github.com/EvolutionAPI/evolution-api)
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

-- 26. BANK TRANSFER PAYMENTS — manual bank-transfer payment method for plan
-- upgrades, alongside Stripe checkout. A bank transfer has no real-time
-- confirmation the way a card charge does, so this models an explicit review
-- queue instead of pretending it's instant: the business submits proof of
-- transfer, a platform admin (PLATFORM_ADMIN_EMAILS) verifies the money
-- actually landed, and only then does approving it run the exact same
-- plan-activation effect Stripe's checkout.session.completed webhook
-- produces — see billing.ts. No update/delete policy for business owners on
-- purpose: only the service-role (admin) client can attach a receipt or
-- approve/reject, with ownership checked in application code.
create table if not exists bank_transfer_payments (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references businesses(id) on delete cascade,
  reference_code    text not null unique default ('TRF-' || substr(gen_random_uuid()::text, 1, 8)),
  plan              text not null check (plan in ('pro','business')),
  amount_usd        numeric(10,2) not null,
  receipt_url       text,
  status            text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  reviewed_by       text,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_bank_transfer_payments_business_id on bank_transfer_payments (business_id);
create index if not exists idx_bank_transfer_payments_status on bank_transfer_payments (status);

alter table bank_transfer_payments enable row level security;

drop policy if exists "Business owners can view their own bank transfer requests" on bank_transfer_payments;
create policy "Business owners can view their own bank transfer requests"
  on bank_transfer_payments for select using (is_business_owner(business_id));

drop policy if exists "Business owners can create their own bank transfer requests" on bank_transfer_payments;
create policy "Business owners can create their own bank transfer requests"
  on bank_transfer_payments for insert with check (is_business_owner(business_id) and status = 'pending');
