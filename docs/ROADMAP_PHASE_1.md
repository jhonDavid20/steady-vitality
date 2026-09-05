# Steady Vitality — roadmap hacia fase 1

Fecha: 2026-09-04 · Estado: propuesta ejecutable para organizar el desarrollo.
Base: `develop` en `1c8d18b`, [PRODUCT.md](PRODUCT.md), código y backlog de GitHub revisados en septiembre de 2026.

## 1. Resultado que buscamos

**Una persona puede descubrir un coach, contratar un paquete, recibir su plan, abrir “Hoy”, registrar sus hábitos y recibir seguimiento. El coach puede gestionar esa relación y la plataforma puede operar el servicio.**

La fase 1 conserva el alcance v1 de PRODUCT.md. La preparación técnica forma parte del camino, pero no sustituye las funcionalidades del producto.

Dos entregas permiten validar sin esperar al lanzamiento completo:

| Entrega | Qué demuestra | Condición |
|---|---|---|
| Piloto interno | Coach asigna planes; cliente registra entreno, comidas y agua; coach ve cumplimiento y conversa | Usuarios de prueba y paquetes de prueba en entorno aislado. No se presenta como un lanzamiento con cobro real |
| Fase 1 comercial | Descubrimiento, contratación pagada, acompañamiento, reseña y operación básica | Pagos confirmados, servicios de producción configurados y criterios de lanzamiento satisfechos |

Supuesto de planificación: empezar con pocos coaches y clientes. No se ha decidido si serán clientes propios o un marketplace abierto; la arquitectura conserva los tres roles desde el inicio. País, moneda y proveedor de pagos siguen pendientes.

## 2. Alcance de fase 1

| Usuario | Debe poder hacer |
|---|---|
| Cliente | Registrarse, verificar correo, recuperar acceso, completar/retomar onboarding, encontrar coach y paquete, pagar, seguir planes en Hoy, registrar cumplimiento, comunicarse, consultar progreso y dejar reseña |
| Coach | Acceder por invitación, completar perfil, gestionar clientes y paquetes, crear ejercicios y planes, asignarlos, ver adherencia y responder mensajes |
| Admin | Gestionar acceso de coaches, usuarios y leads; consultar incidencias de contratación/pago; atender cancelaciones mediante un proceso auditable |

La experiencia incluye ES/EN, móvil y escritorio, temas claro/oscuro, estados vacíos útiles y errores comprensibles.

Se mantienen para después: suscripciones Premium, comisiones diferenciadas por tier, IA, VitalityScore compuesto, wearables, escaneo/foto de alimentos, macros avanzados, registro detallado de series/pesos, app nativa y analítica avanzada. En fase 1 sí habrá una comisión base si se confirma el modelo de marketplace; su importe aún debe definirse.

Para resolver la diferencia entre PRODUCT.md e issue #27, se propone incluir en fase 1 un recordatorio simple de fin de plan y una acción para volver a contratar. Renovación automática, upsells y campañas avanzadas quedan para v1.5.

## 3. Secuencia de hitos

| Hito | Entregable | Dependencia | Puerta de salida |
|---|---|---|---|
| H0 — Base reproducible | Entorno, documentación, instrucciones y CI coherentes con el monorepo | Ninguna | Una instalación limpia levanta ambas apps y pasa validaciones |
| H1 — Permisos y dominio | Autorización consistente y vínculo coach–cliente único | H0 | Usuarios ajenos no pueden consultar ni modificar recursos; vínculo y estados tienen pruebas |
| H2 — Acceso y navegación | Flujos completos de cliente, coach y admin | H1 | Cada rol entra, completa su preparación y llega a una pantalla útil |
| H3 — Primer hábito completo | Asignar rutina → verla en Hoy → marcarla → verla como coach | H1 + H2 | El flujo persiste y respeta cliente, fecha y permisos |
| H4 — Piloto interno | Nutrición, agua, progreso, demos y comunicación | H3 | El ciclo diario funciona durante una semana simulada |
| H5 — Descubrimiento y compra | Directorio, catálogo, contratación y pagos | H1 + H2 + decisiones comerciales | Un pago confirmado activa exactamente un paquete; fallos no lo activan |
| H6 — Retención y operación | Reseñas, fin de plan y herramientas mínimas de soporte | H4 + H5 | Se puede completar, renovar o atender una incidencia sin editar datos a mano |
| H7 — Lanzamiento fase 1 | Entorno de producción verificado y cohorte inicial | H0–H6 | Checklist de lanzamiento completo y ensayo integral aprobado |

H5 puede avanzar después de H2 mientras se construye el motor de hábitos, si están resueltas las decisiones de cobro. El lanzamiento necesita ambas partes. Los hitos expresan dependencias, no una promesa de fechas; se estimarán al recuperar una línea base ejecutable en H0.

Correspondencia de epics: [#28 Acceso](https://github.com/jhonDavid20/steady-vitality/issues/28) → H2; [#29 Descubrimiento](https://github.com/jhonDavid20/steady-vitality/issues/29) → H5; [#30 Contratación y pagos](https://github.com/jhonDavid20/steady-vitality/issues/30) → H1/H5; [#31 Planes](https://github.com/jhonDavid20/steady-vitality/issues/31) y [#32 Hoy](https://github.com/jhonDavid20/steady-vitality/issues/32) → H3/H4; [#33 Reseñas y retención](https://github.com/jhonDavid20/steady-vitality/issues/33) → H6.

## 4. Trabajo por hito

### H0 — Actualizar y dejar una base confiable

**Trabajo nuevo:** T01, T02 y T03. **Issue existente:** [#35](https://github.com/jhonDavid20/steady-vitality/issues/35).

1. Recuperar la instalación del workspace, compilar shared y configurar entornos locales separados para API y web. Confirmar que la DB es de desarrollo antes de migrar; el arranque actual aplica migraciones automáticamente.
2. Fijar una versión soportada de Node y la versión de pnpm, compatibles con las dependencias y el hosting elegidos. Registrar `packageManager`, archivo de versión de runtime y lockfile.
3. Inventariar dependencias; consultar soporte, avisos oficiales y compatibilidad antes de elegir versiones. Priorizar correcciones de seguridad y dependencias directas en uso. Separar actualizaciones mayores de cambios funcionales, con validación por actualización.
4. Corregir resolución de paquetes y errores reales de tipos; retirar `ignoreBuildErrors`. Normalizar lint y eliminar el bypass correspondiente una vez exista una comprobación funcional.
5. Crear CI de instalación con lockfile, compilación de shared, typecheck, lint, tests relevantes y build de las apps. Añadir PostgreSQL de prueba para las pruebas que lo requieran.
6. Actualizar README raíz, READMEs de apps, DEVELOPMENT.md y PROJECT_OVERVIEW.md. PRODUCT.md será la visión; este roadmap, la secuencia; GitHub, la ejecución.
7. Preparar AGENTS.md como entrada de Codex y una fuente común de convenciones para Claude/Codex. Corregir rutas antiguas, reglas contradictorias de ramas y hooks que instalan por rutina. Mantener los especialistas api-dev/web-dev; usarlos como subagentes cuando el usuario pida delegación.
8. Revalidar #35 frente al PR #36 ya integrado. Probar migraciones en una DB descartable; no rehacer el arreglo ni cerrar el issue solo por existir el PR.

**Salida:** un colaborador sigue la guía desde un checkout limpio; API responde al healthcheck, web abre en ambos idiomas y CI pasa sin ignorar errores. Dependencias mayores no necesarias para esta salida se documentan para un cambio separado.

### H1 — Corregir permisos y coherencia del dominio

**Trabajo nuevo:** T04, T05 y T06. **Inicio de:** [#15](https://github.com/jhonDavid20/steady-vitality/issues/15).

1. Determinar si el puente Auth.js tiene consumidores. Si no los tiene, retirarlo; si los tiene, autenticar el acceso interno y autorizar cada operación. Confirmar denegación de lectura/escritura de usuarios y sesiones sin credenciales válidas.
2. Documentar una decisión sobre la fuente autoritativa de la relación coach–cliente. `ConnectionRequest` representa una solicitud; la relación representa el vínculo. `User.coachId`, si se conserva, debe derivarse y mantenerse por un único servicio transaccional.
3. Inventariar datos existentes y detectar relaciones contradictorias antes de migrar. No elegir automáticamente un coach cuando un cliente tenga vínculos incompatibles. Diseñar una migración nueva y un reporte de excepciones.
4. Definir invariantes: máximo un coach comprometido activo por cliente; asignación solo a clientes autorizados; planes visibles solo para su destinatario. Resolver mediante transacciones y restricciones apropiadas, incluyendo solicitudes concurrentes.
5. Diferenciar `coachUserId` y `coachProfileId` en contratos y servicios. Evitar una renombrada masiva de DB si puede resolverse con límites explícitos y una migración compatible.
6. Especificar estados y transiciones de contratación: inicio/fin, cancelación, finalización y activación por pago. La baja de una relación no debe eludir el compromiso de un paquete.
7. Eliminar el éxito ficticio del assessment sin backend y los logs del payload personal. Revisar errores, validación de datos y rate limiting considerando que las peticiones llegan desde Next.

**Salida:** pruebas de integración demuestran aislamiento entre dos coaches y dos clientes, concurrencia del vínculo y transiciones rechazadas. #15 seguirá parcial hasta probar su integración con pago en H5.

### H2 — Completar acceso, onboarding y navegación

**Issues:** [#6](https://github.com/jhonDavid20/steady-vitality/issues/6), [#7](https://github.com/jhonDavid20/steady-vitality/issues/7), [#8](https://github.com/jhonDavid20/steady-vitality/issues/8), [#9](https://github.com/jhonDavid20/steady-vitality/issues/9). **Trabajo nuevo:** T07 y comienzo de T08/T09.

1. Conservar login/registro existentes; añadir verificación de correo y recuperación de contraseña con sus rutas web y estados de expiración/error.
2. Validar refresh y revocación de extremo a extremo, incluida la expiración mientras se envía un formulario. Alinear vida de cookies, sesión y tokens; cubrir logout y cerrar todas las sesiones.
3. Implementar guardado de borrador y precarga del onboarding. Volver a mostrar un formulario vacío no satisface “retomar”.
4. Completar entrada de coaches por invitación y recorrido del administrador. No enviar al admin al onboarding de cliente.
5. Cliente: Hoy / Plan / Coach / Perfil. Coach: Clientes / Planes / Paquetes / Mensajes / Perfil. Admin: operación mínima. Cada rol debe tener estados vacíos con siguiente acción.
6. Configurar correo transaccional y enlaces con idioma/dominio correctos. Probar con buzones controlados en staging.

**Salida:** registro → verificación → onboarding → home; login → expiración → refresh; recuperación; logout global; invitación de coach. Flujos probados por rol y navegación móvil en ES/EN.

### H3 — Construir el primer flujo completo de hábito

**Issues:** [#17](https://github.com/jhonDavid20/steady-vitality/issues/17), [#18](https://github.com/jhonDavid20/steady-vitality/issues/18), [#22](https://github.com/jhonDavid20/steady-vitality/issues/22) y primera entrega de [#21](https://github.com/jhonDavid20/steady-vitality/issues/21). **Trabajo nuevo:** T08 y T10.

1. Librería de ejercicios con nombre, descripción, grupo muscular y URL de demo. Definir claramente ejercicios compartidos y propios, junto con sus permisos.
2. Coach crea una rutina y la asigna a un cliente para días determinados. Entregar interfaz de creación/asignación además del CRUD backend.
3. Definir zona horaria del cliente, día local, días de descanso y efecto de editar un plan que ya tiene registros. Conservar significado del historial; no reinterpretar logros pasados con una plantilla editada.
4. Hoy obtiene del backend la rutina asignada y una acción principal. Mostrar sin plan, descanso, carga, error y cumplimiento completo.
5. Registro diario idempotente por cliente/ejercicio asignado/fecha. Reintentar o hacer doble clic no duplica actividad; permitir corregir una marca.
6. El coach consulta cumplimiento real de sus clientes.

**Salida:** crear → asignar → completar → recargar → consultar como coach. Probar cambio de fecha local y aislamiento entre clientes. #21 permanece parcial: aún faltan nutrición, agua, progreso y check-in.

### H4 — Completar el piloto interno diario

**Issues:** [#19](https://github.com/jhonDavid20/steady-vitality/issues/19), [#20](https://github.com/jhonDavid20/steady-vitality/issues/20), [#23](https://github.com/jhonDavid20/steady-vitality/issues/23), [#24](https://github.com/jhonDavid20/steady-vitality/issues/24), [#25](https://github.com/jhonDavid20/steady-vitality/issues/25) y cierre de #21.

1. Coach define comidas y objetivos de agua; cliente registra adherencia con acciones rápidas. Definir unidad de agua, correcciones y relación con la zona horaria.
2. Completar el endpoint agregado de Hoy y la vista de progreso del coach. El progreso se calcula sobre acciones programadas; descanso no cuenta como incumplimiento. Un día perdido no borra el historial.
3. Acordar una regla concreta de “racha humana” para #24 y documentar ejemplos verificables: día cumplido, descanso, ausencia y regreso. No cerrar el issue con una frase de motivación sin cálculo definido.
4. Mensajería básica 1:1 vinculada a una relación autorizada, historial paginado, envío con reintentos y check-in visible en Hoy. Adjuntos, videollamadas e hilos temáticos quedan fuera.
5. Demos en almacenamiento de objetos, con validación de tipo/tamaño, permisos y limpieza de archivos huérfanos. Integrar subida y reproducción en las interfaces.
6. Asegurar que el coach puede ver entreno, nutrición, agua y mensajes de cada cliente desde un mismo recorrido.

**Salida:** ensayo de una semana con usuarios de prueba: día completo, descanso, día omitido, corrección de registro y mensaje del coach. El piloto utiliza fixtures/confirmaciones de pago de prueba aisladas; no añade una vía de activación sin pago en producción.

### H5 — Descubrimiento, contratación y pagos

**Issues:** [#10](https://github.com/jhonDavid20/steady-vitality/issues/10), [#11](https://github.com/jhonDavid20/steady-vitality/issues/11), [#12](https://github.com/jhonDavid20/steady-vitality/issues/12), [#13](https://github.com/jhonDavid20/steady-vitality/issues/13), [#14](https://github.com/jhonDavid20/steady-vitality/issues/14), #15 y [#16](https://github.com/jhonDavid20/steady-vitality/issues/16). **Trabajo nuevo:** T11 y continuidad de T08.

1. Resolver mercado, moneda, proveedor, comisión base, duraciones y reglas de cancelación. Definir quién cobra, cómo recibe el coach y cómo se concilian las comisiones; un checkout aislado no resuelve el movimiento completo del dinero.
2. Directorio y perfil público con disponibilidad, filtros y paquetes. Matching inicial mediante respuestas y reglas explícitas, sin IA; reutilizar datos del onboarding para evitar preguntar lo mismo.
3. Coach crea/edita ofertas; cliente ve precio, moneda, duración y condiciones antes de iniciar compra. Capturar las condiciones de la oferta en la contratación para que una edición futura no cambie lo comprado.
4. Implementar la máquina de estados de #15, vinculada al dominio de H1. Evitar contratos activos incompatibles y calcular fechas conforme a la regla de inicio acordada.
5. El backend crea checkout; la pantalla de retorno consulta estado. **La vuelta del navegador nunca confirma el pago.** Un webhook autenticado confirma y activa con idempotencia y transacción.
6. Persistir referencias del proveedor, eventos procesados y reconciliación. Cubrir callbacks duplicados, fuera de orden, fallidos y pago tardío. Cerrar o restringir las vías antiguas que activan directamente paquetes.
7. Probar liquidación al coach o el proceso operativo definido, comisión y cancelación/reembolso compatibles con el proveedor y las políticas aprobadas.

**Salida:** compra exitosa, rechazada, abandonada y reintentada; webhook duplicado activa una sola vez; un paquete sin pago confirmado nunca está activo. Flujo completo probado en sandbox y configuración de producción revisada antes de cobrar.

### H6 — Reseñas, retención y operación

**Issues:** [#26](https://github.com/jhonDavid20/steady-vitality/issues/26), [#27](https://github.com/jhonDavid20/steady-vitality/issues/27). **Trabajo nuevo:** completar T09/T11 y preparar T12.

1. Solo el cliente de un paquete completado puede dejar la reseña correspondiente. Definir unicidad, texto opcional y anonimato de presentación; conservar trazabilidad interna y moderación básica.
2. Mostrar reseñas básicas sin presentar todavía un VitalityScore compuesto.
3. Aviso de fin de plan sin duplicados y acción para volver a contratar o dar feedback. Al renovar, crear un nuevo ciclo que conserve el historial anterior.
4. Admin consulta leads, invitaciones, usuarios, contrataciones y estado de pagos; las acciones sensibles quedan registradas. Un admin no debe resolver incidencias forzando `active` sin pago.
5. Documentar y ensayar cancelación, reporte de problemas y conciliación. Si fase 1 exige créditos internos, convertirlos en trabajo explícito antes de prometer esa política; no simular un saldo mediante notas.

**Salida:** completar un paquete → reseñar → recibir recordatorio → contratar otro ciclo. Admin puede atender una incidencia siguiendo el procedimiento, sin manipulación manual de tablas.

### H7 — Validar y lanzar fase 1

**Trabajo nuevo:** T12 y cierre de los epics #28–#33 cuando sus stories cumplan criterios.

1. Corregir el despliegue para el workspace: el `render.yaml` actual aún usa `npm install` pese a `workspace:*`. Verificar acceso al lockfile, compilación de shared y artefactos requeridos por cada app en el hosting real.
2. Separar staging/producción: base de datos, correo, almacenamiento, pagos y secretos. Establecer un único mecanismo controlado de migraciones por despliegue.
3. Probar backup/restauración y rollback de aplicación; planificar compatibilidad de migraciones para no depender de revertir datos destructivamente.
4. Revisar flujos principales en móvil/escritorio, ES/EN, claro/oscuro, teclado, estados vacíos, carga y errores.
5. Ensayar recorrido completo con cliente/coach/admin y pagos sandbox. Medir lentitud y fallos del recorrido real; corregir bloqueos antes de admitir la cohorte.
6. Configurar logs útiles sin datos personales innecesarios, seguimiento de errores y alertas sobre API, cobro y tareas programadas.
7. Revisar textos de compra, privacidad y cancelación para el mercado elegido y habilitar un canal de soporte. No asumir que las políticas propuestas en PRODUCT.md ya están validadas.

**Salida:** checklist de lanzamiento completo, responsables identificados, versión candidata validada y cohorte inicial definida.

## 5. Trabajo nuevo para convertir en issues

Los códigos T01–T12 son identificadores de planificación locales, **no números de issues de GitHub**. Sus criterios complementan las stories existentes y deben vincularse sin duplicarlas.

| ID | Título propuesto | Hito / prioridad | Criterios mínimos de aceptación |
|---|---|---|---|
| T01 | Unificar documentación y reglas de agentes del monorepo | H0 / P1 | Guía de arranque válida; AGENTS.md y CLAUDE.md sin reglas divergentes; rutas de skills correctas; visión/estado/roadmap diferenciados; criterios implementados del backlog identificados con evidencia |
| T02 | Recuperar entorno reproducible y actualizar dependencias compatibles | H0 / P0 | Node/pnpm fijados; instalación limpia; shared resoluble; env por app; inventario de upgrades con riesgos y validación; sin actualizaciones mayores mezcladas con features |
| T03 | Añadir CI y comprobaciones obligatorias | H0 / P0 | Typecheck/lint/build efectivos; sin bypass de errores; DB de prueba aislada; tests ejecutados conforme se añaden; resultados visibles por PR |
| T04 | Cerrar accesos no autorizados del puente Auth.js | H1 / P0 | Consumidores identificados; bridge retirado o protegido; lectura, escritura y sesiones deniegan acceso inválido; regresión automatizada |
| T05 | Unificar el vínculo coach–cliente y sus permisos | H1 / P0 | Decisión registrada; conflictos de datos detectados; migración compatible; servicio único; aislamiento y concurrencia probados; IDs de usuario/perfil explícitos |
| T06 | Hacer fiable la captación y los errores del proxy web | H1 / P1 | Sin éxito falso; sin logs de payload personal; errores HTTP coherentes; validación compartida; rate limit comprobado con múltiples usuarios detrás de Next |
| T07 | Configurar correo transaccional y recorrido de invitaciones | H2 / P1 | Verificación/reset/invitaciones entregados a buzones de prueba; URLs correctas; tokens inválidos/expirados tratados; proveedor y configuración documentados |
| T08 | Entregar el espacio de trabajo mínimo del coach | H2–H5 / P1 | Clientes propios, creación de ofertas/planes, asignación, adherencia y mensajes accesibles desde UI; cambios persistidos; sin acceso cruzado |
| T09 | Entregar operación mínima de administración | H2–H6 / P1 | Usuarios, invitaciones y leads gestionables; consulta de contratos/pagos; acciones auditables; soporte sin edición manual de DB |
| T10 | Definir fecha local y conservación del historial de planes | H3 / P1 | Zona horaria explícita; idempotencia diaria; descanso definido; edición de planes preserva registros; pruebas en límites de fecha |
| T11 | Definir y completar la operación de cobro de fase 1 | H5–H6 / P0 comercial | Mercado/moneda/proveedor acordados; comisión y liquidación documentadas; estados reconciliados; cancelación/reembolso ensayados; créditos internos solo si se incluyen explícitamente |
| T12 | Preparar staging, producción y ensayo de lanzamiento | H6–H7 / P0 lanzamiento | Deploy workspace reproducible; servicios separados; migraciones controladas; restauración ensayada; observabilidad; smoke integral y checklist de salida |

P0 significa bloqueo de la entrega indicada; P1, trabajo requerido de esa etapa. T04 debe adelantarse si se confirma que el código vulnerable está desplegado públicamente, sin esperar al resto de H0.

## 6. Cómo reorganizar los issues actuales

| Grupo | Acción propuesta |
|---|---|
| #35 | Revalidar el arreglo integrado; cerrar únicamente cuando sus criterios se hayan ejecutado |
| #6–#8 | Registrar los criterios ya implementados y mantener abiertos los restantes; no reconstruir login/onboarding completos |
| #9 | Completar navegación real y enlazar T08/T09; una cabecera no satisface el issue |
| #10–#13 | Mantener criterios de descubrimiento/catálogo; explicitar diferencias entre filtros existentes en API y UI pendiente |
| #14–#16 | Enlazar T05/T11; dependencia explícita del pago confirmado y de las reglas de relación; #15 se desarrolla en H1 y se cierra en H5 |
| #17–#20 | Entregar endpoints e interfaces; incluir permisos, historial y storage en los criterios correspondientes |
| #21–#25 | Desarrollar #21 por incrementos; cerrarlo solo con todas sus fuentes integradas; acordar cálculo concreto de #24 |
| #26–#27 | Mantener reseña y recordatorio básicos en fase 1; documentar la diferencia con renovación avanzada de v1.5 |
| #28–#33 | Conservar epics como agrupadores; reflejar avance por stories completas, sin contarlos como implementaciones independientes |

Propuesta de milestones de GitHub: `F1 · Base`, `F1 · Acceso`, `F1 · Piloto`, `F1 · Comercial`, `F1 · Lanzamiento`. H0/H1 van a Base; H2 a Acceso; H3/H4 a Piloto; H5/H6 a Comercial; H7 a Lanzamiento. #15 queda en Comercial aunque su diseño comience en Base. Las etiquetas de prioridad y dependencias deben reflejar esta secuencia.

No se han creado milestones ni modificado issues con este documento. La conciliación inicial del backlog forma parte de T01.

## 7. Decisiones y cuándo hacen falta

| Decisión | Propuesta de trabajo mientras se resuelve | Límite |
|---|---|---|
| Clientes propios o varios coaches al inicio | Diseñar para varios roles; piloto pequeño | Antes de planear captación y cohorte de H7 |
| País, moneda, proveedor y destinatario del cobro | Interfaces de dominio y pruebas sin proveedor real; no fijar precios por defecto | Antes de implementar #14/#16 en H5 |
| Comisión base y liquidación al coach | Enumerar eventos y estados necesarios | Antes de cerrar T11 |
| Duraciones, inicio, cambio de coach y cancelación | Partir de las alternativas de PRODUCT.md como propuestas | Antes de cerrar las reglas de #15 |
| Fuente única del vínculo | Comparar datos y consumidores antes de decidir | H1, antes de planes y permisos nuevos |
| Regla de progreso y racha humana | Mostrar cumplimiento de acciones programadas sin penalizar descanso | Antes de cerrar #24 |
| Storage, email y hosting | Mantener contratos simples y verificar compatibilidad/coste al seleccionar | Email en H2, storage en H4, despliegue definitivo en H7 |

Las decisiones comerciales pendientes no bloquean preparar el entorno, corregir permisos ni completar acceso. Cuando una decisión sea necesaria, se presentará con alternativas y una recomendación concreta.

## 8. Forma de ejecución y definición de terminado

Un issue se toma cuando sus dependencias están resueltas y sus criterios son verificables. Se trabaja en una rama `codex/<numero>-<descripcion>` desde `develop` actualizado, con PR a `develop`; `main` recibe versiones validadas. Actualizar los ejemplos de ramas de las guías al adoptar esta convención.

Cada PR debe contener un cambio revisable, contratos y migraciones correspondientes, traducciones, validación y referencia al issue. Usar `Refs` si entrega una parte; `Closes` solo al completar todos los criterios. No mezclar un upgrade mayor, un refactor general y una feature en el mismo PR.

Un issue de funcionalidad está terminado cuando:

- Su recorrido funciona en la interfaz y persiste en la API, si afecta ambas partes.
- Se han comprobado autorización, errores y estados vacíos relevantes.
- Los contratos compartidos y las traducciones están sincronizados.
- Las migraciones necesarias se prueban desde una base vacía y desde una versión previa representativa.
- Pasan las comprobaciones aplicables; las pruebas cubren riesgos reales, como aislamiento, concurrencia, pagos o historial.
- Documentación y criterios del issue reflejan lo entregado.

No hace falta escribir tests para cambios de documentación o ajustes visuales triviales. Sí hacen falta para los límites de negocio que protegen cuentas, datos, pagos y registros diarios.

## 9. Checklist de fase 1 lista

- [ ] Instalación, CI y despliegue reproducibles sin ignorar errores.
- [ ] Registro, verificación, recuperación y sesiones completos por rol.
- [ ] Cliente y coach pueden retomar onboarding y navegar su área.
- [ ] Aislamiento entre coaches/clientes verificado; ninguna ruta interna queda pública por accidente.
- [ ] Directorio, perfil, matching básico y catálogo utilizables.
- [ ] Pago confirmado activa un único contrato; liquidación y comisión conciliables.
- [ ] Coach crea y asigna entreno/nutrición; cliente registra ejercicio, comidas y agua.
- [ ] Hoy integra plan, cumplimiento, progreso y check-in por fecha local.
- [ ] Demos y mensajería funcionan con permisos correctos.
- [ ] Reseña y fin de plan completan el ciclo de contratación.
- [ ] Coach y admin tienen las herramientas mínimas para operar.
- [ ] Backups, restauración, alertas y proceso de soporte ensayados.
- [ ] Recorrido integral validado en staging, móvil/escritorio y ES/EN.
- [ ] Decisiones comerciales resueltas y versión candidata lista para la cohorte inicial.

Medir en el piloto: finalización de onboarding, tiempo hasta recibir plan, primera acción registrada, adherencia sobre acciones programadas, regreso en días posteriores, respuesta del coach y fallos de contratación. Usar los primeros datos para fijar objetivos; no inventar porcentajes de éxito antes de observar uso.

## 10. Primera tanda de trabajo

1. **T02 + verificación de #35:** recuperar una base local ejecutable.
2. **T04:** resolver el acceso del puente Auth.js y añadir su regresión.
3. **T03:** hacer que CI detecte fallos de tipos, build y las pruebas incorporadas.
4. **T01:** sincronizar documentación/agentes y conciliar el backlog con la evidencia obtenida.
5. **T05 + diseño de #15:** fijar el vínculo y las reglas de compromiso.
6. **T06 y #6–#9 con T07:** completar captación fiable, acceso y navegación.

El primer demo de producto después de esta preparación será H3: **un coach asigna una rutina y un cliente la completa desde Hoy**.
