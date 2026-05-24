# Apply Progress — us03-mercadona-http-api-optimization

## Scope / PR Boundary
- Active slice: **PR1 only** (helpers + helper unit tests).
- Out of scope in this apply: `MercadonaScraper` integration switch (PR2) and cleanup (PR3).

## Completed Tasks
- Added RED-first unit test suites for:
  - `MercadonaHeaders`
  - `MercadonaWarehouseResolver`
  - `MercadonaMapper`
  - `MercadonaHttpClient`
- Implemented helper production modules:
  - `backend/src/scrapers/mercadona/types.ts`
  - `backend/src/scrapers/mercadona/MercadonaHeaders.ts`
  - `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.ts`
  - `backend/src/scrapers/mercadona/MercadonaMapper.ts`
  - `backend/src/scrapers/mercadona/MercadonaHttpClient.ts`
- Added TRIANGULATE coverage:
  - extra valid header shape case (lower-case header keys)
  - extra HTTP payload case (`query/offset/limit/wh` alternate values)
- Re-ran focused and full backend tests.

## Files Changed
- `backend/src/scrapers/mercadona/MercadonaHeaders.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaMapper.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaHttpClient.unit.test.ts`
- `backend/src/scrapers/mercadona/types.ts`
- `backend/src/scrapers/mercadona/MercadonaHeaders.ts`
- `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.ts`
- `backend/src/scrapers/mercadona/MercadonaMapper.ts`
- `backend/src/scrapers/mercadona/MercadonaHttpClient.ts`
- `openspec/changes/us03-mercadona-http-api-optimization/tasks.md`
- `openspec/changes/us03-mercadona-http-api-optimization/apply-progress.md`

## Test Commands Run
- `cd backend && pnpm test src/scrapers/mercadona/*.unit.test.ts` (RED)
- `cd backend && pnpm test src/scrapers/mercadona/*.unit.test.ts` (GREEN)
- `cd backend && pnpm test src/scrapers/mercadona/*.unit.test.ts` (TRIANGULATE/REFACTOR)
- `cd backend && pnpm test` (final regression for current repository state)

## TDD Cycle Evidence

| Cycle | Evidence |
|---|---|
| RED | Focused mercadona helper tests failed with module-not-found for `MercadonaHeaders`, `MercadonaWarehouseResolver`, `MercadonaMapper`, `MercadonaHttpClient` before implementation. |
| GREEN | Implemented helper modules + DTO types; focused suite passed (`4 files, 17 tests`). |
| TRIANGULATE | Added alternate payload assertion in `MercadonaHttpClient.unit.test.ts` and lower-case valid header case in `MercadonaHeaders.unit.test.ts`; focused suite passed (`4 files, 18 tests`). |
| REFACTOR | Kept helper internals small and typed (shared validators/guards); re-ran focused tests and full backend tests (`8 files, 24 tests`) all passing. |

## Deviations from Design
- No scraper integration changes in this PR by design (deferred to PR2).
- `MercadonaWarehouseResolver` currently falls back to Las Palmas default for non-`35` prefixes as a safe baseline; regional expansion remains pending.

## Remaining Tasks
- PR2 tasks 4–6: integrate helpers into `MercadonaScraper` and remove standard Playwright dependency path.
- PR3 task 7: cleanup/hardening of obsolete Mercadona browser-only branches.

## Risks / Notes
- Header realism checks may need adjustment if Mercadona anti-bot policy evolves.
- Warehouse env value quality (`MERCADONA_WH_LAS_PALMAS`) is critical; invalid values silently fallback with warning.
