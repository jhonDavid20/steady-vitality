# Steady Vitality — Agent Guide

Monorepo (pnpm) de una plataforma de coaching de salud & fitness.

## Layout
- `apps/api` — Express + TypeORM + PostgreSQL (`@steady/api`, puerto 3001)
- `apps/web` — Next.js + Tailwind + next-intl (`@steady/web`, puerto 3000)
- `packages/shared` — `@steady/shared`: esquemas Zod + tipos compartidos por ambas apps

## Reglas de oro
1. **Tipos/validación compartidos viven en `packages/shared`** (`@steady/shared`). Revisa
   ahí antes de definir un DTO nuevo; si lo cambias, corre `pnpm build:shared`.
2. **Cambios de schema van por migración** (`synchronize: false`). Nunca edites una
   migración ya aplicada — agrega una nueva (timestamp incremental, `uuid_generate_v4()`).
3. **Todo texto de UI es bilingüe.** Cada clave que agregues a `apps/web/messages/en.json`
   va también en `es.json`.
4. **El navegador nunca llama directo a la API.** El web postea a su propia ruta
   `/api/*` (server-side), que reenvía al backend vía `API_URL`.

## Comandos (desde la raíz)
- `pnpm dev:api` / `pnpm dev:web` — servidores de desarrollo
- `pnpm build:shared` — recompila el paquete compartido tras editar sus tipos
- `pnpm build` — shared → api → web · `pnpm typecheck` — todos los paquetes
- `pnpm --filter @steady/api migration:run` · `... migration:generate -- src/database/migrations/Nombre` · `... seed:admin`

## Convenciones backend (`apps/api/src`)
Agregar un recurso en este orden (ejemplo de referencia: `leads`):
entidad (`database/entities`) → migración (`database/migrations`) → registrar en
`database/data-source.ts` → servicio (`services`, métodos devuelven `{ success, data?, message }`)
→ ruta (`routes`; validación con Zod compartido o express-validator; rutas estáticas
antes de `/:id`) → montar en `app.ts` → documentar en `apps/api/README.md`.
Middlewares de auth: `authenticate`, `requireAdmin`, `requireCoach`, `requireRole([...])`.

## Convenciones frontend (`apps/web/src`)
- Páginas en `app/[locale]`; rutas API internas en `app/api/*/route.ts` (server-side: aquí
  se habla con el backend).
- Componentes en `components/`; primitivos en `components/ui/`.
- Env: `NEXT_PUBLIC_*` = cliente; sin prefijo (ej. `API_URL`) = solo servidor.
- i18n con `useTranslations('Namespace')`; claves en `messages/en.json` **y** `es.json`.

## Eficiencia de tokens (para el agente)
- Usa subagentes (`api-dev`, `web-dev`) o `Explore` para búsquedas amplias; lee solo lo necesario.
- No re-corras `pnpm install` si ya existe `node_modules`; no recompiles `shared` si no lo tocaste.
- Valida con `pnpm typecheck` o `--filter` del paquete afectado, no con `pnpm build` completo.

## Especialistas y skills
- Subagentes: `api-dev` (backend), `web-dev` (frontend).
- Skills: `add-endpoint`, `add-landing-section`.
