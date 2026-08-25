# EstetiCall

SaaS multi-tenant para spas médico-estéticos y clínicas de medicina estética:
agente de IA (voz + WhatsApp) que atiende consultas, agenda citas, ofrece
paquetes de sesiones y hace cribado básico de contraindicaciones antes de
tratamientos sensibles — más un dashboard completo para el negocio y un
portal de autoservicio para sus pacientes.

Adaptado del frame [Real-Estate-Multi-AI-Agent-SaaS](https://github.com/jukaben32/Real-Estate-Multi-AI-Agent-SaaS)
(InmobilIACall) — mismo stack y arquitectura multi-tenant, dominio reescrito
para el vertical de spas/clínicas estéticas.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind CSS
- **Supabase** — auth + Postgres + RLS multi-tenant (`businesses` como tenant raíz)
- **OpenAI Realtime API** — agente de voz en tiempo real
- **Stripe** — suscripciones de plataforma + fallback de transferencia bancaria
- **WhatsApp** vía Evolution API (self-hosted)
- **Resend** — correo transaccional

## Estructura

```
src/
  app/
    (auth)/login, (auth)/signup      Autenticación
    (dashboard)/dashboard/           Panel del negocio
    (portal)/portal/                 Portal de autoservicio del paciente
    sites/[slug]/                    Sitio público por negocio (website builder)
    embed/[businessId]/              Widget de voz embebible
    admin/                           Panel de plataforma (conocimiento, transferencias)
    api/                             Rutas de API
  ai/                                Definición y ejecución de las tools del agente IA
  services/                         Acceso a datos (Supabase)
  components/                       UI reutilizable
  lib/                              Clientes de Supabase, cifrado, utilidades
supabase/
  schema.sql                        Esquema completo de la base de datos
```

## Cómo levantar en local

```bash
npm ci
cp .env.example .env.local     # y rellenar los valores reales
npm run dev                    # http://localhost:3000
```

Verificaciones antes de commitear: `npx tsc --noEmit` y `npm run build`.

Variables de entorno mínimas para arrancar: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y
`NEXT_PUBLIC_APP_URL`. Ver `.env.example` para el resto (OpenAI, Stripe,
Resend, WhatsApp/Evolution API, cifrado de datos de salud).

`.env.local` nunca se commitea — está en `.gitignore`.
