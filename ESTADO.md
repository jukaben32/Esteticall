# INMOBILIACALL — ESTADO DEL PROYECTO

> Última actualización: 8 agosto 2026. Se recuperó y fusionó a `main` el
> trabajo de adaptación a República Dominicana (WhatsApp/Evolution API +
> base de conocimiento CONFOTUR) que había quedado en una rama sin fusionar
> — ver "PENDIENTES" punto 17. Sigue pendiente rotar credenciales expuestas
> en el chat (punto 7).

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

### 10. Agentes IA reconstruidos para igualar el dashboard de referencia (3 ago 2026)
`/dashboard/ai-agents` reescrito de punta a punta:
- Panel "Agentes activos (N/límite)" con filas ricas (voz/personalidad/
  sensibilidad, N servicios asignados) y acciones Probar / Activar-Pausar /
  Duplicar / Editar / Eliminar.
- Modal de crear/editar en 2 pasos: Configuración del agente → Asignar
  servicios (checklist con filtro y "Seleccionar todos").
- Galería de 6 plantillas (Alexis, Grace, Maxwell, Luna, Owen, Nora) con
  filtro por categoría, Activar agente / Vista previa.
- Página de detalle "Agent Studio" en `/dashboard/ai-agents/[agentId]` con
  tabs Configurar / Probar en vivo (llamada WebRTC real).

**Requiere migración pendiente**: se agregó la tabla `agent_services` (qué
servicios puede hablar cada agente) y la columna `ai_agents.language` —
migración 22 en `supabase/schema.sql`. **Hay que ejecutar el `schema.sql`
completo en el SQL Editor de Supabase** (es idempotente, seguro re-correrlo
entero) antes de que "Asignar servicios" e "Idioma" funcionen en producción;
mientras tanto esas partes fallarán en el sitio en vivo.

### 11. Servicios reconstruidos para igualar el dashboard de referencia (3 ago 2026)
`/dashboard/services` reescrito: panel "Servicios de la agencia" con filas
reordenables por arrastre (drag handle), duración + precio, editar/eliminar,
toggle activo/inactivo, y "Servicio personalizado"; debajo, un catálogo
colapsable de 32 servicios pre-armados en 8 especialidades con buscador,
filtro por especialidad, alta individual o por lote ("Seleccionar todos").

**Requiere migración pendiente** (misma mecánica que la 22): se agregaron las
columnas `duration_minutes`, `price_type` y `catalog_key` a `business_services`
— migración 23 en `supabase/schema.sql`. Hay que volver a correr el
`schema.sql` completo en el SQL Editor de Supabase antes de que duración,
tipo de precio y el catálogo funcionen en producción.

### 12. Widget reconstruido para igualar el dashboard de referencia (3 ago 2026)
`/dashboard/widget` reescrito de punta a punta (`WidgetsManager.tsx`,
`WidgetFormModal.tsx`, `WidgetPreviewModal.tsx`) para pasar de "un widget por
negocio" a una lista de widgets embebibles, cada uno atado a un agente IA
específico, igual que el dashboard de referencia: card "Embedded Widgets" con
lista de widgets (estado Active/Inactive, posición, agente, interacciones/
impresiones, tabs `<script>` / React JSX / Full HTML con botón Copy), modal
Create/Edit Widget (Live Preview en vivo, nombre, agente, posición, color +
swatches, mensaje de saludo, tema claro/oscuro, toggle "Widget is active") y
modal Widget Preview (mockup "Your website here" + botón flotante).

**Confirmado visible en producción (3 ago 2026, capturas de Juan).** La
migración `01_multi_widgets.sql` ya se corrió y el deploy en Vercel ya sirve
esta versión — Juan ve "Embedded Widgets" con el widget activo y el snippet
copiable, igual que el dashboard de referencia.

### 13. Widget Templates — galería de plantillas (3 ago 2026)
Al video de referencia le faltaba replicar en `/dashboard/widget` la sección
inferior "AI Agent Templates" que sí existe en Agentes IA (punto 10). Se
agregó su equivalente para Widget:

- `WIDGET_TEMPLATES` + `WIDGET_TEMPLATE_CATEGORIES` en `src/constants/index.ts`
  — 6 plantillas (Alexis, Grace, Maxwell, Luna, Owen, Nora, mismas personas
  que `AGENT_TEMPLATES` pero en inglés, con color/posición/tema/saludo
  propios) agrupadas en las mismas 6 categorías que se ven en el video
  ("Home Buying & Selling", "Luxury & Premium Properties", etc.).
- `WidgetTemplatesGallery.tsx` — grid de tarjetas con badge, rol, features,
  "Best for", swatch de color, filtro por categoría y botones "Activate
  Widget" / "Preview", debajo de la lista de "Embedded Widgets".
- `WidgetTemplatePreview.tsx` — modal de vista previa con el botón flotante
  en vivo (mismo componente `FloatingWidgetLauncher` que usa el widget real)
  antes de crear nada.
- `WidgetFormModal.tsx` ahora acepta un `template` opcional: al hacer clic en
  "Activate Widget" se abre el modal de Crear Widget prellenado (nombre
  `"{Agente} – {Rol} Widget"`, color, saludo, tema, posición) y, si ya existe
  un agente activo con el mismo nombre (p. ej. activado antes desde la
  galería de Agentes IA), lo selecciona automáticamente — mismo flujo
  "ya lo creamos, lo uso automáticamente" del video. El usuario revisa y
  confirma con "Create Widget", igual que antes.

Todo funcional y dinámico: cero datos hardcodeados en pantalla, todo sale de
`WIDGET_TEMPLATES` y de los `agents`/`widgets` reales del negocio. No requirió
migración ni cambios de esquema — reutiliza `POST /api/widget` ya existente.
`npx tsc --noEmit` y `npm run build` verificados sin errores antes de subir.

### 14. Website Builder reconstruido + reserva pública dentro del widget (3 ago 2026)
Descubrimiento clave: el **backend del Website Builder ya estaba completo**
(tablas `websites` + `website_team_members/testimonials/specialties/faqs`,
`services/websites.ts` con `getWebsiteContentForBusiness`/`saveWebsiteContent`,
`PUT /api/website`, zod schemas). Lo que faltaba era la UI. También estaban
listas — pero sin UI que las usara — las rutas públicas de reserva
(`/api/widget/public/[businessId]/{services,slots,book}`) y la página
`/portal/[appointmentId]`.

**De paso, se corrigió un bug real**: `sendNewAppointmentOwnerEmail` y
`sendPublicBookingConfirmationEmail` estaban declaradas dos veces en
`src/services/email.ts` (rompía el build). Se eliminó el duplicado que no
coincidía con lo que usa `book/route.ts`.

Construido en esta sesión:
- `WebsiteEditor.tsx` — reescrito por completo: panel DESIGN (3 plantillas
  Clarity/Pulse/Serenity, color primario/secundario, fuente Inter/Playfair/
  Poppins, Site URL, selector de Agente IA) + acordeón CONTENT (Branding,
  Hero Section, About, Services —checkbox sobre `business_services`—, Team
  Members, Testimonials, Partners & Lenders/specialties, FAQ, Contact Info,
  Footer), todo CRUD dinámico. Save / Publish / Unpublish / View Live.
  **Simplificación consciente**: imágenes (logo, hero, foto de equipo) son
  campos de URL, no upload de archivo — no existía infraestructura de
  storage genérica para reutilizar y no quise inventar un bucket nuevo sin
  confirmarlo con Juan.
- `WebsiteTemplateRenderer.tsx` — renderer compartido de las 3 plantillas
  (nav, hero con tarjetas flotantes "AI Voice Care"/"A+"/testimonio, Our
  Specialties, Services, About, Team, Testimonials, FAQ, Contact + mapa
  embebido, Footer). Se usa tanto en el live preview del builder como en el
  sitio público — un solo lugar de verdad.
- `/sites/[slug]/page.tsx` — reescrito: `getPublishedWebsiteContent` +
  `WebsiteTemplateRenderer` + `FloatingWidgetLauncher` en modo embed.
- `WidgetBookingPanel.tsx` (nuevo) + tab "Book" agregado a
  `FloatingWidgetLauncher.tsx` junto al tab existente "Call AI": Select a
  Service → Pick a Date → Pick a Time → Your Details → confirmación
  "Viewing Requested", contra las rutas públicas ya existentes.

**Pendiente si Juan quiere subir el nivel más adelante**: upload real de
imágenes (logo/hero/team) en vez de pegar URL; chequeo de disponibilidad de
slug en vivo mientras se escribe (hoy el error de slug duplicado solo
aparece al Guardar, vía el 409 que ya devuelve la API).

`npx tsc --noEmit` y `npm run build` verificados sin errores antes de subir.

### 15. Support + Settings — nuevas secciones (4 ago 2026)
Al dashboard le faltaban dos secciones que sí existen en el dashboard de referencia
("EstateCall"): Support y Settings. Ambas ya estaban previstas en el esquema
(`support_tickets`/`support_messages` existían desde antes, sin RLS pendiente) pero
nunca tuvieron página ni API.

- **`/dashboard/support`** (`SupportTicketsPanel.tsx`): panel de dos columnas —
  lista de tickets de clientes a la izquierda (nombre, estado, último mensaje) y
  a la derecha el hilo de mensajes + caja de respuesta, con estado vacío "Selecciona
  un ticket" igual al de referencia. Responder mueve el ticket de `open` a
  `in_progress` automáticamente; el estado también se puede cambiar a mano
  (Abierto/En progreso/Resuelto/Cerrado). Nuevo servicio `src/services/support.ts`
  y rutas `GET /api/support-tickets`, `GET/PATCH /api/support-tickets/[ticketId]`,
  `POST /api/support-tickets/[ticketId]/messages`.
- **`/dashboard/settings`** (`SettingsTabs.tsx`): 3 pestañas iguales a la
  referencia — **Perfil del negocio** (`BusinessProfileForm.tsx`: nombre, teléfono,
  email, sitio web, dirección/ciudad/estado/código postal, zona horaria),
  **Horario de atención** (`BusinessHoursEditor.tsx`: toggle por día + hora de
  inicio/fin + duración de turno + resumen "Abierto N días", guardado por lote
  contra el mismo `/api/availability` que ya usaba `/dashboard/schedule`) y
  **Pagos con Stripe** (`StripePaymentsForm.tsx`: llave publicable/secreta de la
  cuenta de Stripe propia del negocio para que sus clientes paguen visitas en
  línea — distinta de la cuenta de Stripe de la plataforma que cobra la
  suscripción del plan). Nuevas rutas `PUT /api/settings/profile` y
  `PUT /api/settings/stripe`.
- Sidebar (`DashboardSidebar.tsx`) ahora incluye "Soporte" y "Configuración" en
  la sección Cuenta.

**Requiere migración pendiente** (misma mecánica que la 22-24): migración 30 en
`supabase/schema.sql` agrega a `businesses` las columnas `website`, `city`,
`state`, `zip_code`, `stripe_publishable_key`, `stripe_secret_key`,
`stripe_connected`. Hay que volver a correr el `schema.sql` completo en el SQL
Editor de Supabase antes de que el Perfil del negocio y Pagos con Stripe
funcionen en producción — mientras tanto esas partes fallarán en el sitio en vivo
(Soporte y Horario de atención ya funcionan porque sus tablas/columnas ya
existían).

`npx tsc --noEmit` y `npm run build` verificados sin errores antes de entregar.

### 16. Client Portal — cuentas de cliente (7 ago 2026)
Auditoría completa contra la transcripción del video de referencia (ver mensaje
del 7 ago): la app ya cumplía casi todo lo que muestra el tutorial. El único
bloque grande que faltaba era el sistema de cuentas de cliente — hasta ahora
`/portal/[appointmentId]` era una página pública de una sola cita (el link
mágico del correo), sin login, sin ver historial, sin poder reprogramar/
cancelar por su cuenta. Se construyó completo:

- **`/portal/signup`**: el cliente crea su cuenta con el mismo correo que usó
  al reservar. El backend (`POST /api/portal/signup`) valida que exista al
  menos una fila en `clients` con ese correo (si no, rechaza — no se puede
  crear una cuenta de la nada) y la crea con `supabase.auth.admin.createUser`
  (`email_confirm: true`, sin ida y vuelta de verificación), enlazando
  **todas** las filas de `clients` con ese correo (`auth_user_id`) — una
  persona puede ser cliente de más de un negocio.
- **`/portal/login`** y **`/portal`** ("My Appointments"): todas las citas del
  cliente logueado, agrupadas Upcoming/Past, con Reschedule (jala horarios
  reales de `/api/widget/public/[businessId]/slots`, deja la cita en
  `pending_confirmation` hasta que el negocio la confirme desde Viewings —
  eso ya mandaba el correo de confirmación, no hizo falta tocarlo) y Cancel
  (ambos mandan correo y notifican al negocio).
- **`/portal/support`**: tickets de soporte del cliente (uno o más negocios),
  con hilo de mensajes — reutiliza `support_tickets`/`support_messages`.
- **Nuevo servicio** `src/services/clientPortal.ts`: todo corre con el
  cliente admin (service role) + verificación de dueño en código, mismo
  patrón que ya usan las rutas públicas de reserva — no hacía falta RLS para
  las escrituras.
- **Bug de RLS corregido** (migración 35): las políticas de `support_tickets`/
  `support_messages` para clientes comparaban `auth.uid()` directo contra
  `client_id` (el id de la fila en `clients`, no el `auth_user_id`) — nunca
  podían coincidir, así que ningún cliente podía ver ni crear sus tickets.
  Estaba así desde el schema original, nunca se había ejercitado porque no
  existía ningún flujo de login de cliente hasta ahora.
- **Bug de middleware corregido**: `updateSession` protegía *todo* el prefijo
  `/portal`, incluyendo `/portal/[appointmentId]` — el link mágico del correo
  de confirmación mandaba al cliente (sin sesión) a hacer login como negocio
  antes de poder ver su cita. Ahora solo `/portal` y `/portal/support`
  requieren sesión de cliente (y redirigen a `/portal/login`, no a `/login`).
- **Fuera de alcance a propósito**: pago en línea por cita ("Pay Now" del
  video). Stripe no tiene procesamiento de pagos en República Dominicana —
  Juan evaluará más adelante integrar Cardnet. El portal muestra el estado
  del pago (badge) pero no intenta cobrar; el dashboard sigue teniendo
  "marcar pagado en efectivo" para el negocio.
- Se agregó también el aviso "Setup" en el Overview (`/dashboard`) que
  faltaba: aparece cuando el perfil del negocio (teléfono/dirección) o el
  horario de atención están incompletos, con botón directo a Configuración.

**Requiere migración pendiente**: correr `schema.sql` completo (sección 35,
solo corrige las 4 políticas de RLS de soporte — no agrega tablas nuevas, el
Client Portal reutiliza `clients.auth_user_id` y las tablas existentes).

`npx tsc --noEmit` y `npm run build` verificados sin errores antes de entregar.

### 17. Adaptación a República Dominicana recuperada de una rama huérfana (8 ago 2026)

**Corrección a la entrada anterior de este mismo archivo** ("INTEGRACIONES
FUTURAS, 7 ago 2026"): decía que WhatsApp/Evolution API y la base de
conocimiento de CONFOTUR no existían. Eso era cierto para lo que estaba en
`main`, pero **no era cierto en general** — el trabajo sí se había hecho, en
una sesión del 4 de agosto, sobre una rama (`claude/new-user-home-page-0xjc4d`)
que nunca se fusionó a `main` (y que además no comparte historia de git con
`main` — el repo se reinició en algún punto). Juan pasó el mismo documento
estratégico de Gemini que ya se había evaluado esa vez, preguntando por qué
no se veía nada — la respuesta fue esta: no se perdió, se recuperó y se
fusionó ahora, reconciliado a mano (sin merge base posible) con todo lo
construido en `main` desde entonces (Client Portal, Website Builder, el
`schema.sql` idempotente).

**Reafirmado, no cambiado:** la decisión de esa sesión de *no* construir
pgvector/Pinecone ni el enrutamiento multi-agente del documento de Gemini
sigue en pie — es complejidad de infraestructura que el tamaño actual del
producto no necesita. Ver el razonamiento completo en la sección "Fase 0"
más abajo (se conservó tal cual).

**Qué se recuperó y cómo quedó reconciliado:**

- **WhatsApp vía Evolution API (Fase 1 completa):** cliente REST
  (`src/lib/evolutionApi.ts`), capa de negocio (`src/services/whatsapp.ts`) y
  tabla `whatsapp_connections` (una por negocio). `/dashboard/whatsapp` +
  `WhatsappManager.tsx` para conectar por QR, elegir agente, activar/
  desactivar. Webhook `POST /api/whatsapp/webhook/[businessId]` con delay
  aleatorio anti-detección de bot.
  - **Refactor clave:** la ejecución de tools del agente (`search_listings`,
    `book_viewing`, etc.) se extrajo de `/api/ai/tools/route.ts` a
    `src/ai/executeTool.ts`, parametrizada por `clientSource`, para que voz
    y WhatsApp **compartan exactamente la misma lógica de negocio** — nunca
    puede divergir por canal. Al extraerla se preservaron todos los fixes
    que main ya tenía y la rama vieja no (guard de fecha inválida en
    `check_availability`, `.catch()` silencioso en el email de confirmación,
    logging de errores) — la rama vieja era de antes de esos fixes.
  - `src/ai/textAgent.ts`: agente en modo texto (Chat Completions +
    function-calling, `gpt-4o-mini` — deliberadamente el modelo más barato,
    ver la nota contra enrutamiento de modelos prematuro más abajo),
    reutilizando las mismas tools vía `executeAiTool`.
  - **Solo falta contratar un VPS y desplegar Evolution API ahí** — el
    código de la app ya está listo; sin `EVOLUTION_API_URL`/
    `EVOLUTION_API_KEY` configuradas, `/dashboard/whatsapp` muestra un
    mensaje claro de "falta el servidor" en vez de fallar.
- **Base de conocimiento de plataforma + CONFOTUR:** `buildSystemPrompt()`
  ahora inyecta tanto `knowledge_documents` (privado por negocio) como
  `platform_knowledge_documents` (compartido por todos los negocios
  afiliados — CONFOTUR/Ley 158-01, Ley 108-05 — nuevo, migración 36).
  Administrado desde `/admin/knowledge`, visible solo para
  `PLATFORM_ADMIN_EMAILS` (`src/lib/platformAdmin.ts`, allowlist por env var
  — no hay rol de "admin de plataforma" en el esquema, deliberado mientras
  InmobilIACall tenga un solo operador).
  - **Las 9 FAQs de CONFOTUR/Ley 108-05 que se cargaron el 4 de agosto** (vía
    REST API directo contra Supabase) puede que ya no estén en la base de
    datos actual — no hay forma de confirmarlo desde este entorno (sin
    acceso de red a Supabase). Verificar en `/admin/knowledge` una vez
    desplegado y volver a cargarlas si hace falta; el contenido verificado
    contra la DGII debería estar en el historial de esa sesión si hay que
    reconstruirlo.

**Requiere, antes de que esto funcione en producción:**
1. Correr `schema.sql` completo en el SQL Editor de Supabase (migración 36:
   `platform_knowledge_documents`, `whatsapp_connections`, amplía los checks
   de `conversations.channel`/`clients.source` con `'whatsapp'`).
2. Cargar en Vercel (production/preview/development): `PLATFORM_ADMIN_EMAILS`
   (tu email, para poder entrar a `/admin/knowledge`). `EVOLUTION_API_URL` y
   `EVOLUTION_API_KEY` solo cuando haya un VPS con Evolution API desplegado —
   mientras tanto el dashboard de WhatsApp funciona igual, solo no conecta.

`npx tsc --noEmit` y `npm run build` verificados sin errores antes de subir.

Documento de planificación original de esa sesión (4 ago 2026), preservado
tal cual por el detalle técnico que trae (payloads del webhook, razonamiento
completo contra pgvector/enrutamiento multi-agente, contenido de CONFOTUR
verificado):

#### HOJA DE RUTA: Adaptación al mercado de República Dominicana (4 ago 2026)

Contexto de negocio: más del 90% de los leads en RD llegan por WhatsApp (no email),
hay diáspora/inversionistas extranjeros comprando proyectos turísticos (Punta Cana,
Samaná, Las Terrenas), y existen beneficios legales que son argumento de cierre (Ley
CONFOTUR 158-01, Ley 108-05 de Registro Inmobiliario). Se evaluó un documento
estratégico con propuestas más ambiciosas (pgvector/Pinecone día uno, 4 "agentes"
especializados con enrutamiento de modelos, notas de voz y PDFs desde el arranque) y
se decidió **no** construir esa versión todavía — es complejidad de infraestructura
que el tamaño actual del producto no necesita. El plan de abajo reutiliza al máximo
la arquitectura de "1 agente + tools" que ya existe, y cada fase es aditiva: no
depende de deshacer nada de una fase anterior.

- **Fase 0 — Conectar la base de conocimiento al agente IA.** ✅ hecho (detalle abajo).
- **Fase 1 — WhatsApp vía Evolution API** (fase 2 futura: Twilio WhatsApp Business
  API oficial). Planificado, ver sección "Integración de WhatsApp" más abajo.
  Pendiente de decidir: dónde hostear Evolution API y si cada agencia conecta su
  propio número o se usa uno compartido de la plataforma.
- **Fase 2 — Campos de mercado dominicano en `listings`**: `currency` (hoy no
  existe — gran parte del inventario en RD se cotiza en USD), `confotur_eligible`,
  `delivery_date` (proyectos en plano/pre-construcción).
- **Fase 3 — Tool `calculate_roi`** para el agente: cálculo determinístico de
  retorno sobre listings `vacation_rental` (que ya existen desde antes) — no un LLM
  "adivinando" cifras financieras. ✅ hecho (8 ago 2026, ver sección 22 más abajo).
- **Fase 4 — Generador de fichas/copy con IA** en el dashboard de Propiedades: una
  herramienta interna (botón "Generar con IA"), no un agente conversacional — así no
  compite en complejidad con el agente de WhatsApp/voz. ✅ hecho (8 ago 2026, ver
  sección 23 más abajo).
- **Fase 5 — Notas de voz y PDFs por WhatsApp.** Se deja para después de que el
  flujo de texto de la Fase 1 esté probado en producción; agregan trabajo real
  (transcripción de audio, generación de PDF) que no es necesario para validar el
  mercado.

Por qué este orden no rompe nada: Fase 0 no toca WhatsApp ni listings; Fase 1 no
toca listings ni el agente de voz existente (es un canal nuevo); Fase 2 son columnas
nuevas con default, que Fase 1 y Fase 3 pueden usar después pero no necesitan de
entrada; Fase 3 depende solo de datos que ya existen; Fase 4 es independiente de
todo lo anterior; Fase 5 es la única que depende de que la Fase 1 ya esté en
producción.

##### Fase 0 — Base de conocimiento conectada al agente IA (4 ago 2026) ✅

`knowledge_documents` ya existía completo (dashboard "Conocimiento", CRUD, categorías)
pero **nunca se leía en la sesión del agente** — `buildSystemPrompt()`
(`src/ai/tools.ts`) solo recibía `business`, `agent` y `listings`. Tampoco existía ya
una función `formatKnowledgeForPrompt` en `src/services/knowledge.ts` con un
comentario diciendo que se usaba en el prompt del agente — pero no se llamaba desde
ningún lado. Se conectó:

- `src/app/api/agents/[agentId]/session/route.ts`: ahora también trae los documentos
  de conocimiento del negocio (`listKnowledgeDocuments`) en paralelo a los listings,
  y se los pasa a `buildSystemPrompt`.
- `src/ai/tools.ts`: `buildSystemPrompt` acepta `knowledgeDocs` y los inyecta en el
  prompt (reutilizando `formatKnowledgeForPrompt`) con una instrucción explícita de
  que el agente solo puede afirmar datos legales/fiscales que estén en esos
  documentos — pensado para poder cargar ahí el contenido sobre CONFOTUR (Ley 158-01)
  y Ley 108-05 sin que el modelo invente cifras, plazos o porcentajes de exención.

Se optó por **inyección directa en el prompt** (mismo patrón que ya se usa con
`listings`) en vez de agregar una tool de búsqueda: con el volumen de documentos
esperado por negocio (decenas, no miles) es más simple y más confiable — el modelo
no puede "olvidarse" de llamar a una tool para buscar algo que ya está siempre
presente. Si el volumen de conocimiento crece mucho (varias desarrolladoras, muchos
proyectos), ahí se justifica agregar `pgvector` (extensión nativa de Postgres/
Supabase, no un vendor externo como Pinecone) + una tool de búsqueda semántica — no
antes.

No requiere migración de esquema — usa `knowledge_documents` tal cual ya existía.
`npx tsc --noEmit` y `npm run build` verificados sin errores.

**Contenido real cargado de prueba (4 ago 2026):** se investigaron 9 FAQs sobre
CONFOTUR/Ley 158-01 y Ley 108-05 (Registro Inmobiliario) — verificadas contra DGII,
el texto oficial de las leyes y la firma Guzmán Ariza. **Es contenido informativo,
no asesoría legal/fiscal — recomendado que un abogado/contador dominicano lo
revise** antes de confiar en él para clientes reales; los montos y porcentajes
pueden cambiar si se modifica la ley.

##### Fase 0b — Conocimiento de plataforma (compartido entre todos los negocios) (4 ago 2026) ✅

Las 9 FAQs de CONFOTUR/Ley 108-05 se cargaron primero en `knowledge_documents` del
negocio `sophia.tec` (el negocio propio de Juan, afiliado a InmobilIACall para
practicar y para su propia operación de corretaje) — pero eso las dejaba **privadas
de ese único negocio**, porque `knowledge_documents.business_id` está aislado por
RLS (correcto para el FAQ propio de cada agencia, incorrecto para hechos legales de
todo el mercado dominicano). InmobilIACall es la plataforma (el SaaS); `sophia.tec`
es apenas el primer negocio afiliado — cualquier agencia nueva que se registre debe
heredar automáticamente el conocimiento de mercado (CONFOTUR, Ley 108-05, y lo que
se agregue después) sin tener que volver a cargarlo a mano, y si la ley cambia debe
bastar con actualizarlo una sola vez.

Se agregó una tabla nueva, separada de `knowledge_documents`, **sin `business_id`**:

- `supabase/schema.sql` — migración 31: `platform_knowledge_documents` (`title`,
  `content`, `category`, `source_url`). RLS habilitado con política de lectura
  pública (`for select using (true)`) — es información no sensible y ya publicada;
  todavía no hay UI de dashboard para editarla, así que por ahora se escribe solo
  vía `service_role` (aplicado directo a producción con el Management API de
  Supabase, ya que el conector MCP de Supabase de esta sesión apunta a otra cuenta
  sin acceso a este proyecto).
- Las 9 FAQs se movieron de `sophia.tec` a `platform_knowledge_documents` (ya no
  están duplicadas — `sophia.tec` solo conserva su única FAQ realmente propia,
  "¿Cómo agendo una visita a una propiedad?").
- `src/services/knowledge.ts`: nueva `listPlatformKnowledgeDocuments()` (sin filtro
  de negocio); `formatKnowledgeForPrompt()` ahora acepta también el tipo de
  plataforma.
- `src/ai/tools.ts`: `buildSystemPrompt()` recibe `platformKnowledgeDocs` además de
  `knowledgeDocs` e inyecta **dos secciones separadas y rotuladas** en el prompt
  ("conocimiento general del mercado, aplica a todo negocio en esta plataforma" vs.
  "base de conocimiento propia de este negocio") — así el agente sabe distinguir
  origen si hace falta, aunque la instrucción de no inventar cifras aplica a ambas.
- `src/app/api/agents/[agentId]/session/route.ts`: trae `platformKnowledgeDocs` en
  paralelo a todo lo demás y se lo pasa al prompt — **todo negocio, presente o
  futuro, recibe este conocimiento automáticamente**, sin que Juan tenga que
  cargarlo de nuevo cada vez que afilie una nueva agencia.
- `src/types/database.ts` / `src/types/index.ts`: tipo `PlatformKnowledgeDocument`.

`npx tsc --noEmit` y `npm run build` verificados sin errores.

**Pantalla de administración agregada (4 ago 2026) ✅ — Fase 0b cerrada.**
`/admin/knowledge`, fuera del dashboard de cada negocio (no confundir con
`/dashboard`, que es por negocio afiliado). Protegida por
`PLATFORM_ADMIN_EMAILS` (allowlist por variable de entorno — no existe un rol de
"admin de plataforma" en el esquema, y no hacía falta construir uno para dos
cuentas). Ya cargada en Vercel (production/preview/development) con
`jcbjm03@gmail.com,casilla.bethania@gmail.com` — los dos correos confirmados.
CRUD completo (crear/editar/eliminar) contra `platform_knowledge_documents` desde
`src/components/PlatformKnowledgeManager.tsx`; las rutas API
(`/api/admin/knowledge`, `/api/admin/knowledge/[documentId]`) verifican el email
antes de escribir con el cliente admin (service role), porque la tabla solo tiene
RLS de lectura pública. Enlace "Admin de plataforma" visible en el sidebar del
dashboard solo para esas dos cuentas.

#### Fase 1 — Integración de WhatsApp (4 ago 2026) — código completo, falta el VPS

Implementada de punta a punta contra Evolution API (self-hosted). **No probada
en vivo todavía** — Juan no tiene VPS aún; en cuanto lo contrate y despliegue
Evolution API ahí, solo falta cargar `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` en
Vercel y probar el flujo real de conexión/mensajes. Todo lo demás (voz, widget,
email) sigue intacto — WhatsApp es un canal más, no un reemplazo.

##### Esquema (migración 32, ya aplicada en producción)

- `conversations.channel` y `clients.source` ahora incluyen `'whatsapp'`. Call
  Log, Analítica y Clientes ya funcionan para WhatsApp sin ningún cambio —
  leen de `conversations`/`conversation_messages`/`clients` sin filtrar por
  canal, igual que ya pasaba con el widget.
- Nueva tabla `whatsapp_connections`: una conexión por negocio (`business_id`
  único), `agent_id` (qué agente IA responde), `instance_name` +
  `instance_token` (credenciales de la instancia en Evolution API — separadas
  del `EVOLUTION_API_KEY` global, que solo crea/borra instancias), `status`
  (`disconnected`/`connecting`/`connected`), `is_enabled`. RLS igual patrón
  que `widgets` (`is_business_owner`).

##### Backend

- `src/lib/evolutionApi.ts`: cliente REST de Evolution API v2 (crear
  instancia, QR, estado de conexión, configurar webhook, enviar texto, borrar
  instancia). Verificado contra la documentación oficial y ejemplos de la
  comunidad — Evolution API ha cambiado contratos entre versiones mayores
  antes, así que si algo falla al probar contra el VPS real, lo primero es
  comparar contra `https://doc.evolution-api.com/v2`. Lanza
  `EvolutionApiNotConfiguredError` si `EVOLUTION_API_URL`/`EVOLUTION_API_KEY`
  no están seteadas, para que el dashboard muestre un mensaje claro en vez de
  romperse.
- `src/services/whatsapp.ts`: capa de negocio sobre esa tabla + ese cliente
  (`connectWhatsapp`, `refreshWhatsappStatus`, `disconnectWhatsapp`,
  `sendWhatsappMessage`, etc.).
- **Refactor sin cambio de comportamiento**: la ejecución de tools del agente
  (`search_listings`, `book_viewing`, `capture_lead`, `request_callback`,
  etc.) se extrajo de `/api/ai/tools/route.ts` a `src/ai/executeTool.ts`
  (`executeAiTool()`), para que la llamada de voz/widget y WhatsApp compartan
  exactamente la misma lógica de negocio — nunca puede divergir por canal.
  `clients.source` ahora se pasa como parámetro (`ai_call` para voz,
  `whatsapp` para WhatsApp) en vez de estar hardcodeado.
- `src/ai/textAgent.ts`: el agente en **modo texto** — un loop de function-
  calling contra OpenAI Chat Completions (`gpt-4o-mini`, sin necesidad de
  enrutamiento de modelos) que reutiliza las mismas `REALTIME_TOOLS` (convertidas
  al formato de Chat Completions) y el mismo `executeAiTool()` que la voz.
- `POST /api/whatsapp/webhook/[businessId]`: recibe `MESSAGES_UPSERT` de
  Evolution API, resuelve/crea el `client` por teléfono, reutiliza la
  conversación de WhatsApp abierta si el último mensaje fue hace menos de 6h
  (si no, cierra la anterior como `completed` y abre una nueva — como una
  llamada nueva), guarda el mensaje entrante, corre el agente de texto, guarda
  y envía la respuesta. Incluye un delay aleatorio de 2-5s antes de responder
  (reduce la señal de "esto es un bot" — mismo criterio anti-baneo que ya
  estaba planificado). Sin verificación de firma (Evolution API no firma sus
  webhooks) — el `businessId` en la URL más validar que la conexión existe y
  está activa es el límite de confianza aceptado para esta fase.
- `buildSystemPrompt()` ahora recibe `channel: 'voice' | 'text'` para no
  decirle a un chat de WhatsApp "esto es una llamada telefónica".

##### Dashboard

- `/dashboard/whatsapp` + `src/components/WhatsappManager.tsx`: selector de
  agente IA → "Conectar WhatsApp" → QR (se refresca solo cada 4s hasta quedar
  `connected`) → una vez conectado, número vinculado, cambiar de agente,
  activar/desactivar respuesta automática, desconectar. Si
  `EVOLUTION_API_URL`/`EVOLUTION_API_KEY` no están configuradas, el botón
  "Conectar" muestra una tarjeta explicando exactamente eso (falta el VPS) en
  vez de fallar en silencio.
- Nuevo ítem "WhatsApp" en el sidebar, junto a Widget.

##### Pendiente — lo único que falta para que esto funcione en producción

1. **Contratar un VPS** (Railway, Fly.io, un droplet de DigitalOcean — lo que
   sea, necesita Docker y estar prendido 24/7; Vercel no sirve porque
   Evolution API mantiene viva la sesión de WhatsApp Web) y desplegar
   Evolution API ahí.
2. Cargar `EVOLUTION_API_URL` y `EVOLUTION_API_KEY` en Vercel
   (production/preview/development) — mismo patrón que las demás API keys.
3. Probar el flujo real una vez: conectar (escanear QR), mandar un mensaje de
   WhatsApp de prueba, confirmar que el agente responde y que
   `conversations`/`clients` se llenan igual que con el widget.
4. Verificar los payloads reales del webhook de Evolution API contra lo que
   asume `src/app/api/whatsapp/webhook/[businessId]/route.ts`
   (`event`/`data.key.remoteJid`/`data.message.conversation`) — se armó a
   partir de la documentación pública, no de una instancia real corriendo.

`npx tsc --noEmit` y `npm run build` verificados sin errores — todo compila y
las rutas existen; lo que no se pudo probar es la integración end-to-end real
con un servidor Evolution API vivo, por no tener VPS todavía.

### 18. Fase 2 completada: moneda, CONFOTUR y fecha de entrega en `listings` (8 ago 2026)

Siguiente fase de la hoja de ruta de arriba, tal como estaba planificada. Antes
de esto Cardnet se evaluó como reemplazo de Stripe (para pagos por cita y
suscripción de la plataforma) y **se pospuso explícitamente** — no hay cuenta
de Cardnet creada todavía y la documentación real de su API
(`developers.cardnet.com.do`) no se pudo leer desde este entorno (sin acceso
de red saliente a ese dominio). Queda pendiente para más adelante, con Hermes
buscando la documentación real cuando Juan lo pida.

**Qué se agregó, de punta a punta:**

- `supabase/schema.sql` (sección 37, idempotente): `listings.currency` (`USD`/
  `DOP`, default `'USD'`, con check constraint), `listings.confotur_eligible`
  (boolean, default `false`), `listings.delivery_date` (date, nullable — para
  proyectos en preventa/construcción).
- `src/types/database.ts`, `src/constants/index.ts` (`CURRENCIES`),
  `src/validations/index.ts` (`listingSchema` ampliado).
- `src/lib/listingFormat.ts`: `formatListingPrice()` (antepone `$`/`RD$` según
  la moneda del listing — antes todo precio se mostraba con `$` fijo, lo cual
  era ambiguo para listings en DOP) y `formatDeliveryDate()` (formatea
  `YYYY-MM-DD` a "mes año" en español **sin** `toLocaleDateString(locale)` —
  esa combinación depende de los datos ICU del runtime, que difieren entre
  Node (server render) y el navegador, y ya había causado un hydration
  mismatch antes en `lib/formatDate.ts`; mismo patrón reutilizado aquí).
- `src/services/listings.ts`: `createListing()` guarda los tres campos nuevos.
- Formularios (`NewListingForm.tsx`, `EditListingModal.tsx`): selector de
  moneda junto al precio, campo de fecha de entrega, checkbox CONFOTUR.
- Vista de detalle (`PropertyDetailView.tsx`): badge dorado "Elegible
  CONFOTUR" y badge teal con la fecha de entrega, cuando aplican.
  `ListingsTable.tsx` y el overview del dashboard usan `formatListingPrice()`
  en vez de un `$` fijo.
- `src/ai/tools.ts` / `src/ai/executeTool.ts`: el resumen de cada propiedad en
  el prompt del agente (voz y WhatsApp, comparten el mismo `buildSystemPrompt`)
  ahora menciona "CONFOTUR-eligible (Ley 158-01 tax exemption)" y la fecha de
  entrega cuando existen — son argumentos de cierre reales, no algo que el
  agente deba inventar. Se agregó también `confoturOnly` como filtro opcional
  a la tool `search_listings`, para cuando el cliente pregunta específicamente
  por propiedades con exención fiscal.

`npx tsc --noEmit`, `eslint` sobre los archivos tocados y `npm run build`
verificados sin errores antes de subir (commit `0826755`).

**Requiere, antes de que esto funcione en producción:** correr la sección 37
de `schema.sql` en el SQL Editor de Supabase (ver bloque abajo). Sin esto los
tres campos nuevos no existen en la base de datos real y cualquier alta/edición
de propiedad que los toque fallará.

```sql
-- 37. LISTINGS — Dominican Republic market fields (roadmap Fase 2)
alter table listings add column if not exists currency text not null default 'USD';
alter table listings drop constraint if exists listings_currency_check;
alter table listings add constraint listings_currency_check check (currency in ('USD', 'DOP'));
alter table listings add column if not exists confotur_eligible boolean not null default false;
alter table listings add column if not exists delivery_date date;
```

### 19. Website Builder: bug real de pérdida de contenido al publicar (8 ago 2026)

Juan reportó que al llenar la landing del builder por completo y darle a **Publish**,
todo el contenido desaparecía — no podía avanzar a probar nada de lo que viene
después (reservas desde el sitio público, el widget embebido, etc.). Mandó 40
capturas de la demo de referencia (video del tutorial) con transcripción marcada
por tiempo para documentar qué debía pasar; no hizo falta usarlas todas porque
la causa se encontró leyendo el código directamente.

**Causa real:** `handlePublishClick()` en `WebsiteEditor.tsx`, cuando el negocio
todavía no tiene el add-on Website Builder ($29/mes) activo, redirigía
directo a Stripe Checkout (`window.location.href = ...`) **sin guardar antes**.
Todo lo escrito en el formulario vivía solo en estado local de React — al
salir de la página para pagar, se perdía. Cuando Stripe redirigía de vuelta,
la página se volvía a renderizar desde cero con lo que hubiera en la base de
datos (nada nuevo), así que el usuario volvía a un formulario vacío.

**Arreglado:** `handlePublishClick` ahora siempre guarda el borrador primero
(`await save()`) y solo redirige a Stripe si ese guardado tuvo éxito; si el
add-on ya está activo, guarda y publica en un solo paso como antes.

**Dos causas relacionadas, arregladas de paso:**
- Logo y Hero Image guardaban la imagen como base64 embebido directamente en
  el formulario, en vez de subirla a Storage como ya hacían About Photo y
  Team Photo (arreglado el 8 ago 2026 antes en esta misma sesión). Una imagen
  de varios MB podía hacer que el `PUT /api/website` completo superara el
  límite de tamaño de payload de la función serverless (Vercel: ~4.5MB) y
  fallara — y como cada Save subsiguiente reenviaba ese mismo base64 completo
  otra vez, el problema no era solo al subir la imagen sino en cualquier guardado
  después. Ahora usan `/api/website/photo` (`kind=logo` / `kind=hero`), con
  estado de carga y error visibles, igual que About/Team.
- `save()` no envolvía el `fetch` en try/catch: una respuesta no-JSON (por
  ejemplo un 413 de la plataforma) hacía que `res.json()` lanzara una excepción
  sin capturar, dejando el botón trabado en "Saving..." sin ningún mensaje de
  error — parecía que el contenido "se borraba solo" cuando en realidad nunca
  se había guardado y tampoco había forma de saberlo. Ahora se captura y se
  muestra un error claro.

`npx tsc --noEmit`, `eslint` y `npm run build` verificados sin errores antes
de subir (commit `21a8fbb`). No se pudo probar el flujo de pago real de Stripe
end-to-end desde este entorno (sin acceso de red a Stripe ni tarjeta de
prueba) — verificar en producción que Publish ya no pierde el contenido al
pagar el add-on por primera vez.

### 20. Bucle infinito de redirección en /portal/login (8 ago 2026)

Juan probó el flujo completo del Client Portal (booking → email → "View in
Client Portal") siguiendo las 40 capturas de referencia que mandó del video
del tutorial, y encontró que el enlace del correo terminaba en
`/portal/login?redirect=/portal/login` en bucle infinito
(`ERR_TOO_MANY_REDIRECTS`).

**Causa:** `src/lib/supabase/middleware.ts` protegía cualquier ruta que
empezara con `/portal/` (`path.startsWith(`${p}/`)` para `p='/portal'`),
lo cual incluía `/portal/login`, `/portal/signup` y `/portal/[appointmentId]`
— justo las rutas que el propio comentario del archivo decía que debían
quedar públicas. Un visitante sin sesión en `/portal/login` se redirigía a
sí mismo sin fin, y de paso el signup y el enlace mágico de confirmación
de cita también quedaban bloqueados detrás de un login que no debían tener.

**Arreglado:** como `/portal` y `/portal/support` son páginas hoja sin rutas
anidadas, ahora se comparan con match exacto (`PROTECTED_PORTAL_PATHS.includes(path)`)
en vez de también matchear por prefijo.

`npx tsc --noEmit`, `eslint` y `npm run build` verificados sin errores antes
de subir (commit `6330561`).

### 21. Client Portal: "Pay Now" y correo al agente al cancelar (8 ago 2026)

Siguiendo con las pruebas contra las 40 capturas de referencia, Juan encontró
dos huecos reales más una vez que el login del portal quedó arreglado:

1. **Cancelar no emailaba al agente.** El route de cancelación solo mandaba
   correo al cliente y creaba una notificación in-app para el negocio —
   nunca un correo. Reserva y reprogramación sí notifican por correo a
   ambas partes; cancelación quedó inconsistente. Se agregó
   `sendAppointmentCancelledOwnerEmail` en `src/services/email.ts` y se
   llama junto al resto en el route de cancel.

2. **"Pay Now" nunca aparecía.** `appointments.payment_status` se quedaba
   siempre en `'not_required'` porque `createAppointment()` nunca lo
   calculaba a partir del precio del servicio reservado — a pesar de que
   las columnas `payment_amount`/`payment_currency`/`stripe_checkout_session_id`
   ya existían en el schema desde antes (funcionalidad a medio construir,
   probablemente heredada del template original). Ahora, si el servicio
   reservado tiene un precio `'fixed'` o `'starting_at'`, la cita nace con
   `payment_status='pending'` y `payment_amount` = precio del servicio —
   `'price_range'` y `'call_for_price'` se dejan en `'not_required'` porque
   no hay un monto único que cobrar.

**Con eso resuelto, se construyó el botón "Pay Now" completo** en
`PortalAppointmentsList.tsx` / `PortalPayModal.tsx`, con dos opciones:

- **Pagar en efectivo** (`/api/portal/appointments/[id]/pay-cash`): mismo
  efecto que ya tenía el lado del negocio en `/dashboard/viewings` (marcar
  `payment_status='cash'`), ahora también disparable por el cliente —
  emails a ambas partes.
- **Pagar en línea** (`/api/portal/appointments/[id]/pay-online` +
  `.../pay-online/confirm`): cada negocio cobra con su **propia** cuenta de
  Stripe — las llaves que ya guardan en Configuración vía
  `StripePaymentsForm` (distintas de las llaves de suscripción de la
  plataforma, que solo cobran a los NEGOCIOS, no a sus clientes). Se crea un
  Checkout Session con esa llave por el monto del servicio. Como no hay un
  webhook por negocio (solo el de la plataforma, para su propia cuenta), la
  vuelta desde Stripe (`?paid=<id>&session_id=...`) se verifica del lado del
  servidor contra la cuenta de ese negocio específico antes de marcar
  pagado — evita que alguien falsifique el query param y se marque como
  pagado sin pagar. Emails a ambas partes también.

`npx tsc --noEmit`, `eslint` y `npm run build` verificados sin errores antes
de subir (commit `7718c46`). No se pudo probar el pago en línea real
end-to-end desde este entorno (sin acceso de red a Stripe ni una cuenta de
Stripe conectada de prueba) — verificar en producción con una cuenta de
Stripe real conectada en Configuración.

### 22. Fase 3 del roadmap: tool `calculate_roi` (8 ago 2026)

Siguiente fase de la hoja de ruta (ver "Por qué este orden no rompe nada" más
abajo). Cambio puramente aditivo — un tool nuevo en `REALTIME_TOOLS` y un
`case` nuevo en `executeAiTool` (`src/ai/executeTool.ts`) — no toca ninguna
tool ni ruta existente.

**Cómo funciona:** el agente (voz o WhatsApp, comparten la misma
`executeAiTool`) llama a `calculate_roi` con el `listingCode` y el precio de
compra hipotético que el cliente mencione en la conversación — ese precio no
existe en la base de datos porque el listing es `vacation_rental` (categoría
distinta de `sale`), así que tiene que venir de lo que diga el cliente. El
tool anualiza la tarifa de renta ya conocida del listing según su
`rental_period` (365 noches / 52 semanas / 12 meses) y aplica dos supuestos
conservadores por defecto — 65% de ocupación, 25% de gastos sobre el ingreso
bruto (administración, mantenimiento, impuestos) — que el que llama puede
sobreescribir. Ambos supuestos se devuelven explícitos en el resultado
(`assumptions: { occupancyPct, annualExpensesPct }`) y `buildSystemPrompt`
instruye al agente a declararlos siempre al compartir el ROI, para que quede
claro que son una estimación y no el desempeño real de la propiedad.

Solo aplica a listings `vacation_rental` con `rental_period` definido — un
listing de venta no tiene una tarifa de renta que anualizar, y el tool
devuelve un error legible en vez de inventar un número si no aplica.

`npx tsc --noEmit`, `eslint` y `npm run build` verificados sin errores antes
de subir (commit `145811c`).

### 23. Fase 4 del roadmap: generador de descripciones con IA (8 ago 2026)

Botón "Generar con IA" junto al campo Descripción en `EditListingModal` —
herramienta interna del dashboard (un solo llamado a Chat Completions, sin
tools ni estado de conversación), no un agente conversacional, tal como
especificaba la hoja de ruta.

Nuevo endpoint `POST /api/listings/[listingId]/generate-copy`: toma los
campos que el usuario ya llenó en el formulario (tipo, precio, specs,
comodidades, CONFOTUR, fecha de entrega) — no requiere que la propiedad esté
guardada todavía, solo que exista (el botón vive en Editar, no en Crear,
porque el formulario de creación no tiene campo de descripción) — y genera
un párrafo de 3-5 oraciones en español, instruido explícitamente a usar solo
los datos dados y no inventar comodidades, ubicaciones o cifras. El
resultado llena el campo pero no se guarda solo; el usuario lo revisa y
edita antes de darle Guardar, igual que si lo hubiera escrito a mano.

Cambio aditivo: nueva ruta + un botón nuevo en un formulario existente, sin
tocar ningún flujo de guardado existente. `npx tsc --noEmit`, `eslint` y
`npm run build` verificados sin errores antes de subir (commit `6355806`).

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
## ACTUALIZACION 9 DE AGOSTO DE 2026

Se dejo preparado el proyecto de referencia para quedar al mismo nivel
funcional que el SaaS medico usado como fuente de verdad visual y funcional.

- Se compararon ambos proyectos para tomar como referencia la estructura del
  dashboard, Knowledge, Widget, WhatsApp y Website.
- Se genero y ejecuto la migracion SQL de Supabase necesaria para cerrar la
  brecha de esquema entre ambos proyectos.
- La migracion incluyo tablas nuevas, cambios `ALTER`, RLS, policies y grants
  para soportar la capa clinica/operativa y la integracion de WhatsApp.
- Se confirmo que el SQL corrio sin errores en Supabase.
- Queda pendiente seguir con las pruebas reales cuando el VPS este disponible.
