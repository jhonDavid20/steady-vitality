# Despliegue y recuperación

## Entornos

Mantén `develop` desplegado en staging y `main` en producción. Staging usa cuentas, webhooks y base de datos separados. La web apunta a la API correspondiente mediante `API_URL`; no publiques secretos con prefijo `NEXT_PUBLIC_`.

La API se define en `apps/api/render.yaml`. El servicio se construye desde la raíz del workspace con `pnpm install --frozen-lockfile`, compila `@steady/shared` antes de la API y usa `/ready` como comprobación de disponibilidad. `/health` es una comprobación de vida sin detalles de infraestructura.

## Migración controlada

1. Confirma que CI pasó y que el commit de la aplicación y las migraciones coinciden.
2. Toma una copia verificable de PostgreSQL y anota el identificador, la hora y el SHA del despliegue.
3. Ejecuta `pnpm --filter @steady/api migration:show` con la URL de staging; revisa las pendientes.
4. Ejecuta `pnpm --filter @steady/api migration:run:prod` una vez. En el plan gratuito de Render se hace desde Shell o un trabajo puntual antes de promover el código.
5. Comprueba `GET /ready`, login, una pantalla en inglés y español, y el flujo sandbox de Checkout sin usar tarjetas reales.

No se ejecutan migraciones automáticamente al arrancar la API de producción. En un plan de Render con predeploy, configura el mismo comando como `preDeployCommand`.

## Reversión

Si la aplicación no queda lista después de migrar, detén la promoción y revierte el servicio al SHA anterior. No ejecutes una reversión destructiva de base de datos por rutina: restaura la copia en una instancia aislada, verifica integridad y define una migración correctiva. Solo usa `migration:revert` si la migración concreta fue diseñada y revisada como reversible.

## Operación y soporte

Revisa alertas por errores 5xx, disponibilidad de `/ready`, fallos de webhook y pagos pendientes. Los webhooks de Stripe son autoritativos e idempotentes; guarda su identificador y reconcilia desde el proveedor antes de modificar estados. Para soporte de privacidad, identifica al usuario, limita el acceso al caso y no pegues datos de salud, tokens ni secretos en tickets o logs.
