-- =============================================================================
--  LIMPIEZA DEL ESQUEMA VIEJO (backend Express + Prisma)
-- =============================================================================
--
--  ⚠️  ESTE SCRIPT BORRA DATOS. LÉELO ANTES DE EJECUTARLO.
--
--  ¿POR QUÉ EXISTE?
--  El proyecto anterior (Express + Prisma) creó 11 tablas en este mismo
--  proyecto de Supabase. De esas, 7 se llaman IGUAL que tablas del esquema
--  nuevo, pero con columnas completamente distintas:
--
--      ai_agents, appointments, clients, notifications,
--      support_messages, support_tickets, websites
--
--  Como schema.sql usa "create table if not exists", esas 7 tablas se
--  SALTARÍAN en silencio y quedaría la estructura vieja. La app fallaría
--  después con errores confusos tipo "column business_id does not exist".
--
--  ORDEN CORRECTO:
--     1º) Este script  (00_drop_legacy_prisma_tables.sql)
--     2º) schema.sql
--
--  Ejecutar schema.sql sin esto deja la base en un estado roto a medias.
--
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASO 1 — COMPROBACIÓN (opcional pero recomendado)
-- -----------------------------------------------------------------------------
-- Ejecuta SOLO esta consulta primero para ver qué hay en la base.
-- Si no aparece ninguna fila, la base ya está limpia y puedes saltar
-- directamente a schema.sql.

-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in (
--     'agents','ai_agents','appointments','call_logs','clients',
--     'notifications','payments','properties','support_messages',
--     'support_tickets','websites'
--   )
-- order by table_name;


-- -----------------------------------------------------------------------------
-- PASO 2 — BORRADO
-- -----------------------------------------------------------------------------
-- "cascade" elimina también las claves foráneas que apuntan a estas tablas,
-- así que no importa el orden en que estén declaradas.
-- "if exists" evita que falle si alguna ya no está.

begin;

drop table if exists call_logs          cascade;
drop table if exists payments           cascade;
drop table if exists properties         cascade;
drop table if exists support_messages   cascade;
drop table if exists support_tickets    cascade;
drop table if exists notifications      cascade;
drop table if exists appointments       cascade;
drop table if exists ai_agents          cascade;
drop table if exists clients            cascade;
drop table if exists websites           cascade;
drop table if exists agents             cascade;

-- Tipos enum que creó Prisma y que ya nadie usa.
-- Si alguno no existe, "if exists" lo ignora sin error.
drop type if exists "Role"              cascade;
drop type if exists "SubscriptionStatus" cascade;
drop type if exists "AppointmentStatus" cascade;
drop type if exists "CallStatus"        cascade;
drop type if exists "PaymentStatus"     cascade;
drop type if exists "TicketStatus"      cascade;

commit;


-- -----------------------------------------------------------------------------
-- PASO 3 — VERIFICACIÓN
-- -----------------------------------------------------------------------------
-- Debe devolver 0 filas. Si devuelve algo, algo no se borró.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'agents','call_logs','payments','properties'
  );


-- -----------------------------------------------------------------------------
-- SIGUIENTE PASO
-- -----------------------------------------------------------------------------
-- Ahora sí: ejecuta supabase/schema.sql completo.
-- Después regístrate desde /signup en la app. El usuario demo del proyecto
-- viejo (agent@estatecall.com) pertenecía al backend Express y ya no existe.
