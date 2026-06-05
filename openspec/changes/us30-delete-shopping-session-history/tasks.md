# Tasks — US30 Delete Shopping Session History Record

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 260–380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (backend + frontend cohesive slice) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Implementation Tasks (dependency ordered)

### 1) Backend — add ownership-safe delete use case and contracts
- [x] Create `backend/src/application/ports/incoming/DeleteShoppingSessionUseCasePort.ts`.
- [x] Extend `backend/src/application/use-cases/shopping-session/contracts.ts` with:
  - `DeleteShoppingSessionInput`
  - `DeleteShoppingSessionResult`
- [x] Add `backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.ts`.
- [x] Extend `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts` with:
  - `deleteByIdForUser(sessionId: string, userId: string): Promise<boolean>`

**Verification**
- Type-check backend changed files (LSP clean).

### 2) Backend — persistence adapter and HTTP route wiring
- [x] Implement repository method in `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts` using ownership-filtered delete (`id + userId`).
- [x] Extend `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts` with `delete` handler for `DELETE /api/shopping-sessions/:id`.
- [x] Wire use case + route in `backend/src/infrastructure/composition/bootstrap.ts`.

**Verification**
- `cd backend && npm run build`

### 3) Backend tests (strict, behavior-first)
- [x] Add `backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.unit.test.ts`:
  - should delete when ownership matches
  - should return not-deleted when no owned row exists
  - should reject invalid inputs
- [x] Extend `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts` for delete flow:
  - `200` on success
  - `400` invalid/missing id
  - `401` unauthorized
  - `404` not found/not owned
  - delegates unexpected errors to `next`

**Verification**
- `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`

### 4) Frontend — gateway delete contract
- [x] Extend `frontend/src/lib/http/ShoppingSessionGateway.ts` with delete request/response contract.
- [x] Implement `delete(sessionId, token)` in `frontend/src/lib/http/ShoppingSessionHttpClient.ts` against `DELETE /api/shopping-sessions/:id`.

**Verification**
- LSP clean in gateway/client files.

### 5) Frontend — delete coordinator and state integration
- [x] Add `frontend/src/features/shopping-history/model/ShoppingHistoryDeleteCoordinator.ts` (class-first, dependency-injected gateway).
- [x] Extend `frontend/src/features/shopping-history/hooks/useShoppingHistoryEntries.ts` with `removeEntryBySessionId`.
- [x] Add `frontend/src/features/shopping-history/hooks/useShoppingHistoryDelete.ts` to manage:
  - confirmation open/close
  - pending delete id
  - deleting state
  - confirm -> coordinator call -> local removal -> toast feedback
- [x] Integrate delete hook in `frontend/src/features/shopping-history/hooks/useShoppingHistoryState.ts`.

**Verification**
- LSP clean in shopping-history hook/model files.

### 6) Frontend UI — confirmation modal + detail action
- [x] Create `frontend/src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.tsx`.
- [x] Extend `frontend/src/features/shopping-history/components/TicketDetail.tsx` with destructive `Eliminar` action callback.
- [x] Wire modal + delete action in `frontend/src/app/shopping-history/page.tsx` composition root.

**Verification**
- `cd frontend && npm run build`
- Manual behavior check:
  - delete button visible in detail panel
  - confirmation modal copy shown
  - cancel does not mutate state
  - confirm removes entry without hard refresh

### 7) Frontend tests (strict, co-located)
- [x] Add `frontend/src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.unit.test.tsx`.
- [x] Add `frontend/src/features/shopping-history/hooks/useShoppingHistoryDelete.unit.test.tsx`.
- [x] Add/extend `frontend/src/features/shopping-history/components/TicketDetail.unit.test.tsx` for delete trigger callback.

**Verification**
- `cd frontend && npm run test -- src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.unit.test.tsx src/features/shopping-history/hooks/useShoppingHistoryDelete.unit.test.tsx src/features/shopping-history/components/TicketDetail.unit.test.tsx`

## Final verification gate
- [x] Backend build + targeted tests pass.
- [x] Frontend build + targeted tests pass.
- [x] Delete flow works desktop/mobile without regressions in history navigation state.
- [x] Route/contract naming remains `shopping-sessions` (no `purchases` alias in this slice).
