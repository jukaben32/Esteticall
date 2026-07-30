# ESTATECALL — ESTADO DEL PROYECTO

> Última actualización: julio 2026, tras la sustitución completa del stack.

## RESUMEN RÁPIDO

El backend Express + Prisma **ya no existe**. Fue reemplazado por completo por una
app **Next.js 14 full-stack** (el starter Real-Estate-AI-Calling-Agent-SaaS,
implementado). Todo vive ahora en un solo proyecto: frontend, API y lógica de negocio.

Fase actual: **construir el frontend nuevo** y dejar el deploy de Vercel apuntando a
esta app.

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
    (dashboard)/dashboard/          Panel: listings, ai-agents
    sites/[slug]/                   Website builder (sitio público por negocio)
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
  schema.sql                        Esquema completo, 17 tablas (ejecutar 2º)
```

## RUTAS DE API

| Ruta | Para qué |
|---|---|
| `/api/agents` · `/api/agents/[agentId]` | CRUD de agentes IA |
| `/api/agents/[agentId]/session` | Abre sesión de voz realtime |
| `/api/ai/tools` | Herramientas que el agente ejecuta durante la llamada |
| `/api/listings` · `/api/listings/[listingId]` | CRUD de propiedades |
| `/api/billing/checkout` | Checkout de Stripe |
| `/api/stripe/webhook` | Webhook de Stripe (requiere `STRIPE_WEBHOOK_SECRET`) |
| `/api/widget/[businessId]/config` | Configuración del widget embebible |

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

### 1. Base de datos (bloqueante)
El proyecto de Supabase todavía tiene el esquema viejo de Prisma. 7 tablas chocan por
nombre con las nuevas (`ai_agents`, `appointments`, `clients`, `notifications`,
`support_messages`, `support_tickets`, `websites`). Ejecutar **en este orden**:

1. `supabase/00_drop_legacy_prisma_tables.sql`
2. `supabase/schema.sql`

Saltarse el primero deja la base rota a medias, con errores tipo
"column business_id does not exist".

### 2. Deploy en Vercel (bloqueante)
La URL de producción sirve todavía la landing estática vieja. El proyecto de Vercel
tiene un override de **Output Directory** apuntando a `estatecall-frontend/landing`,
carpeta que ya no existe. Corregir en Settings → General:

- Framework Preset → **Next.js**
- Output Directory → quitar el override (dejar en default)
- Build / Install Command → default
- Root Directory → `./`

Luego cargar las variables de entorno y hacer Redeploy sin caché.
No hay que borrar el proyecto de Vercel: se perdería el subdominio.

### 3. Frontend nuevo
La landing actual es la del starter, en inglés y genérica. Se está construyendo una
propia.

### 4. Seguridad
Rotar los tokens que fueron expuestos en chats (GitHub PAT, Vercel, Supabase service
role y access token). Es la segunda vez que ocurre.

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
