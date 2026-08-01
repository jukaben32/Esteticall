# ESTATECALL — ESTADO DEL PROYECTO

> Última actualización: julio 2026, tras completar las páginas de dashboard que
> faltaban (ver sección "Dashboard completo" más abajo).

## RESUMEN RÁPIDO

El backend Express + Prisma **ya no existe**. Fue reemplazado por completo por una
app **Next.js 14 full-stack** (el starter Real-Estate-AI-Calling-Agent-SaaS,
implementado). Todo vive ahora en un solo proyecto: frontend, API y lógica de negocio.

El dashboard ya tiene las 14 secciones de su barra lateral implementadas (antes solo
3 de 14 existían — ver detalle abajo). Fase actual: **ejecutar el schema en Supabase,
corregir el deploy de Vercel y terminar el frontend público/landing**.

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

### 4. Variables de entorno que todavía faltan (bloqueante para funcionalidad completa)
Con lo cargado hoy, el dashboard funciona (auth, listings, agentes, viewings, schedule,
clients, services, knowledge, widget config, website, notifications, plan/billing con
Stripe test — todo lectura y escritura contra Supabase/Stripe reales). Sin esto, dos
funciones fallan de forma esperada:

| Variable | Bloquea | Dónde conseguirla |
|---|---|---|
| `OPENAI_API_KEY` | La voz del agente IA (Realtime): `/api/agents/[agentId]/session`, el widget de voz, `widget-demo`, `/embed/[businessId]` | platform.openai.com/api-keys |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Emails de confirmación de cita y de lead nuevo (`src/services/email.ts`) — no rompen el flujo, simplemente no se envía el correo | resend.com/api-keys |

Cuando se agreguen, avisar para cargarlas también en Vercel (mismo proceso que se
usó hoy con las de Supabase y Stripe).

### 6. Frontend nuevo
La landing actual es la del starter, en inglés y genérica. Se está construyendo una
propia.

### 7. Seguridad (bloqueante, urgente)
Rotar TODOS los tokens que fueron expuestos en el chat: GitHub PAT, Vercel access
token, Supabase service role key y access token (`sbp_...`), y las keys de Stripe test
mode. Ya van varias veces que se pegan credenciales reales directo en la conversación
— la próxima vez, cargarlas directo en los dashboards de Vercel/Supabase/Stripe en vez
de pasarlas por acá.

---

## VISIÓN A LARGO PLAZO (clave, no perder)

EstateCall no debe ser solo "SaaS de bienes raíces", sino una **base reutilizable
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
