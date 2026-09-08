# Steady Vitality

Steady Vitality conecta clientes con coaches para sostener un proceso de salud y entrenamiento. Este lenguaje define el vínculo que concede acceso entre ambas partes.

## Language

**Connection request**:
An expression of interest from a client to a coach. It is pending, accepted, or declined and does not itself grant access to client data.
_Avoid_: Relationship request, coach request

**Coaching relationship**:
The historical record that a specific client is actively working with a specific coach. A client can have at most one active coaching relationship.
_Avoid_: Connection, assignment, link

**Current coach pointer**:
The `users.coachId` value derived from a client's active coaching relationship. It supports existing direct lookups and is never an independent source of truth.
_Avoid_: Coach relationship, coach assignment

**Package assignment**:
The record of a coach assigning a package to a client with its delivery status. It is permitted only within that coach's active coaching relationship.
_Avoid_: Coaching relationship, subscription

**Plan template**:
A reusable definition of actions a coach may schedule for clients. Editing it affects future assignments only.
_Avoid_: Active plan, routine assignment

**Plan assignment**:
An immutable snapshot of a plan template scheduled for one client over a date range and interpreted in that client's time zone.
_Avoid_: Plan template, workout

**Scheduled action**:
One workout exercise, meal, water target, or check-in expected from a client on a local calendar day.
_Avoid_: Task, event

**Daily completion**:
The client's current done/not-done answer for one scheduled action on one local calendar day.
_Avoid_: Activity, workout history

**Rest day**:
A local day with no scheduled actions. It is neutral for adherence and streak calculations.
_Avoid_: Missed day, incomplete day

**Humane streak**:
A count of successful scheduled days that preserves momentum across rest days and one isolated missed day, but resets after two consecutive missed scheduled days.
_Avoid_: Login streak, perfect streak

**Offer**:
A reusable package published by a coach. Editing it affects future purchases only.
_Avoid_: Contract, active package

**Purchase**:
A client's immutable snapshot of an offer and its commercial terms. It begins pending and becomes active only after a confirmed payment event.
_Avoid_: Offer, subscription

**Payment attempt**:
One auditable checkout attempt for a purchase, including provider references, amount, currency, platform fee, and settlement status.
_Avoid_: Purchase, receipt

**Coaching cycle**:
The time-boxed delivery period created by an activated purchase. Renewal creates another cycle and preserves the previous one.
_Avoid_: Subscription, relationship
