# ESTETICALL — ESTADO DEL PROYECTO

> Última actualización: 25 agosto 2026.

## RESUMEN RÁPIDO

Fork de `Real-Estate-Multi-AI-Agent-SaaS` (InmobilIACall) adaptado al vertical
de spas médico-estéticos y clínicas de medicina estética. Mismo stack y
arquitectura multi-tenant; el dominio (schema, agente IA, catálogo,
componentes) fue reescrito para tratamientos/citas/paquetes en vez de
propiedades.

- Repo: **https://github.com/jukaben32/Esteticall** (público)
- Producción: **https://esteticall-juans-projects-0e0054fc.vercel.app**
- Cada push a `main` redespliega solo (proyecto Vercel conectado al repo).

## DEPLOY EN VERCEL (25 agosto 2026)

- Repo creado y subido a GitHub, proyecto Vercel `esteticall` creado y
  enlazado al repo (team `juans-projects-0e0054fc`, plan Hobby).
- Cron de recordatorios ajustado de cada 30 min a **una vez al día**
  (`vercel.json`) — el plan Hobby no permite cron jobs más frecuentes que
  diarios. Con plan Pro se puede volver a bajar la cadencia.
- Las 26 variables de entorno de `.env.local` cargadas en Vercel (Production/
  Preview/Development) vía la API con un access token que el usuario generó
  y compartió — **ya se puede/debe borrar ese token** desde
  vercel.com/account/tokens, no hace falta para nada más.
- Deploy verificado: `/`, `/login` y `/signup` responden 200 en producción
  (antes daban 500 por falta de variables — el error era literalmente
  "Your project's URL and Key are required to create a Supabase client").

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

## OPENAI + RESEND (25 agosto 2026)

- `OPENAI_API_KEY` cargada y verificada — el modelo `gpt-realtime` responde.
- `RESEND_API_KEY` cargada y verificada — correo de prueba entregado a
  `jcbjm03@gmail.com` (usado también como `RESEND_DEV_OVERRIDE_TO` y
  `PLATFORM_ADMIN_EMAILS`). `RESEND_FROM_EMAIL` en el remitente compartido
  `onboarding@resend.dev` (funciona sin verificar dominio propio — para
  producción real conviene verificar un dominio propio en Resend).
- Servidor de dev reiniciado para tomar las variables nuevas.

Con esto, el agente de voz y los correos transaccionales (confirmación de
cita, recordatorios, notificaciones al negocio) ya deberían funcionar
probando desde `http://localhost:3000`.

## PENDIENTE

Lo que queda son credenciales de terceros que el usuario debe decidir cuándo
cargar (en `.env.local`, ver `.env.example` para cada una):

1. **Stripe** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`) — modo test primero. Cargar en `.env.local` y en
   las env vars del proyecto en Vercel una vez se tengan.
2. **WhatsApp** (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`) — requiere
   levantar tu propia instancia de Evolution API en un VPS; sin esto
   `/dashboard/whatsapp` muestra "no configurado" en vez de fallar.
3. **Dominio propio en Resend** — antes de producción real, verificar un
   dominio propio para no depender del remitente compartido de pruebas.
