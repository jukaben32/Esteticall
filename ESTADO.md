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

- **Módulos nuevos del dashboard implementados:**
  - `/dashboard/paquetes` — CRUD de paquetes de sesiones + venta a clientes
    + marcar pago (`src/services/packages.ts`, `PackagesManager.tsx`).
  - `/dashboard/consentimientos` — crear consentimientos, ver contenido
    (descifrado al leer) y registrar firma
    (`src/services/consentForms.ts`, `ConsentFormsManager.tsx`).
  - `/dashboard/antes-despues` — galería privada por cliente, sube/borra
    fotos en el bucket privado `patient-photos` con URLs firmadas de 1 hora
    (`src/services/beforeAfterPhotos.ts`, `BeforeAfterGallery.tsx`).
  - Las tres quedan enlazadas en `DashboardSidebar.tsx`.

## PENDIENTE

1. **Bucket de Supabase Storage** — crear el bucket privado `patient-photos`
   a mano en el dashboard de Supabase (Storage → New bucket → Public: OFF)
   antes de usar Antes y Después; ver nota en `.env.example`.
2. **Recordatorios automáticos** — cron (Vercel Cron o Supabase Edge
   Function) que use WhatsApp/Resend para recordar citas y bajar el
   no-show. `appointments.reminder_sent_at` ya existe en el schema para
   soportarlo.
3. **Portal del paciente** — mostrar paquetes con créditos restantes y
   firma de consentimientos pendientes desde `/portal` (hoy solo se
   gestionan desde el dashboard del negocio).
4. **Proyecto Supabase real** — este repo tiene `schema.sql` listo pero
   nunca se aplicó contra un proyecto Supabase real; falta crearlo, correr
   el schema, crear el bucket del punto 1 y cargar las variables de entorno
   (ver `.env.example`).
5. **Deploy** — configurar Vercel apuntando a este repo una vez exista un
   remote de GitHub (o desplegar directo desde local).
6. **Stripe/WhatsApp reales** — cargar keys de Stripe (modo test primero) y
   levantar una instancia de Evolution API si se quiere WhatsApp funcional.
