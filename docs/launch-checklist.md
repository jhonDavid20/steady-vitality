# Checklist de lanzamiento Fase 1

## Antes de promover

- [ ] CI está verde para el SHA que se desplegará.
- [ ] Hay copia de PostgreSQL y se probó restaurarla en una instancia aislada.
- [ ] Las variables de producción están cargadas en el proveedor, incluidos JWT, correo, `WEB_APP_URL`, Stripe y almacenamiento.
- [ ] Stripe usa claves y webhook de producción; sandbox no está habilitado en producción.
- [ ] Las migraciones pendientes fueron revisadas y ejecutadas mediante el procedimiento de despliegue.

## Smoke test de staging

- [ ] `/health` y `/ready` responden correctamente.
- [ ] Registro, verificación, inicio de sesión, cierre de sesión y recuperación de contraseña funcionan.
- [ ] Cliente, coach y admin reciben sus rutas y permisos correctos.
- [ ] En inglés y español: onboarding, Hoy, plan, directorio de coaches, perfil y navegación móvil.
- [ ] Se completa un Checkout sandbox y el webhook activa una sola vez la compra y la relación.
- [ ] Se completa un ciclo, se solicita reseña y aparece respetando el modo anónimo.
- [ ] La vista de operaciones muestra pagos, compras y auditoría sin datos sensibles.

## Después de promover

- [ ] Se observan logs y alertas durante el primer ciclo de uso.
- [ ] Se revisan pagos pendientes y eventos webhook fallidos.
- [ ] Soporte tiene el enlace al procedimiento de privacidad, cancelación y recuperación.
