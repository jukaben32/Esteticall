-- 02_service_price_types.sql
-- Expands business_services.price_type from 2 options (fixed, starting_at)
-- to the reference template's full 4-option "Price Type" dropdown: Fixed
-- Price, Price Range, Starting At, Call for Price. Adds price_max so a
-- price_range service can store a min (price) and max (price_max).
begin;

alter table business_services add column if not exists price_max numeric;

do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'business_services'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%price_type%';
  if cname is not null then
    execute format('alter table business_services drop constraint %I', cname);
  end if;
end $$;

alter table business_services add constraint business_services_price_type_check
  check (price_type in ('fixed', 'starting_at', 'price_range', 'call_for_price'));

commit;
