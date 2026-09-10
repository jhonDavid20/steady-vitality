# Steady Vitality — brief de producto y sistema de diseño

> Fuente de verdad para Claude Design y para las implementaciones de interfaz.
> Estado revisado: 2026-09-10. La marca que debe aparecer en todo el producto es **Steady Vitality**; eliminar referencias visuales y textuales a “FitCoach”.

## 1. Objetivo

Steady Vitality conecta a una persona que busca acompañamiento de salud y fitness con un coach. La experiencia debe hacer tres cosas con claridad:

1. Convertir visitantes en cuentas o leads desde la landing.
2. Ayudar al cliente a cumplir su plan diario y mantener una relación con su coach.
3. Dar al coach y al administrador herramientas operativas claras, sin exponer complejidad innecesaria.

El rediseño debe partir de los flujos reales que ya soporta la API. No diseñar pantallas que aparenten funciones inexistentes; señalar cualquier propuesta que requiera backend nuevo.

## 2. Usuarios y lenguaje

| Rol | Necesidad principal | Lenguaje del producto |
|---|---|---|
| Visitante | Entender la propuesta y dar el siguiente paso | “Descubre un plan sostenible” |
| Cliente | Saber qué hacer hoy y avanzar con constancia | “Tu día”, “Tu plan”, “Tu coach” |
| Coach | Gestionar clientes, planes y ofertas | “Clientes”, “Planes”, “Paquetes” |
| Administrador | Operar la plataforma y resolver excepciones | “Operaciones”, “Usuarios”, “Invitaciones” |

Usar siempre estos términos de dominio:

- **Relación de coaching**: vínculo activo entre un cliente y un coach.
- **Plan de entrenamiento/nutrición**: contenido creado por un coach y asignado a un cliente.
- **Oferta**: paquete publicado por un coach.
- **Compra**: instancia de una oferta que pasa por pago pendiente, confirmado, fallido o reembolsado.
- **Ciclo de coaching**: periodo de servicio activo después de confirmar un pago.

La interfaz es bilingüe en español e inglés. El español es la referencia inicial de contenido. Diseñar para textos de distinta longitud y no insertar strings fijos en componentes.

## 3. Principios de diseño

- **Calma y claridad**: salud sostenible, no intensidad, culpa ni estética de “reto extremo”.
- **Acción siguiente visible**: cada pantalla debe responder qué puede hacer la persona ahora.
- **Progreso humano**: mostrar adherencia y rachas sin penalizar días de descanso.
- **Confianza**: planes, pagos, mensajes y datos sensibles deben mostrar estado, autor y fecha.
- **Accesible y móvil primero**: contraste WCAG AA, foco visible, áreas táctiles de al menos 44 px, formularios con labels y errores explícitos.
- **Diseño con datos vacíos**: los primeros usuarios no tendrán coach, clientes, compras ni planes. Cada estado vacío debe explicar el siguiente paso.

## 4. Diagnóstico de la web actual

La app autenticada tiene navegación por roles y varias operaciones reales, pero se ve como una colección de formularios y tarjetas genéricas. La landing usa una marca distinta (“FitCoach”) y no ofrece enlaces para iniciar sesión ni crear cuenta. El panel admin solo muestra una vista de operaciones de lectura.

La base local revisada contiene 2 usuarios y **0** perfiles de coach, relaciones de coaching, planes, asignaciones, paquetes y mensajes. Por ello, las pantallas actuales son conexiones parciales a la API, no un recorrido de producto listo para demostración: hoy muestran correctamente estados vacíos, pero el visitante no puede completar todo el camino de cliente desde la web.

Problemas que el diseño debe corregir:

- Navegación reducida que oculta capacidades ya disponibles.
- Jerarquía visual débil: títulos, acciones, estados y datos importantes compiten entre sí.
- Flujos de cliente y coach repartidos entre pantallas sin un dashboard de decisión.
- Acciones destructivas o de negocio sin patrones de confirmación y sin trazabilidad visible.
- Estados de carga, error y vacío poco informativos.
- Inconsistencia de marca entre la landing y la aplicación.

## 5. Arquitectura de información objetivo

### Landing pública

Cabecera: logo **Steady Vitality**, navegación de secciones, selector ES/EN, tema, **Iniciar sesión** y CTA primaria **Crear cuenta**. En móvil, ambos accesos deben aparecer antes o dentro del menú con la CTA destacada.

#### Inventario actual de la landing

| Sección actual | Qué hace hoy | Estado real |
|---|---|---|
| Navegación | Enlaces de ancla a Inicio, Servicios, Evaluación, Reserva y Acerca de; selector ES/EN y tema | Funciona, pero muestra “FitCoach” y no ofrece acceso a cuenta. |
| Hero | Explica la propuesta y desplaza a Evaluación o Reserva | Funciona como scroll; no conecta con registro, coach o precios. |
| Filosofía | Presenta el enfoque y enlaza a una página de filosofía | Contenido informativo; falta prueba social e historias reales. |
| Servicios | Describe servicios ofrecidos | Informativo; no tiene CTA específico por servicio. |
| Evaluación | Formulario con datos físicos, objetivo y recomendación/BMI | Envía un lead al backend si `API_URL` está configurada. Sin esa variable devuelve éxito aunque solo registra el dato en el servidor web, por lo que no debe presentarse como captación lista para producción. |
| Reserva | Embed de Cal.com | Funciona si están configurados `NEXT_PUBLIC_CAL_LINK` y `NEXT_PUBLIC_CAL_NAMESPACE`; es una reserva externa, no una agenda dentro de la app. |
| Acerca de | Información de la marca/coach | Informativo. |

#### Rediseño requerido de la landing

La landing debe ser un embudo de adquisición, no una copia de la app autenticada. Diseñar estos caminos visibles desde la primera pantalla:

1. **Quiero explorar el servicio** → servicios, filosofía, prueba social y reserva de llamada.
2. **Quiero saber qué me conviene** → evaluación → lead confirmado → siguiente paso claro: reservar llamada o crear cuenta.
3. **Ya tengo una cuenta** → Iniciar sesión.
4. **Quiero empezar por mi cuenta** → Crear cuenta → verificación → onboarding de cliente.

Entregar los siguientes bloques y estados:

- Header desktop y móvil con marca Steady Vitality, Iniciar sesión y Crear cuenta.
- Hero con una CTA primaria única y una secundaria; no dos botones visualmente idénticos.
- Sección de cómo funciona el proceso: evaluación → coach → plan → progreso.
- Servicios/ofertas con CTA por intención, sin inventar precios o resultados médicos.
- Evaluación accesible, con progreso, validación, privacidad y éxito/error reales.
- Prueba social como componente preparado para contenido aprobado; usar placeholders declarados, no testimonios falsos.
- Reserva con estados de carga/error si Cal.com no está configurado.
- Footer con navegación, contacto, privacidad y términos antes del lanzamiento.

Rutas ya existentes:

- `/[locale]` — landing: propuesta, filosofía, servicios, assessment, llamada y acerca de.
- `/[locale]/login` — inicio de sesión.
- `/[locale]/register` — registro de cliente.
- `/[locale]/forgot-password`, `/reset-password`, `/verify-email` — recuperación y verificación.
- `/[locale]/onboarding` — onboarding según rol.

El CTA de assessment debe continuar captando leads. El CTA de crear cuenta debe abrir registro y no competir con la reserva de llamada: ambos resuelven intenciones distintas. Las variables y el endpoint de assessment deben estar configurados y verificados antes de declarar la landing lista para producción.

### Cliente

Navegación propuesta: **Hoy · Mi plan · Mi coach · Mensajes · Perfil**.

| Pantalla | Estado actual en web | API ya disponible | Diseño requerido |
|---|---|---|---|
| Hoy | Conectado al resumen diario, pero vacío sin asignaciones | Resumen diario, completados, agua, racha | Dashboard compacto con progreso, próxima acción, bloques de rutina y estados de descanso/sin plan. |
| Mi plan | Solo un título alrededor de la misma vista de “Hoy”; no hay vista de plan propia | Planes y asignaciones diarios | Vista de calendario o semana, detalle de entrenamiento y nutrición, historial básico. Requiere confirmar API para semana/historial si se quiere implementar. |
| Mi coach | Formularios de filtros y matching, sin resultados cuando no hay coaches publicados; no crea la relación desde la interfaz | Búsqueda, matching, perfil, relación, ofertas, reseñas | Separar “Explorar coaches” de “Mi relación de coaching”; mostrar solicitud, coach activo, paquete/ciclo y CTA contextual. |
| Compra | Ruta de checkout y retorno, sin un recorrido demostrable mientras no existan ofertas publicadas | Checkout, pagos, compras, cancelación pendiente | Flujo con resumen de oferta, precio, estado de pago y pantalla de resultado confiable. |
| Mensajes | Componente de conversación, vacío sin una relación activa | Lista de pares, conversación, envío | Inbox, conversación, fecha/hora, estados vacíos y CTA para encontrar coach. No prometer chat en tiempo real. |
| Perfil | Edita nombre, apellido y zona horaria | Perfil, onboarding, contraseña, avatar, borrado de cuenta, sesiones | Centro de cuenta: datos, objetivos y medidas, seguridad, sesiones, avatar y eliminación. |
| Reseñas/renovación | Formulario y nudges existentes | Reseñas y nudges | Integrarlos después de un ciclo; no dejarlos como rutas aisladas. |

### Coach

Navegación propuesta: **Resumen · Clientes · Planes · Paquetes · Mensajes · Perfil**.

| Pantalla | Estado actual en web | API ya disponible | Diseño requerido |
|---|---|---|---|
| Resumen | No existe como pantalla propia; `/today` no muestra datos de coach | Dashboard y estadísticas de coach | KPIs, clientes activos, solicitudes pendientes, adherencia que necesita atención y próximos pasos. |
| Clientes | Lista básica de relaciones activas; queda vacía si el coach no tiene vínculos | Clientes, cliente individual, vinculados, progreso, paquetes asignados | Lista con búsqueda/filtros y ficha individual con objetivo, adherencia, plan, compra/ciclo y acciones del coach. |
| Solicitudes | No existe | Solicitudes de conexión: listar y aceptar/rechazar | Bandeja de solicitudes con decisión y explicación de estado. |
| Planes | Creación de ejercicios, planes, asignaciones y nutrición; progreso de 7 días | CRUD de ejercicios/planes, asignaciones, nutrición y progreso | Flujo guiado: biblioteca → creador de plan → asignar a cliente. Añadir edición, borrador, confirmación y vista de cliente. |
| Paquetes | Crear, editar precio y activar/desactivar | CRUD de ofertas, asignación a clientes | Catálogo de ofertas, estado publicado/borrador, detalle y asignaciones. No usar `window.prompt` en el diseño final. |
| Mensajes | Funcional básico | Mensajería y check-ins | Inbox compartido con clientes, composición, check-in destacado y contexto del cliente. |
| Perfil de coach | Solo perfil general de cuenta y onboarding inicial | Perfil profesional completo de coach | Editor por secciones: identidad, especialidades, modalidades, disponibilidad, precio, idiomas, enlaces y disponibilidad para clientes. |
| Invitación de cliente | No existe | Crear invitación de cliente | CTA dentro de Clientes: invitar por correo, feedback de entrega y lista de invitaciones. |

### Administrador

Navegación propuesta: **Resumen · Usuarios · Invitaciones · Leads · Operaciones · Reseñas · Configuración**.

| Pantalla | Estado actual en web | API ya disponible | Diseño requerido |
|---|---|---|---|
| Resumen / operaciones | Solo lectura de 3 contadores y tres listas | Operaciones, compras, pagos, auditoría, estadísticas | Dashboard con métricas, filtros, tablas, fechas y enlaces al detalle. |
| Usuarios | No existe | Listar, filtrar, cambiar rol, activar/bloquear, borrar avatar | Tabla con filtros, detalle lateral, cambio de rol/estado con confirmación y auditoría visible. |
| Invitaciones de coach | No existe | Crear, listar, revocar y borrar invitaciones | Lista de invitaciones, CTA de nueva invitación, estados de expiración/uso y acciones. |
| Leads | No existe | Listar leads y actualizar estado | Pipeline o tabla con filtros por estado y detalle de assessment. |
| Reseñas | No existe | Moderar visibilidad | Cola de moderación con contexto, publicar/ocultar y motivo. |
| Sesiones | No existe | Limpieza de sesiones expiradas | Acción administrativa secundaria dentro de Configuración, con confirmación y resultado. |

## 6. Capacidades presentes solo en backend

Estas funciones son candidatas para nuevas pantallas; no deben presentarse como ya visibles en la app.

| Área | Capacidades listas en API que aún no tienen una experiencia completa |
|---|---|
| Cliente | Solicitar/terminar relación de coaching, historial de paquete activo, cancelar compra pendiente, gestión de avatar, contraseña, sesiones y borrado de cuenta. |
| Coach | Dashboard/estadísticas, ficha individual de cliente, solicitudes de conexión, invitación de cliente, listado de clientes vinculados, edición de perfil profesional completo. |
| Admin | Usuarios, roles, bloqueo, leads, invitaciones, estadísticas, moderación de reseñas y limpieza de sesiones. |
| Operación | Registros auditables de compras, pagos y moderación; webhook de pago. |

## 7. Lo que aún falta implementar

### Backend / producto

- Pago de producción: hoy existe un proveedor sandbox y soporte de webhook; falta validar e integrar Stripe u otro proveedor en producción.
- Entrega de email de producción: Mailtrap se usa como sandbox de pruebas; falta proveedor/dominio remitente real.
- Chat en tiempo real, indicadores de lectura, notificaciones push o por correo y adjuntos de mensajes.
- Agenda operativa: Cal.com existe en la landing, pero no hay calendario de sesiones dentro de la app.
- Historial y planificación semanal completa para el cliente; el endpoint actual se centra en el día.
- Eliminación/archivado consistente de planes de entrenamiento y nutrición, versiones/drafts y duplicación de plantillas.
- Reportes analíticos completos, exportación y permisos administrativos más granulares.
- Políticas de privacidad, consentimiento, retención de datos y mecanismos de soporte para un lanzamiento público.

### Web / UX

- Landing con acceso a login y registro.
- Dashboard real para coach y paneles administrativos operables.
- Fichas de cliente y usuario con acciones seguras.
- Flujos visuales de invitación, relación de coaching y asignación de paquete.
- Diseño de pagos, errores, confirmaciones, auditoría y estados vacíos.
- Centro de cuenta completo y editor profesional de coach.
- Diseño responsive acabado para todas las rutas, no solo escritorio.
- Unificación de copy, marca, iconografía y componentes de landing y área autenticada.

## 8. Sistema de diseño que debe producir Claude Design

Entregar un sistema reutilizable, antes de diseñar pantallas aisladas.

### Fundamentos

- Paleta semántica: fondo, superficie, texto, borde, marca, éxito, advertencia, error e información; versiones light/dark y contraste AA.
- Escala tipográfica: display, H1–H4, cuerpo, etiqueta, dato numérico y texto auxiliar.
- Escala de espaciado, tamaños de iconos, radio, elevación, grid y breakpoints.
- Tokens de estado: pendiente, activo, completado, fallido, cancelado, borrador y archivado.
- Voz: directa, cálida, científica y sin promesas de transformación exageradas.

### Componentes requeridos

- Botones primario, secundario, terciario, destructivo, icono y loading.
- Navegación pública, navegación de aplicación por rol, menú móvil, breadcrumb y selector de idioma/tema.
- Tarjetas de resumen, métricas, progreso, plan, coach, cliente, oferta, compra y auditoría.
- Tablas responsivas con filtros, búsqueda, paginación, selección y acciones por fila.
- Formularios, selects, campos numéricos, selector de fecha, textarea, validación y ayuda contextual.
- Badges y chips de estado; timeline de actividad; empty states; skeletons; alertas y toasts.
- Modales de confirmación para bloqueo, revocación, cancelación y moderación.
- Inbox y burbujas de conversación.

Todos deben documentar variantes, estados hover/focus/disabled/loading/error, comportamiento móvil y ejemplos de contenido ES/EN.

## 9. Flujos que Claude Design debe diseñar primero

1. Landing → **Crear cuenta** → verificación de correo → onboarding de cliente → Hoy vacío.
2. Landing → **Iniciar sesión** → recuperación de contraseña → cuenta existente.
3. Landing: evaluación → lead confirmado → reserva de llamada o registro.
4. Cliente: explorar coach → ver perfil/oferta → checkout → pago confirmado → relación/plan.
5. Coach: onboarding → crear oferta → invitar cliente → crear/asignar plan → revisar progreso → enviar check-in.
6. Admin: ver resumen → filtrar usuario → cambiar estado/rol con confirmación → registrar resultado en auditoría.
7. Admin: crear invitación de coach y revisar su estado.

## 10. Entregables esperados de Claude Design

- Mapa de navegación por rol y diagrama de los seis flujos prioritarios.
- Biblioteca de tokens y componentes con especificación para Tailwind/shadcn.
- Diseños desktop y móvil de las pantallas de la sección 5.
- Prototipos de los estados vacío, cargando, éxito, error y permiso denegado.
- Lista explícita de elementos que necesitan backend nuevo, sin inventar endpoints.
- Handoff por pantalla: objetivo, datos mostrados, acciones, permisos de rol y componentes reutilizados.

## 11. Criterio de aceptación para la siguiente implementación

Antes de implementar una pantalla, confirmar: ruta, rol permitido, endpoint disponible, estado vacío, estado de error, acción principal y traducciones ES/EN. El diseño debe ser la referencia; el código no debe introducir otro sistema visual paralelo.
