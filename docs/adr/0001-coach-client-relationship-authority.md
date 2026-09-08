# Coaching relationships own coach-client access

`client_coach_relationships` is the authoritative historical record of coach-client access; `connection_requests` only records a request, and `users.coachId` is a derived pointer to the active relationship for efficient existing lookups. We chose this over treating `users.coachId` as the authority because a pointer cannot preserve an ended relationship or enforce its lifecycle, while keeping it synchronized avoids a disruptive rewrite of all current queries.

## Consequences

Accepting a request creates an active relationship and updates the pointer in one transaction. Ending a relationship clears that pointer, and the database permits only one active relationship per client.
