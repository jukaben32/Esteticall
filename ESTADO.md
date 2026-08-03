# INMOBILIACALL — ESTADO DEL PROYECTO

> Última actualización: 2 agosto 2026. Rebranding de "EstateCall" a
> "InmobilIACall" aplicado en landing, login/signup/onboarding, sidebar del
> dashboard, metadata y `package.json`. Producto funcionalmente completo y en
> producción (ver "PENDIENTES" — todo resuelto salvo rotar credenciales expuestas
> en el chat).

## RESUMEN RÁPIDO

El backend Express + Prisma **ya no existe**. Fue reemplazado por completo por una
app **Next.js 14 full-stack** (el starter Real-Estate-AI-Calling-Agent-SaaS,
implementado). Todo vive ahora en un solo proyecto: frontend, API y lógica de negocio.

El dashboard tiene las 14 secciones de su barra lateral implementadas y funcionales
contra Supabase real, con la identidad de marca original (esmeralda/marfil, español)
restaurada, landing propia, carga de fotos, y voz/email conectados (OpenAI + Resend).
Deployado en `real-estate-multi-ai-agent-saa-s.vercel.app`.

---

## STACK ACTUAL

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** para estilos
- **Supabase** para base de datos y autenticación (`@supabase/ssr`)
- **OpenAI Realtime** para la voz del agente
- **Stripe** para suscripciones y pagos
- **Resend** para correo
- **Zustand** (estado global) + **React Query** (datos) + **Zod** (validación)

Repo: https://github.com/jukaben32/Real-Estate-Multi-AI-Agent-SaaS (rama `main`)

---

## ESTRUCTURA

```
src/
  app/
    (auth)/login, (auth)/signup     Autenticación
    (dashboard)/dashboard/          Panel completo, 14 secciones (ver abajo)
    sites/[slug]/                   Website builder (sitio público por negocio)
    embed/[businessId]/             Página minimal para iframe del widget en sitios externos
    widget-demo/                    Demo del widget de voz
    api/                            Rutas de API (ver abajo)
  services/                         Acceso a datos (Supabase)
  components/                       UI reutilizable
  hooks/useRealtimeVoice.ts         Conexión de voz en tiempo real con OpenAI
  ai/tools.ts                       Herramientas que el agente IA puede invocar
  lib/supabase/                     Clientes de Supabase (client, server, admin)
  store/                            Estado global (zustand)
  middleware.ts                     Sesión y protección de rutas
supabase/
  00_drop_legacy_prisma_tables.sql  Limpieza del esquema viejo (ejecutar 1º)
  schema.sql                        Esquema completo, 18 tablas (ejecutar 2º)
```

### Dashboard completo (14/14 secciones)

El sidebar (`src/components/DashboardSidebar.tsx`) ya listaba las 14 secciones desde
antes, pero solo 3 tenían página real (Overview, Listings, AI Agents). Se agregaron
las 11 que faltaban, todas sobre servicios/tablas que ya existían en el schema
(salvo `business_services`, nueva — ver abajo):

| Sección | Ruta | Servicio |
|---|---|---|
| Analytics | `/dashboard/analytics` | gráficas (recharts) sobre `conversations` + `appointments` |
| Call Log | `/dashboard/call-log` | `conversations` + `conversation_messages` (transcript expandible) |
| Viewings | `/dashboard/viewings` | `appointments` (cambiar estado: completed/no_show/cancelled) |
| Schedule | `/dashboard/schedule` | `business_availability` (horario semanal que usa el agente IA) |
| Clients | `/dashboard/clients` | `clients` (leads capturados por el agente) |
| Services | `/dashboard/services` | `business_services` (**tabla nueva**, ver abajo) |
| Knowledge | `/dashboard/knowledge` | `knowledge_documents` |
| Widget | `/dashboard/widget` | `widgets` + snippet de embed (`/embed/[businessId]`) |
| Website | `/dashboard/website` | `websites` (editor del sitio público en `/sites/[slug]`) |
| Plan | `/dashboard/plan` | `business_subscriptions` + Stripe Checkout/Portal |
| Notifications | `/dashboard/notifications` | `notifications` |

**Tabla nueva:** `business_services` (sección 18 de `schema.sql`) — catálogo de
servicios que el agente IA puede ofrecer (ej. "Property Viewing", "Investment
Consultation"), independiente de los listings. Es additiva: no rompe el orden de
ejecución documentado en "Base de datos" más abajo, solo hay que correr el
`schema.sql` actualizado.

## RUTAS DE API

| Ruta | Para qué |
|---|---|
| `/api/agents` · `/api/agents/[agentId]` | CRUD de agentes IA |
| `/api/agents/[agentId]/session` | Abre sesión de voz realtime |
| `/api/ai/tools` | Herramientas que el agente ejecuta durante la llamada |
| `/api/listings` · `/api/listings/[listingId]` | CRUD de propiedades |
| `/api/appointments/[appointmentId]` | Cambiar estado de una viewing |
| `/api/conversations/[conversationId]/messages` | Transcript de una llamada |
| `/api/availability` | GET/PUT horario semanal (Schedule) |
| `/api/knowledge` · `/api/knowledge/[documentId]` | CRUD knowledge base |
| `/api/notifications` · `/api/notifications/[notificationId]` | Listar / marcar leídas |
| `/api/services` · `/api/services/[serviceId]` | CRUD de servicios del negocio |
| `/api/widget` | GET/PUT config del widget (dueño del negocio) |
| `/api/widget/[businessId]/config` | Config pública que consume el script embebido |
| `/api/website` | GET/PUT config del website builder |
| `/api/billing/checkout` | Checkout de Stripe |
| `/api/billing/portal` | Billing Portal de Stripe (gestionar suscripción) |
| `/api/stripe/webhook` | Webhook de Stripe (requiere `STRIPE_WEBHOOK_SECRET`) |

---

## CÓMO LEVANTAR EN LOCAL

```bash
npm ci
cp .env.example .env.local     # y rellenar los valores reales
npm run dev                    # http://localhost:3000
```

Verificaciones antes de commitear: `npx tsc --noEmit` y `npm run build`.

Variables de entorno: ver `.env.example`. Las mínimas para arrancar son
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_APP_URL`.

**`.env.local` nunca se commitea.** Está en `.gitignore`.

---

## PENDIENTES

### 1. Base de datos — ✅ resuelto (1 ago 2026)
El schema ya está aplicado en el proyecto real de Supabase (`elrvxpgxlnyvfsfufnoq`):
18 tablas, incluida `business_services` (nueva). No había tablas viejas de Prisma que
limpiar, así que `00_drop_legacy_prisma_tables.sql` no hizo falta correrlo — se deja
en el repo por si se necesita en otro entorno que sí tenga el esquema viejo.

### 1b. Signup no creaba usuario — ✅ resuelto (1 ago 2026)
La confirmación de email estaba activada en Supabase Auth (`mailer_autoconfirm: false`),
así que `signUp()` creaba el usuario pero sin sesión activa hasta confirmar el correo —
y el flujo de `/signup` (`src/app/(auth)/signup/page.tsx`) asume sesión inmediata para
crear el `business` (si no, la RLS de `businesses` rechaza el insert porque `auth.uid()`
es null). Se desactivó la confirmación de email (`mailer_autoconfirm: true`) para que el
signup dé sesión al instante, y se corrigió `site_url` (apuntaba a `localhost:3000`) y
`uri_allow_list` (vacío) para incluir el dominio real de producción y el del preview.

### 2. Deploy en Vercel — ✅ resuelto (1 ago 2026)
La causa real no era el Output Directory (ya estaba en default) sino que el
**Framework Preset del proyecto estaba en "Express"** (el backend viejo), así que
Vercel intentaba construirlo como esa app. Se corrigió a **Next.js** vía API y se
cargaron `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_APP_URL` como env vars del proyecto
(production/preview/development). El deploy del PR #1 ya queda en estado **Ready**.

Para pasar a producción: mergear el PR a `main` (o hacer redeploy manual del último
commit de `main` en el dashboard de Vercel) — con el framework ya corregido y las
env vars cargadas, el deploy de producción debería funcionar igual que el preview.

### 3. Stripe — ✅ resuelto (1 ago 2026)
`STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (modo test) cargadas en
Vercel. El webhook endpoint se creó vía API de Stripe apuntando a
`https://real-estate-multi-ai-agent-saa-s.vercel.app/api/stripe/webhook`, escuchando
`checkout.session.completed`, `customer.subscription.updated` y
`customer.subscription.deleted` (los mismos que maneja
`syncSubscriptionFromStripeEvent` en `src/services/billing.ts`); `STRIPE_WEBHOOK_SECRET`
ya cargado también. Son keys de **test mode** — para cobrar de verdad hay que repetir
el proceso con las keys de modo live desde dashboard.stripe.com (o pedírmelo).

### 4. Variables de entorno — ✅ todas resueltas (1 ago 2026)
`OPENAI_API_KEY` y `RESEND_API_KEY`/`RESEND_FROM_EMAIL` ya cargadas en Vercel (production/
preview/development). Verificadas contra las APIs reales antes de cargarlas: el modelo
`gpt-realtime` responde con la key de OpenAI, y se mandó un email de prueba con Resend
usando el dominio verificado `mail.resendcegmas.com` como remitente
(`RESEND_FROM_EMAIL=InmobilIACall <noreply@mail.resendcegmas.com>`).

Con esto el producto queda funcionalmente completo: auth, listings (con fotos), agentes
IA con voz realtime, viewings, schedule, clients, services, knowledge, widget, website,
notifications, plan/billing (Stripe test), y emails de confirmación de cita/lead nuevo.

### 5. Merge a main y deploy de producción — ✅ resuelto (1 ago 2026)
PR #1 mergeado a `main` (squash). `real-estate-multi-ai-agent-saa-s.vercel.app` ya sirve
el build de producción con todo lo de arriba.

### 6. Frontend / landing — ✅ resuelto (1 ago 2026)
Reconstruida en `src/app/page.tsx` a partir del diseño original recuperado del historial
de git (`estatecall-frontend/landing/index.html`, borrado en el commit 7724fed): paleta
esmeralda/marfil, copy en español, hero/cómo-funciona/funciones/propiedades/precios/CTA,
con botones que van a `/login` y `/signup` reales.

### 6b. Error 500 MIDDLEWARE_INVOCATION_FAILED en otro dominio — ✅ resuelto (1 ago 2026)
Vercel había creado un **segundo proyecto duplicado** (`real-estate-multi-ai-agent-saa-s-isqz`,
`prj_5TCe6ctIzthxN65b3a36rm9ulpit`) apuntando al mismo repo de GitHub, seguramente al
reintentar importar el repo desde el dashboard de Vercel. Ese proyecto no tenía ninguna
variable de entorno cargada, así que su middleware fallaba con `MIDDLEWARE_INVOCATION_FAILED`
al intentar crear el cliente de Supabase con `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` undefined.
Es el proyecto detrás del dominio `real-estate-multi-ai-agent-saa-s-is.vercel.app` — **no es
el mismo dominio de producción real** (`real-estate-multi-ai-agent-saa-s.vercel.app`, sin `-is`).

Se cargaron las mismas variables de entorno que en el proyecto correcto y se re-desplegó
para confirmar la causa; el proyecto duplicado ya se **eliminó** por pedido tuyo. El único
proyecto/dominio real para todo (login, Stripe webhook, etc.) es
`real-estate-multi-ai-agent-saa-s.vercel.app`.

### 6c. Widget de voz no respondía / no conectaba — ✅ resuelto (1 ago 2026)
Dos bugs distintos, encontrados al probar el widget con un agente ya activo:

1. **`/api/widget/[businessId]/config` devolvía siempre `agentId: null`.** La consulta
   encadenada `.eq('business_id', x).eq('status', 'live').maybeSingle()` en supabase-js
   devolvía `data: null` sin error, aunque la misma fila existía y el mismo filtro vía REST
   crudo sí la encontraba (confirmado comparando ambas directamente en producción). Se
   reemplazó por un select simple + filtro en JS, que sí funciona.
2. **La llamada nunca conectaba: `POST /api/agents/[agentId]/session` fallaba con
   `OpenAI Realtime error: Invalid URL (POST /v1/realtime/sessions)`.** OpenAI retiró ese
   endpoint; el reemplazo es `/v1/realtime/client_secrets`, con el body anidado bajo
   `session` (`voice` ahora va en `session.audio.output.voice`, `turn_detection` en
   `session.audio.input.turn_detection`) y el token efímero se lee de `value`/`expires_at`
   en vez de `client_secret.value`/`client_secret.expires_at`. Verificado contra la API real
   de OpenAI antes de aplicar el cambio.

Además, cada negocio nuevo ahora siembra su fila de `widgets` automáticamente al crearse
(antes había que guardar el formulario del dashboard una vez para que existiera, y hasta
entonces el endpoint público daba 404), y el Dashboard → Widget ahora incluye una prueba
en vivo del asistente (antes solo mostraba el snippet para embeber en un sitio externo).

### 7. Seguridad (bloqueante, urgente)
Rotar TODOS los tokens que fueron expuestos en el chat: GitHub PAT, Vercel access
token, Supabase service role key y access token (`sbp_...`), las keys de Stripe test
mode, y ahora también las de OpenAI y Resend. Ya van varias veces que se pegan
credenciales reales directo en la conversación — la próxima vez, cargarlas directo en
los dashboards de Vercel/Supabase/Stripe/etc. en vez
de pasarlas por acá.

---

### 8. Overview del dashboard rediseñado (3 ago 2026)
Se reconstruyó `/dashboard` (Overview, `src/app/(dashboard)/dashboard/page.tsx`) para
igualar la apariencia y funcionalidad del dashboard de referencia (capturas del
tutorial original, "EstateCall"): saludo dinámico + badge de agentes en vivo + botón
Actualizar, 5 stat cards con ícono (propiedades activas, conversaciones totales,
visitas agendadas, tasa de conversión, duración promedio), gráfica de tendencia de
14 días (llamadas vs. visitas, `OverviewTrendChart.tsx`, nuevo), panel "Actividad de
hoy" (llamadas hoy/semana, callbacks, agentes activos, propiedades disponibles),
cards de propiedades con badges Destacada/Disponible y camas/baños, y lista de
visitas recientes con cliente, presupuesto y estado. Todo contra datos reales de
Supabase (`conversations`, `appointments`, `listings`, `ai_agents`), sin mocks.

### 9. "Callbacks solicitados" — ✅ resuelto (3 ago 2026)
El Overview ya contaba `outcome = 'escalated'`, pero ningún tool del agente IA lo
disparaba nunca (siempre iba a dar 0). Se agregó la tool `request_callback` en
`src/ai/tools.ts` (el agente la llama cuando el caller pide hablar con un humano) y
su handler en `/api/ai/tools`: crea/actualiza el cliente, marca la conversación con
`outcome: 'escalated'` y crea una notificación (`type: 'system'`) para el negocio. No
hizo falta migración — `escalated` ya era un outcome válido en el esquema.

## VISIÓN A LARGO PLAZO (clave, no perder)

InmobilIACall no debe ser solo "SaaS de bienes raíces", sino una **base reutilizable
(white-label / multi-vertical)** adaptable a varias industrias:

- Bienes raíces → agenda visitas
- Barberías / salones de belleza → agenda cortes y manicuras
- Dealer de carros → agenda test-drives
- Clínicas dentales → agenda citas

Frontend y backend deben ser **configurables por vertical**: nombre de marca, colores,
tipo de agente IA, "propiedades" → "servicios/items", textos. El website builder que ya
trae el starter (`/sites/[slug]`) es la base natural para esto.

**Meta: primero la app perfectamente funcional para bienes raíces; luego convertirla en
plantilla adaptable.**

---

## NOTAS DE TRABAJO

- Entorno: Windows, terminal bash (git-bash).
- Preferencias: explicación paso a paso en español, código comentado en español,
  simple > complejo.
- En trabajo visual/creativo, no correr linters ni tests hasta que el diseño guste.
- Commit y push proactivos para no perder trabajo.
- El backend Express anterior sigue siendo recuperable desde el historial de `main`,
  en el commit `ee3a7d9`.
