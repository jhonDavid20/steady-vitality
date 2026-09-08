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
