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

---

## PR2 Progress — MercadonaScraper integration switch

### Scope / PR Boundary
- Active slice: **PR2 only** (MercadonaScraper integration to helper modules).
- Out of scope in this slice: PR3 cleanup/hardening.

### Completed Tasks
- Added integration unit tests for `MercadonaScraper` covering:
  - no `BrowserManager` usage in standard flow,
  - header build/validation before HTTP dispatch,
  - warehouse resolution and `wh` pass-through,
  - mapper output pass-through,
  - terminal client error propagation for `ScraperBase` circuit handling.
- Rewrote `backend/src/scrapers/implementations/MercadonaScraper.ts` as helper orchestrator:
  - uses `buildMercadonaHeaders` + `validateMercadonaHeaders`,
  - resolves warehouse with `resolveMercadonaWarehouse`,
  - performs HTTP search through `MercadonaHttpClient`,
  - maps API `results` via `mapMercadonaProducts`.
- Removed Playwright context/page usage from Mercadona standard execution path.

### Files Changed (PR2)
- `backend/src/scrapers/implementations/MercadonaScraper.ts`
- `backend/src/scrapers/implementations/MercadonaScraper.unit.test.ts`
- `openspec/changes/us03-mercadona-http-api-optimization/apply-progress.md`

### Test Commands Run (PR2)
- `cd backend && pnpm test src/scrapers/implementations/MercadonaScraper.unit.test.ts`
- `cd backend && pnpm test`

### TDD Cycle Evidence (PR2)

| Cycle | Evidence |
|---|---|
| RED | Added PR2 integration tests first; initial compile-time failures occurred because `MercadonaScraper` constructor did not yet accept integration deps (`Expected 0-1 arguments, but got 2`). |
| GREEN | Implemented helper-orchestrator `MercadonaScraper` with injectable seams; targeted scraper integration suite passed (`1 file, 5 tests`). |
| TRIANGULATE | Added explicit event-order assertion (`build -> validate -> search`) and warehouse payload assertions (`query/offset/limit/wh`) in integration tests to avoid linear false positives. |
| REFACTOR | Kept scraper thin with default helper wiring; re-ran full backend tests (`9 files, 30 tests`) all passing. |

### Remaining Tasks
- PR3 task 7: cleanup/hardening of obsolete Mercadona browser-only branches.

### PR2 Risks / Notes
- Header validation is now performed twice by default path (`MercadonaScraper` and `MercadonaHttpClient`); functionally safe but redundant.
- Added a default-wiring integration test (no custom deps) using spies over helper module boundaries to prove constructor defaults call real helper contracts.
- HTTP reliability behavior (retry/timeout) remains encapsulated in `MercadonaHttpClient`, not scraper orchestration.
