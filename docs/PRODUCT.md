# Steady Vitality — Product Foundation

> La base de producto para (re)construir la app: visión, principios, usuarios,
> features, modelo de negocio, reputación, compromiso y alcance por fases.
> Construido a partir de la entrevista de discovery + research de mercado (fuentes al final).
> Versión: 1.0 · Fecha: 2026-08-21

---

## 1. Visión

Steady Vitality no es "otro marketplace para encontrar coach". Es un **hub de salud
unificado** donde el usuario, de la mano de un coach comprometido, **cambia hábitos**:

- **Plan de alimentación** + **tracking real diario** (adherencia primero, con educación de macros).
- **Rutinas de ejercicio** habilitadas por el coach, con videos/demostraciones.
- **Wearables** (Apple Watch, Whoop, Fitbit…) para centralizar la salud *(fase 2)*.
- **IA copiloto** que da "panorama" a cliente y coach *(feature Premium)*.

> **Estrella polar:** que la gente **empiece a cambiar hábitos** — no que "intente hacer
> ejercicio" y se vaya. El éxito se mide en adherencia y permanencia, no en features.

---

## 2. Principios de diseño (north star de UX)

Derivados del "qué NO es" del founder + research de retención/hábitos:

1. **Minimalismo y foco.** Menos es más. **Una acción principal por pantalla.** Nada de bombardeo.
2. **"Hoy" es la casa.** La home responde: *¿qué hago hoy / qué llevo hoy?* hacia mi objetivo.
3. **Rachas humanas, no de culpa.** Preferir *commitment contracts* (me comprometo X semanas)
   sobre rachas que castigan; perder un día no es "fracaso".
4. **Micro-feedback.** Refuerzo inmediato tras cada acción ("+12%", "3/4 comidas hoy").
5. **Divulgación progresiva.** Educar de a poco (macros según tu condición), no de golpe.
6. **Hábitos basados en identidad.** "Soy alguien que entrena", no solo "hago tareas".

---

## 3. Usuarios y roles

| Rol | Qué busca | Cómo lo enamoramos |
|---|---|---|
| **Cliente** | Lograr su objetivo sin sentirse perdido | Vista "Hoy" clara, ver progreso real, micro-logros, IA que lo guía |
| **Coach** | Gestionar clientes sin caos y captar más | **Reputación (ClutchScore)** + visibilidad, herramientas e IA de seguimiento |
| **Admin/Plataforma** | Salud del negocio y calidad | Métricas, moderación, gestión de comisiones y disputas |

Regla central: **relación comprometida** — al comprar a un coach quedas atado a un plan por
un tiempo determinado (compromiso real → resultados reales).

---

## 4. El momento mágico — vista "Hoy"

Cuando el cliente abre la app ve, en orden de foco:
1. **Lo primero:** su objetivo del día / próximo paso (entreno de hoy o "lo que llevas hoy").
2. Entreno de hoy (marcar hecho, ver demos).
3. Comidas a seguir / registrar (adherencia + agua).
4. Progreso hacia el objetivo + racha.
5. Check-in / mensaje del coach.
6. *(fase 2)* Actividad del wearable.

---

## 5. Pilares de features

### 5.1 Coaching y relación
- Descubrir coach → comprar **paquete comprometido** (time-boxed) → onboarding → plan asignado.
- Estados de relación y ciclo de vida (ya modelado en el backend: `ClientCoachRelationship`).

### 5.2 Nutrición (adherencia-first + educativa)
- El **coach define el plan**; el cliente **registra adherencia** (cumplí/no cumplí) + agua.
- **Educación de macros** según la condición del usuario (Premium: desglose de macros/calorías).
- Registro simple primero; base de alimentos / código de barras / foto = mejora posterior.

### 5.3 Entrenos
- El coach **habilita ejercicios desde una librería** (elige qué ve el cliente).
- El cliente **marca lo hecho por día**; **videos y demostraciones** incluidos.
- Registro de series/reps/peso = incremento posterior (v1 puede ser "hecho / no hecho").

### 5.4 IA — panorama *(Premium)*
- **Cliente:** "vas corto de proteína", "dormiste poco → baja intensidad hoy", resumen semanal, educación de macros.
- **Coach:** **dashboard de clientes en riesgo** ("estos 3 se están cayendo"), resúmenes automáticos, sugerencias.
- Entra en **v1.5** como el principal "wow" de Premium.

### 5.5 Wearables *(fase 2)*
- Apple Watch, Whoop, Fitbit… Datos: pasos, HR, **sueño**, calorías activas, recuperación/HRV.

### 5.6 Reputación del coach → **ClutchScore** (ver §7)

---

## 6. Modelo de negocio (suscripción + comisión)

Dos motores de ingreso. Basado en research: en Health & Fitness **los trials ayudan** y el
*freemium* captura más ingreso a 12 meses; las plataformas de coaches cobran por cliente
activo + add-ons.

### 6.1 Cliente — Freemium + trial
| | **Free** (el gancho / motor de hábito) | **Premium** (suscripción) |
|---|---|---|
| Vista "Hoy" | ✅ | ✅ |
| Seguir plan + marcar entrenos | ✅ | ✅ |
| Adherencia nutricional + agua + racha | ✅ | ✅ |
| Chat con coach | ✅ | ✅ |
| **IA (panorama, insights)** | — | ✅ |
| Macros/calorías detallados + educación | básico | ✅ |
| Historial y tendencias completas | limitado | ✅ |
| Wearables *(fase 2)* | — | ✅ |

- **Trial de 7 días** de Premium (annual empujado; el trial sube el LTV en fitness).

### 6.2 Coach — Freemium
- **Free:** pocos clientes, features y **visibilidad limitados**.
- **Premium (suscripción):** más/ilimitados cupos, **mayor visibilidad**, herramientas + IA
  (dashboard de riesgo, resúmenes), branding.

### 6.3 Paquetes de coaching (el core del marketplace)
- El cliente paga al coach un **paquete comprometido por tiempo**.
- **La plataforma cobra comisión**; **menor comisión si el coach es Premium**.

> Resultado: (1) SaaS (Premium cliente + Premium coach) + (2) **comisión** sobre paquetes.

---

## 7. Reputación del coach — ClutchScore

Basado en best practices de marketplaces de coaching:

- **Base de confianza:** promedio **bayesiano** de reseñas 1-5★. **No se muestra score hasta ≥5
  reseñas** (evita que un novato con un 5★ supere a uno probado). Reseñas pueden ser anónimas.
- **Señales de resultado (peso alto):** adherencia de sus clientes, **retención/renovaciones**,
  tasa de finalización de planes, tiempo de respuesta, nº de clientes activos.
- **Premium sube visibilidad, NO compra el score.** El puntaje es mérito; la visibilidad se paga.
- **Badges** legibles: "Alta retención", "Responde rápido", "Resultados verificados".
- **Matching:** un cuestionario de onboarding del cliente mejora el emparejamiento cliente↔coach.

---

## 8. Compromiso, reembolso y renovación

Basado en prácticas de paquetes prepagos de PT:

- **Plan time-boxed** (4/8/12 semanas). Sin cambios casuales de coach a mitad → ese es el compromiso.
- **Reembolso caso por caso:**
  - Por defecto **no reembolsable en efectivo**.
  - Si procede, se devuelve como **créditos en la app** para buscar otro coach (dinero se queda en el ecosistema).
  - **Razón vaga → no procede** (continúa o se cancela sin reembolso).
  - **Excepción médica documentada** → sí.
  - **Ventana de arrepentimiento** antes de que arranque el plan.
- **Al terminar el plan:** nudge para **renovar** (mismo coach), **upsell** (plan más largo/alto),
  o **feedback + reseña estructurada** (alimenta el ClutchScore). Auto-recordatorio antes de expirar.

> Nota: esto debe reflejarse en Términos/Políticas claras (reduce disputas). Revisar con enfoque legal por mercado.

---

## 9. Alcance por fases

### v1 — MVP: relación comprometida + motor de hábito
- Auth + roles *(ya existe en el backend)*.
- Descubrimiento de coach + **compra de paquete comprometido** (pagos).
- **Coach:** plan builder (nutrición + entrenos desde librería, habilitar por cliente, subir videos).
- **Cliente:** **vista "Hoy"** (entreno marcar-hecho, adherencia nutricional + agua, racha, progreso, chat con coach).
- **Reseñas básicas** (recolectar; ClutchScore completo viene después).

### v1.5 — IA + reputación + loop de retención
- **IA panorama** (insights cliente + dashboard de riesgo del coach) tras el **paywall Premium**.
- **Educación de macros** según condición.
- **ClutchScore** compuesto + badges.
- **Renovación / feedback** al terminar el plan.
- Tiers Premium (cliente y coach) + comisión diferenciada.

### v2 — Salud unificada a escala
- **Wearables** (Apple Watch, Whoop, Fitbit…): pasos, HR, sueño, calorías, recuperación.
- Nutrición avanzada (base de alimentos, código de barras, foto).
- Analítica avanzada, escala de marketplace, matching por IA.

---

## 10. Decisiones abiertas (a confirmar)

1. **Precio** de cada tier (cliente Premium, coach Premium) y **% de comisión** (Premium vs free).
2. **Duración(es)** estándar de paquete (¿4/8/12?) y si el coach las define.
3. ¿La **IA** es 100% Premium, o hay un "teaser" gratis (1 insight/semana) para enganchar?
4. **Nombre/branding** definitivo (Steady Vitality vs otro).
5. Alcance exacto del **chat** en v1 (mensajería simple vs hilos por tema).

---

## Fuentes (research)
- Everfit vs Trainerize vs TrueCoach — pricing/features: fitbudd.com, blog.everfit.io, assistantcoach.fit
- Freemium vs trial / retención en fitness: RevenueCat *State of Subscription Apps*, Adapty, RocketShip HQ, Business of Apps
- Reputación en marketplaces de coaching (rating bayesiano): help.coaching.com, sharetribe.com, paperbell.com
- UX de hábitos/retención (streaks humanas, micro-feedback): ijraset.com, dataconomy.com, keytotech.com, pardypanda.com
- Políticas de cancelación/reembolso de PT prepago: issaonline.com, exercise.com, michaelmoodyfitness.com
