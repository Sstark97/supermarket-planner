# Design: US30 Delete Shopping Session History Record

## 1) Context and Decision Summary

US30 adds destructive deletion for an authenticated user's own shopping-session history record.

Confirmed API naming decision:

- Use `DELETE /api/shopping-sessions/:id`
- Do **not** add `DELETE /api/purchases/:id`
- Do **not** rename `ShoppingSession` / `ShoppingSessionItem`
- Use hard delete through existing Prisma cascade (`ShoppingSessionItem.session` uses `onDelete: Cascade`)

Primary quality constraints:

- Preserve backend hexagonal boundaries.
- Keep frontend behavior behind explicit gateway/model/hooks contracts.
- Avoid generic exported utility modules; use class-first model policies where behavior crosses files.
- Keep page/component code readable and focused.

## 2) Backend Design

### 2.1 Request / Response Contract

Endpoint:

```http
DELETE /api/shopping-sessions/:id
Authorization: Bearer <backend-jwt>
```

Responses:

| Condition | Status | Body |
|---|---:|---|
| Deleted owned session | `200 OK` | `{ "deletedSessionId": "<id>" }` |
| Missing/empty authenticated user | `401 Unauthorized` | `{ "error": "Unauthorized" }` |
| Missing/invalid path id | `400 Bad Request` | `{ "error": "Invalid shopping session id" }` |
| Not found or not owned | `404 Not Found` | `{ "error": "Shopping session not found" }` |
| Unexpected failure | existing error middleware | existing error mapping |

`404` intentionally covers both missing and not-owned records to avoid ownership leakage.

### 2.2 Application Contracts

Add incoming port:

```ts
// backend/src/application/ports/incoming/DeleteShoppingSessionUseCasePort.ts
import type {
  DeleteShoppingSessionInput,
  DeleteShoppingSessionResult,
} from "@application/use-cases/shopping-session/contracts";

export interface DeleteShoppingSessionUseCasePort {
  execute(input: DeleteShoppingSessionInput): Promise<DeleteShoppingSessionResult>;
}
```

Extend shopping-session contracts:

```ts
export interface DeleteShoppingSessionInput {
  sessionId: string;
  userId: string;
}

export interface DeleteShoppingSessionResult {
  deletedSessionId: string;
  wasDeleted: boolean;
}
```

Design note: `wasDeleted` belongs to application result so the controller can map `false` to `404` without throwing for an expected not-found/not-owned case.

### 2.3 Repository Port

Extend `ShoppingSessionRepository`:

```ts
export interface ShoppingSessionRepository {
  save(session: ShoppingSession): Promise<ShoppingSession>;
  findByUserId(userId: string): Promise<ShoppingSession[]>;
  deleteByIdForUser(sessionId: string, userId: string): Promise<boolean>;
}
```

Semantics:

- `true`: exactly one owned `ShoppingSession` was deleted.
- `false`: no row matched both `id` and `userId`.
- No domain entity is required for delete; this is ownership-safe persistence coordination.

### 2.4 Use Case

New use case:

```txt
backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.ts
```

Responsibilities:

1. Log execution intent (session id + user id, no sensitive payload).
2. Validate `sessionId` and `userId` are non-empty strings.
3. Call `shoppingSessionRepository.deleteByIdForUser(sessionId, userId)`.
4. Return `{ deletedSessionId: sessionId, wasDeleted }`.

No Prisma, Express, or JWT imports in application.

### 2.5 Prisma Adapter

Implement in `PrismaShoppingSessionRepository`:

```ts
async deleteByIdForUser(sessionId: string, userId: string): Promise<boolean> {
  const deleteResult = await prisma.shoppingSession.deleteMany({
    where: { id: sessionId, userId },
  });

  return deleteResult.count === 1;
}
```

Why `deleteMany`:

- It encodes ownership in the delete operation.
- It avoids a separate `findFirst` then `delete`, reducing race windows.
- It does not throw when not found, allowing safe `false` mapping.
- Cascade deletes `ShoppingSessionItem` rows through current Prisma relation.

### 2.6 Controller

Update constructor:

```ts
constructor(
  private readonly saveShoppingSessionUseCase: SaveShoppingSessionUseCasePort,
  private readonly getShoppingSessionsUseCase: GetShoppingSessionsUseCasePort,
  private readonly deleteShoppingSessionUseCase: DeleteShoppingSessionUseCasePort,
) {}
```

Add `delete` handler:

```ts
delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = this.readAuthenticatedUserId(res);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessionId = this.readSessionId(req);
    if (!sessionId) {
      res.status(400).json({ error: "Invalid shopping session id" });
      return;
    }

    const result = await this.deleteShoppingSessionUseCase.execute({ sessionId, userId });
    if (!result.wasDeleted) {
      res.status(404).json({ error: "Shopping session not found" });
      return;
    }

    res.status(200).json({ deletedSessionId: result.deletedSessionId });
  } catch (error) {
    next(error);
  }
};
```

Implementation detail: keep small private methods in the controller if needed (`readAuthenticatedUserId`, `readSessionId`) to avoid repeating `res.locals` parsing across handlers. These methods remain infrastructure-only and do not leak into application.

### 2.7 Composition Root

In `BackendCompositionBootstrap.createApplication()`:

1. Instantiate `DeleteShoppingSessionUseCase` with `shoppingSessionRepository` and `logger`.
2. Pass it into `ShoppingSessionController` constructor.
3. Register route:

```ts
app.delete(
  "/api/shopping-sessions/:id",
  jwtAuthMiddleware.authenticate,
  shoppingSessionController.delete,
);
```

Route should sit next to existing `GET`/`POST /api/shopping-sessions` registrations.

## 3) Frontend Design

### 3.1 HTTP Gateway Contract

Extend `ShoppingSessionGateway`:

```ts
export interface DeleteShoppingSessionResponse {
  deletedSessionId: string;
}

export interface ShoppingSessionGateway {
  save(...): Promise<SaveShoppingSessionResponse>;
  list(token: string): Promise<ListShoppingSessionsResponse>;
  delete(sessionId: string, token: string): Promise<DeleteShoppingSessionResponse>;
}
```

Implement in `ShoppingSessionHttpClient`:

```ts
async delete(sessionId: string, token: string): Promise<DeleteShoppingSessionResponse> {
  const url = `${this.baseUrl}/api/shopping-sessions/${encodeURIComponent(sessionId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await res.json()) as DeleteShoppingSessionApiResponse;
  if (!res.ok) {
    throw new Error(`Shopping session API error ${res.status}: ${json.error ?? "Unknown error"}`);
  }

  return json;
}
```

### 3.2 Feature Model Classes

Add class-first policies under `frontend/src/features/shopping-history/model/`.

#### `ShoppingHistoryDeleteCoordinator`

Purpose: encapsulate the delete API command and auth-token retrieval so React hooks/components do not duplicate transport details.

```ts
export interface DeleteShoppingHistoryRecordResult {
  deletedSessionId: string;
}

export class ShoppingHistoryDeleteCoordinator {
  constructor(private readonly shoppingSessionGateway: ShoppingSessionGateway) {}

  async deleteRecord(sessionId: string): Promise<DeleteShoppingHistoryRecordResult> {
    const token = await getAuthToken();
    return this.shoppingSessionGateway.delete(sessionId, token);
  }
}
```

Object construction belongs in `app/shopping-history/page.tsx` composition root next to existing formatter/grouper/filter/projector construction.

### 3.3 State Reconciliation

Current `useShoppingHistoryEntries` owns `entries` loaded from the gateway. Extend it to expose a local removal method:

```ts
interface ShoppingHistoryEntriesState {
  entries: ShoppingSessionHistoryEntry[];
  isLoading: boolean;
  errorMessage: string | null;
  removeEntryBySessionId: (sessionId: string) => void;
}
```

Implementation:

```ts
function removeEntryBySessionId(sessionId: string): void {
  setEntries((currentEntries) =>
    currentEntries.filter((entry) => entry.sessionId !== sessionId),
  );
}
```

Why here:

- `entries` source state remains encapsulated where it is created.
- Existing derived hooks (`filters`, `selection`, `accordion`) naturally recalculate from the new array.
- No hard refresh or duplicate state stores are introduced.

### 3.4 Delete Hook

Add focused hook:

```txt
frontend/src/features/shopping-history/hooks/useShoppingHistoryDelete.ts
```

Responsibilities:

- Track targeted session id.
- Open/close confirmation modal.
- Track delete pending state.
- Execute coordinator command on confirm.
- Call `removeEntryBySessionId(deletedSessionId)` after success.
- Report failure with toast or returned error state.

Proposed contract:

```ts
interface ShoppingHistoryDeleteState {
  isConfirmationOpen: boolean;
  isDeleting: boolean;
  sessionIdPendingDeletion: string | null;
  requestDeleteConfirmation: (sessionId: string) => void;
  cancelDeleteConfirmation: () => void;
  confirmDelete: () => Promise<void>;
}
```

Hook dependencies:

```ts
useShoppingHistoryDelete({
  deleteCoordinator,
  removeEntryBySessionId,
  showToast,
})
```

Use toast from existing `useToast()` in page or a feature container. Keep toast dependency as a port-like callback:

```ts
showToast: (message: string, type: "success" | "error") => void
```

### 3.5 `useShoppingHistoryState` Integration

Extend state dependencies:

```ts
interface ShoppingHistoryStateDependencies {
  shoppingSessionGateway: ShoppingSessionGateway;
  entryFilter: ShoppingHistoryEntryFilter;
  timelineGrouper: ShoppingHistoryTimelineGrouper;
  accordionStateProjector: ShoppingHistoryAccordionStateProjector;
  deleteCoordinator: ShoppingHistoryDeleteCoordinator;
  showToast: (message: string, type: "success" | "error") => void;
}
```

`useShoppingHistoryState` composes:

1. `useShoppingHistoryEntries(...)` -> now returns `removeEntryBySessionId`.
2. `useShoppingHistoryDelete(...)` with delete coordinator + removal callback.
3. existing filters, selection, accordion logic.

Expose delete state/actions:

```ts
isDeleteConfirmationOpen
isDeleting
requestDeleteConfirmation
cancelDeleteConfirmation
confirmDelete
```

### 3.6 Confirmation Component

Add:

```txt
frontend/src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.tsx
```

Props:

```ts
interface DeleteShoppingSessionConfirmationDialogProps {
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
```

Behavior:

- Returns `null` when closed.
- Renders modal card + backdrop.
- Copy in Spanish:
  - Title: `Eliminar compra`
  - Body: `¿Seguro que querés eliminar esta compra? Esta acción no se puede deshacer.`
  - Cancel: `Cancelar`
  - Confirm: `Eliminar`
- Confirm button disabled while deleting and shows loading label `Eliminando…`.
- Use semantic `role="dialog"`, `aria-modal="true"`, and accessible button names.

### 3.7 Detail Panel Delete Action

Extend `TicketDetail` props:

```ts
interface TicketDetailProps {
  entry: ShoppingSessionHistoryEntry | null;
  ...
  onRequestDelete?: (sessionId: string) => void;
}
```

Placement:

- Inside detail panel header/summary area, near total or below metadata.
- Use destructive styling (`text-red-*`, `border-red-*`) and clear label `Eliminar` with trash icon.
- Do not put delete on each timeline row for v1; detail-panel-only reduces accidental deletes.

Example behavior:

```tsx
{entry && onRequestDelete && (
  <button onClick={() => onRequestDelete(entry.sessionId)} aria-label="Eliminar compra">
    <Trash2 size={16} />
    Eliminar
  </button>
)}
```

### 3.8 Page Composition

In `app/shopping-history/page.tsx`:

1. Instantiate `ShoppingHistoryDeleteCoordinator` next to other model services.
2. Call `const { showToast } = useToast();` inside the component.
3. Pass `deleteCoordinator` and `showToast` into `useShoppingHistoryState`.
4. Pass `requestDeleteConfirmation` into each `TicketDetail`.
5. Render `DeleteShoppingSessionConfirmationDialog` once at page level.

This keeps page as composition root and avoids deep `new` calls in leaf components/hooks.

## 4) Data Flow

```txt
User clicks TicketDetail "Eliminar"
  -> useShoppingHistoryDelete.requestDeleteConfirmation(sessionId)
  -> DeleteShoppingSessionConfirmationDialog opens
  -> User confirms
  -> ShoppingHistoryDeleteCoordinator.deleteRecord(sessionId)
     -> getAuthToken()
     -> ShoppingSessionGateway.delete(sessionId, token)
       -> DELETE /api/shopping-sessions/:id
         -> JwtAuthMiddleware sets res.locals.userId
         -> ShoppingSessionController.delete
         -> DeleteShoppingSessionUseCase.execute
         -> ShoppingSessionRepository.deleteByIdForUser
         -> Prisma deleteMany({ id, userId })
  -> Frontend removeEntryBySessionId(deletedSessionId)
  -> Filters/groups/selection recompute from entries
  -> UI rerenders without hard refresh
```

## 5) Testing Design

### 5.1 Backend Unit Tests

#### `DeleteShoppingSessionUseCase.unit.test.ts`

Mock only repository port + logger.

Cases:

- `should delete an owned shopping session when repository deletes one record`
- `should report not deleted when repository finds no owned record`
- `should reject an empty session id`
- `should reject an empty user id`

#### `ShoppingSessionController.unit.test.ts`

Extend existing controller tests with delete use-case mock.

Cases:

- `should return 200 with deleted session id when delete succeeds`
- `should return 404 when session is missing or not owned`
- `should return 401 when user id is missing`
- `should return 400 when path id is missing`
- `should delegate unexpected delete errors to next()`

#### Repository

If adding a unit-only check for Prisma adapter is difficult without mocking Prisma, prefer either:

- lightweight integration test against real PostgreSQL when integration suite is available, or
- rely on use-case/controller unit tests plus Prisma implementation review for this slice.

Given project convention, DB-touching repository tests should be `*.integration.test.ts` with real DB, not mocked Prisma.

### 5.2 Frontend Tests

Prefer React Testing Library semantic queries.

#### `DeleteShoppingSessionConfirmationDialog.unit.test.tsx`

- `should render irreversible delete copy when open`
- `should not render when closed`
- `should call onCancel when cancel is clicked`
- `should call onConfirm when delete is clicked`
- `should disable confirm action while deleting`

#### `useShoppingHistoryDelete.unit.test.tsx`

Use `renderHook`; mock at coordinator boundary.

Cases:

- `should open confirmation for the targeted session`
- `should cancel confirmation without calling delete coordinator`
- `should remove deleted session after successful confirmation`
- `should preserve entries and show error toast when delete fails`

#### `TicketDetail.unit.test.tsx`

- `should render delete action for a selected shopping session`
- `should request delete confirmation with selected session id`

## 6) File Change Plan

### Backend

- Add: `backend/src/application/ports/incoming/DeleteShoppingSessionUseCasePort.ts`
- Modify: `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts`
- Modify: `backend/src/application/use-cases/shopping-session/contracts.ts`
- Add: `backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.ts`
- Add: `backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.unit.test.ts`
- Modify: `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts`
- Modify: `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts`
- Modify: `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`
- Modify: `backend/src/infrastructure/composition/bootstrap.ts`

### Frontend

- Modify: `frontend/src/lib/http/ShoppingSessionGateway.ts`
- Modify: `frontend/src/lib/http/ShoppingSessionHttpClient.ts`
- Add: `frontend/src/features/shopping-history/model/ShoppingHistoryDeleteCoordinator.ts`
- Modify: `frontend/src/features/shopping-history/hooks/useShoppingHistoryEntries.ts`
- Add: `frontend/src/features/shopping-history/hooks/useShoppingHistoryDelete.ts`
- Modify: `frontend/src/features/shopping-history/hooks/useShoppingHistoryState.ts`
- Add: `frontend/src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.tsx`
- Add tests adjacent to new hook/dialog/detail component.
- Modify: `frontend/src/features/shopping-history/components/TicketDetail.tsx`
- Modify: `frontend/src/app/shopping-history/page.tsx`

## 7) Rollout / Review Notes

- This is a medium-size full-stack change; keep commits grouped by concern:
  1. `feat(backend): add owned shopping session deletion endpoint`
  2. `feat(frontend): add shopping history delete confirmation flow`
  3. `test(...): cover shopping history deletion behavior` if tests are separated.
- No Prisma migration required for hard delete.
- Confirm route uses existing JWT middleware and does not bypass ownership check.
- Verify mobile and desktop detail flows both expose the same delete action and confirmation behavior.

## 8) Verification Commands

Backend targeted:

```bash
cd backend && npm run test:unit -- \
  src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.unit.test.ts \
  src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts
```

Backend build:

```bash
cd backend && npm run build
```

Frontend targeted:

```bash
cd frontend && npm run test -- \
  src/features/shopping-history/components/DeleteShoppingSessionConfirmationDialog.unit.test.tsx \
  src/features/shopping-history/hooks/useShoppingHistoryDelete.unit.test.tsx \
  src/features/shopping-history/components/TicketDetail.unit.test.tsx
```

Frontend build:

```bash
cd frontend && npm run build
```
