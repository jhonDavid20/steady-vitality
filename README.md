# Steady Vitality

Monorepo de la plataforma de coaching de salud & fitness **Steady Vitality**.

```
steady-vitality/
├── apps/
│   ├── api/          # Backend REST API — Node · Express · TypeORM · PostgreSQL
│   └── web/          # Frontend — Next.js · Tailwind · next-intl (landing + app)
├── packages/
│   └── shared/       # @steady/shared — contratos Zod + tipos compartidos
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Requisitos
- Node.js ≥ 18
- pnpm ≥ 9
- PostgreSQL (para el backend)

## Puesta en marcha

```bash
# 1. Instalar todo el workspace
pnpm install

# 2. Compilar el paquete compartido (lo consumen api y web)
pnpm build:shared

# 3. Configurar entornos
cp apps/api/.env.example apps/api/.env        # DB, JWT, SMTP…
cp apps/web/.env.example apps/web/.env.local  # API_URL=http://localhost:3001, NEXT_PUBLIC_CAL_*

# 4. Migraciones + admin (backend)
pnpm --filter @steady/api migration:run
pnpm --filter @steady/api seed:admin

# 5. Levantar en dos terminales
pnpm dev:api    # http://localhost:3001  · Swagger en /api/docs
pnpm dev:web    # http://localhost:3000
```

> **Nota:** el paquete `@steady/shared` se compila a `dist/`. Si editas sus tipos,
> recompílalo con `pnpm build:shared` (o déjalo en watch con
> `pnpm --filter @steady/shared dev`) para que `api` y `web` vean los cambios.

## Scripts raíz

| Script | Acción |
|---|---|
| `pnpm build` | Compila shared → api → web |
| `pnpm build:shared` | Compila solo `@steady/shared` |
| `pnpm dev:api` | Backend en modo dev (hot reload) |
| `pnpm dev:web` | Frontend en modo dev |
| `pnpm typecheck` | Typecheck de todos los paquetes |

## Paquetes

| Paquete | Descripción | Docs |
|---|---|---|
| `@steady/api` | API REST (auth, coaches, clientes, paquetes, leads, admin) | [`apps/api/README.md`](./apps/api/README.md) |
| `@steady/web` | Landing bilingüe + (próximamente) app autenticada | [`apps/web/README.md`](./apps/web/README.md) |
| `@steady/shared` | Fuente única de tipos y validación (Zod) entre api y web | — |

Ver [`DEVELOPMENT.md`](./DEVELOPMENT.md) para convenciones y guía de desarrollo,
y [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) para el estado y alcance del producto.

## Despliegue

Hoy cada app se despliega por separado (Vercel para `web`, Render para `api`).
Tras la migración a monorepo, cuando quieras reactivar los despliegues:
- **Vercel** → Root Directory = `apps/web`.
- **Render** → Root Directory = `apps/api` (ver `apps/api/render.yaml`).
