-- 01_multi_widgets.sql
-- Upgrades `widgets` from "one widget per business" to "many widgets per
-- business", each one bound to a specific AI agent, matching the dashboard
-- Widget page (list + create/edit/delete/preview + embeddable script tag).
begin;

-- The original schema.sql put an inline `unique` on widgets.business_id.
-- Drop whatever that constraint is named so a business can have N widgets.
do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'widgets' and con.contype = 'u';
  if cname is not null then
    execute format('alter table widgets drop constraint %I', cname);
  end if;
end $$;

alter table widgets
  add column if not exists name text not null default 'Main Widget',
  add column if not exists agent_id uuid references ai_agents(id) on delete set null,
  add column if not exists position text not null default 'bottom-right'
    check (position in ('bottom-right', 'bottom-left')),
  add column if not exists theme text not null default 'light'
    check (theme in ('light', 'dark')),
  add column if not exists impressions integer not null default 0,
  add column if not exists interactions integer not null default 0;

-- A business shouldn't have two widgets pointed at the same agent at once —
-- mirrors the "Default (first active agent)" vs named-agent picker in Create
-- Widget. Agent-less widgets (agent_id is null) are exempt from this.
create unique index if not exists idx_widgets_business_agent_unique
  on widgets (business_id, agent_id)
  where agent_id is not null;

create index if not exists idx_widgets_agent_id on widgets (agent_id);

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

commit;
