# Proposal: US30 Delete Shopping Session History Record

## Problem Statement
Registered users can save and browse past shopping sessions, but they cannot remove accidental, duplicate, or unwanted records. This makes the history dashboard harder to trust and maintain over time, especially for budget-conscious users who rely on the data to review household spending.

## Intent
Allow an authenticated user to delete one specific historical shopping session from their own history, with a defensive confirmation step and immediate UI feedback after the backend confirms deletion.

The change will keep current project naming and data model language: **shopping sessions**. The API contract for this change is:

- `DELETE /api/shopping-sessions/:id`

## Scope

### In scope
- Add an authenticated backend endpoint: `DELETE /api/shopping-sessions/:id`.
- Verify ownership before deletion using the authenticated `userId` from JWT middleware.
- Delete the `ShoppingSession` row and associated `ShoppingSessionItem` rows via existing Prisma cascade behavior (`onDelete: Cascade`) or equivalent repository implementation.
- Add an application use case and ports following backend hexagonal architecture:
  - incoming port for delete use case,
  - outgoing repository method for ownership-aware deletion.
- Add a frontend delete action in the `/shopping-history` detail panel.
- Add a defensive confirmation modal/dialog before calling delete.
- Extend the shopping-session frontend gateway/client with a delete method.
- Update local shopping-history state after a successful response so the deleted entry disappears without a page refresh.
- Keep behavior consistent across desktop and mobile master-detail history layouts.

### Out of scope
- Renaming existing `ShoppingSession`/`ShoppingSessionItem` models to `PurchaseHistory`/`PurchaseItem`.
- Adding a `DELETE /api/purchases/:id` alias.
- Bulk delete, undo, archive, or soft-delete history management.
- Admin deletion of another user's records.
- Analytics recalculation beyond removing the local entry from the currently loaded history.

## Affected Areas

### Backend
- `backend/src/application/ports/incoming/` — new delete use-case port.
- `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts` — ownership-aware delete method.
- `backend/src/application/use-cases/shopping-session/` — delete use case and contracts.
- `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts` — Prisma deletion implementation.
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts` — `delete` handler.
- `backend/src/infrastructure/composition/bootstrap.ts` — use-case construction and route registration.
- Tests adjacent to controller/use case/repository boundaries where appropriate.

### Frontend
- `frontend/src/lib/http/ShoppingSessionGateway.ts` — delete method contract.
- `frontend/src/lib/http/ShoppingSessionHttpClient.ts` — `DELETE /api/shopping-sessions/:id` implementation.
- `frontend/src/app/shopping-history/page.tsx` — composition/root wiring only if new dependency methods or state callbacks are needed.
- `frontend/src/features/shopping-history/` — detail-panel delete action, confirmation dialog, and local state removal behavior.

## Product Behavior
1. User opens `/shopping-history` and selects a historical shopping session.
2. The detail panel exposes a clear delete action (icon and/or text), visually distinct from navigation and filtering controls.
3. Clicking delete opens a confirmation dialog with explicit irreversible-action copy, e.g.:
   - `¿Seguro que querés eliminar esta compra? Esta acción no se puede deshacer.`
4. Cancel closes the dialog and leaves the history unchanged.
5. Confirm calls the authenticated delete endpoint.
6. On success:
   - the deleted session is removed from local state,
   - timeline groups recalculate naturally,
   - selected detail changes to the next available entry or returns to list/empty state if none remain,
   - no hard refresh is required.
7. On failure:
   - the entry remains visible,
   - the user gets a non-destructive error message/toast.

## Architecture Notes

### Backend
- Preserve strict hexagonal boundaries.
- Controller only parses path/auth context and delegates to an incoming use-case port.
- Use case performs application flow and delegates persistence to the repository port.
- Prisma remains isolated in the persistence adapter.
- Ownership verification should be encoded at the repository/use-case boundary so deleting another user's session is impossible even if a valid ID is guessed.

Preferred repository contract shape:

```ts
deleteByIdForUser(sessionId: string, userId: string): Promise<boolean>;
```

`false` means no owned record was deleted. The controller can translate that into `404` to avoid leaking whether the session exists for another user.

### Frontend
- Keep page/component code maintainable and class-first where cross-file behavior is introduced.
- Avoid generic exported `utils` modules.
- Keep modal state and delete orchestration isolated in shopping-history feature hooks/classes rather than growing `page.tsx`.
- Existing `ShoppingSessionGateway` remains the boundary for HTTP access.

## Proposal Question Round
Interactive SDD would normally ask a short product question round before finalizing. This delegated subagent cannot ask the end user directly, so the proposal records these assumptions for parent/user review:

1. **Delete semantics:** use hard delete for now, relying on existing cascade delete for items, rather than soft-delete.  
   Assumption: users expect the record to disappear and no audit/recovery requirement exists yet.
2. **Authorization response:** return `404` when the record does not exist or is not owned by the user.  
   Assumption: this avoids leaking another user's history IDs.
3. **Delete placement:** place the primary delete action inside the detail panel, not on every timeline row.  
   Assumption: this reduces accidental deletes and keeps the timeline focused on navigation.
4. **Post-delete selection:** after successful delete, select the next remaining filtered entry when available; otherwise show the empty/list state.  
   Assumption: this minimizes navigation disruption.
5. **Undo:** no undo in this slice.  
   Assumption: the confirmation modal is enough defensive friction for v1.

## Risks
- **Accidental destructive action:** mitigated by explicit confirmation modal and clear copy.
- **Unauthorized deletion:** mitigated by JWT auth plus ownership-aware repository deletion.
- **State inconsistency after deletion:** local state must remove the deleted session and reconcile selected detail/mobile view state.
- **Route naming mismatch with US text:** mitigated by explicit decision to keep existing `shopping-sessions` naming.
- **Overgrown frontend state hook/component:** keep delete behavior in focused shopping-history feature abstractions, not in the page component.

## Rollback Plan
- Backend: remove `DELETE /api/shopping-sessions/:id` route wiring and delete use-case/repository method; existing save/list behavior remains unaffected.
- Frontend: remove delete action, confirmation modal wiring, and gateway delete method; history list/detail remains read-only.
- Database: no schema rollback needed if hard delete uses existing `ShoppingSession`/`ShoppingSessionItem` cascade relationship.

## Success Criteria
- Authenticated user can delete their own selected shopping session from `/shopping-history`.
- Deleting another user's session by ID is not possible and does not leak ownership details.
- Associated `ShoppingSessionItem` rows are removed by cascade or equivalent repository behavior.
- Confirmation modal appears before destructive action.
- After successful deletion, the timeline and detail panel update without hard refresh.
- Backend unit/controller tests cover success, unauthorized, invalid/missing id, and not-owned/not-found behavior.
- Frontend tests cover confirmation, cancel, successful local removal, and failure preserving the entry.
- Backend and frontend builds/tests for touched areas pass.
