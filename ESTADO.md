# ESTETICALL — ESTADO DEL PROYECTO

> Última actualización: 24 agosto 2026.

## RESUMEN RÁPIDO

Fork de `Real-Estate-Multi-AI-Agent-SaaS` (InmobilIACall) adaptado al vertical
de spas médico-estéticos y clínicas de medicina estética. Mismo stack y
arquitectura multi-tenant; el dominio (schema, agente IA, catálogo,
componentes) fue reescrito para tratamientos/citas/paquetes en vez de
propiedades.

Repo local: `Documents/MisProyectos/SaaS/esteticall` (repo git local, sin
remote de GitHub configurado todavía).

## HECHO Y VERIFICADO

- `supabase/schema.sql` reescrito de cero: se quitó todo lo de inmobiliaria
  (listings, preventa, channels/Hostaway) y se agregaron las tablas propias
  del vertical: `treatment_records`, `consent_forms`, `before_after_photos`,
  `packages`, `client_package_credits`, `audit_log`.
- Agente IA (`src/ai/tools.ts` + `src/ai/executeTool.ts`) reescrito: busca
  tratamientos y paquetes, agenda citas, y tiene un flujo de cribado de
  contraindicaciones (`healthScreeningNotes` + `needsReview`) que deja la
  cita en `pending_confirmation` para revisión humana y cifra la nota
  clínica con `src/lib/encryption.ts` (`HEALTH_DATA_ENCRYPTION_KEY`).
- Código específico de inmobiliaria eliminado (listings, preventa, channels)
  y todo lo que quedó roto por ese cambio, corregido.
- Ruta `/dashboard/viewings` renombrada a `/dashboard/citas`;
  `ViewingsManager`/`NewViewingModal` renombrados a
  `AppointmentsManager`/`NewAppointmentModal`.
- Barrido de marca completo: cero referencias a "InmobilIACall" en `src/`.
  Landing page, auth, onboarding, admin, `README.md` reescritos para
  EstetiCall.
- Catálogo de tratamientos (`CATALOG_SERVICES`, 32 tratamientos en 8
  categorías) y biblioteca de FAQ (`FAQ_TEMPLATES`, 40 preguntas en 9
  categorías) reescritos para el dominio médico-estético.
- Plantillas de agentes IA y de widget (`AGENT_TEMPLATES`, `WIDGET_TEMPLATES`)
  reescritas con personas y prompts de spa/clínica.
- `npx tsc --noEmit` y `npm run build` pasan limpio.

## PENDIENTE

1. **Módulos nuevos del dashboard** — el schema y los tipos ya existen
   (`ConsentForm`, `BeforeAfterPhoto`, `Package`, `ClientPackageCredit`),
   falta la UI: página de Consentimientos, galería Antes/Después, gestor de
   Paquetes/Membresías.
2. **Recordatorios automáticos** — cron (Vercel Cron o Supabase Edge
   Function) que use WhatsApp/Resend para recordar citas y bajar el
   no-show.
3. **Portal del paciente** — mostrar paquetes con créditos restantes y
   firma de consentimientos pendientes desde `/portal`.
4. **Proyecto Supabase real** — este repo corrió `schema.sql` solo
   localmente/en revisión; falta crear el proyecto Supabase real, aplicar
   el schema y cargar las variables de entorno (ver `.env.example`).
5. **Deploy** — configurar Vercel apuntando a este repo una vez exista un
   remote de GitHub (o desplegar directo desde local).
6. **Stripe/WhatsApp reales** — cargar keys de Stripe (modo test primero) y
   levantar una instancia de Evolution API si se quiere WhatsApp funcional.
