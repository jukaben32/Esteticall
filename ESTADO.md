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
- **Recordatorios automáticos de citas** — `vercel.json` declara un cron cada
  30 min que pega a `/api/cron/appointment-reminders`
  (`src/services/reminders.ts`): manda WhatsApp si el negocio tiene conexión
  activa, si no cae a email por Resend, y marca `reminder_sent_at` para no
  repetir. Protegido con `CRON_SECRET` (Vercel lo manda automático como
  `Authorization: Bearer` cuando la variable existe).
- **Portal del paciente ampliado** — `/portal/paquetes` (créditos de sesiones
  restantes por paquete) y `/portal/consentimientos` (firma de consentimientos
  pendientes directamente desde el portal, con el nombre completo como firma)
  — antes solo existían citas y soporte. `PortalNav` actualizado con los
  nuevos enlaces.
- `npx tsc --noEmit` y `npm run build` siguen pasando limpio con todo esto.

## PROYECTO SUPABASE REAL (25 agosto 2026)

Conectado a un proyecto Supabase real: `fmdkifhpngvihwcmltpp`
(`https://fmdkifhpngvihwcmltpp.supabase.co`).

- `supabase/schema.sql` aplicado — las 32 tablas verificadas contra
  `information_schema.tables`.
- Buckets de Storage creados: `listing-photos` (público, para fotos del
  website builder) y `patient-photos` (privado, para Antes y Después).
- Auth: `mailer_autoconfirm` activado para que el signup dé sesión
  inmediata en dev sin depender de que Resend esté configurado todavía
  (`site_url` ya apuntaba a `http://localhost:3000`). Volver a exigir
  confirmación de correo antes de ir a producción real.
- `.env.local` creado con las credenciales de este proyecto +
  `HEALTH_DATA_ENCRYPTION_KEY` y `CRON_SECRET` generados localmente.
  **No está en git** (confirmado contra `.gitignore`).
- Probado de punta a punta: signup contra Supabase real devuelve sesión
  inmediata (usuario de prueba creado y borrado después).
- `npm run dev` corriendo en `http://localhost:3000`.

⚠️ El Personal Access Token de la Management API (`sbp_...`) que se usó para
esta configuración se compartió en el chat — recomendado rotarlo desde
Supabase (Account → Access Tokens) una vez terminada la puesta en marcha,
ya que da acceso de administración a toda la cuenta, no solo a este proyecto.

## PENDIENTE

Lo que queda son credenciales de terceros que el usuario debe decidir cuándo
cargar (en `.env.local`, ver `.env.example` para cada una):

1. **`OPENAI_API_KEY`** — sin esto el agente de voz (Realtime API) no
   funciona.
2. **`RESEND_API_KEY`** — sin esto no salen correos (confirmaciones de
   cita, recordatorios). Mientras tanto el signup ya funciona por el punto
   anterior (autoconfirm), pero las notificaciones por email no.
3. **Stripe** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`) — modo test primero.
4. **WhatsApp** (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`) — requiere
   levantar tu propia instancia de Evolution API en un VPS; sin esto
   `/dashboard/whatsapp` muestra "no configurado" en vez de fallar.
5. **Deploy en Vercel** — crear un remote de GitHub (o conectar el repo
   local directo) y desplegar; el cron de recordatorios (`vercel.json`)
   solo corre una vez desplegado, no en local. Ahí también hay que cargar
   `CRON_SECRET` como env var del proyecto en Vercel (mismo valor que en
   `.env.local`, o generar uno nuevo).
