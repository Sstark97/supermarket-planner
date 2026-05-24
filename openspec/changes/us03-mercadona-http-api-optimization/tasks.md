# Tasks — US03 MercadonaScraper Optimization via Direct HTTP API Requests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–950 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (pure helpers + unit tests) → PR 2 (MercadonaScraper integration switch) → PR 3 (cleanup/removal + regression hardening) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Implementation Tasks (strict TDD)

> Test command baseline for all cycles: `cd backend && pnpm test`

### 0) Baseline and test seam discovery (dependency: none)
- [x] Confirm current Mercadona implementation touchpoints in:
  - `backend/src/scrapers/implementations/MercadonaScraper.ts`
  - `backend/src/scrapers/base/ScraperBase.ts` (or equivalent base path if moved)
  - Any Mercadona-related existing tests under `backend/src/**/__tests__` or `backend/src/**/*.test.ts`
- [x] Identify constructor dependency-injection seam needed for: HTTP client, header builder/validator, warehouse resolver, mapper.
- [x] Capture a small test matrix to map acceptance criteria → test files before writing production code.

### 1) PR 1 — RED: create failing unit tests for new Mercadona modules (dependency: task 0)
- [x] Add `backend/src/scrapers/mercadona/MercadonaHeaders.unit.test.ts` with failing cases:
  - rejects missing mandatory headers (`Origin`, `User-Agent`, `Accept`, `Content-Type`, `Referer`, `Accept-Language`)
  - rejects invalid `Origin`
  - rejects unrealistic UA
  - accepts valid realistic header set
- [x] Add `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.unit.test.ts` with failing cases:
  - uses configured Las Palmas `wh` when valid numeric string
  - falls back to `3544` when missing/invalid config
  - emits warning on fallback
- [x] Add `backend/src/scrapers/mercadona/MercadonaMapper.unit.test.ts` with failing cases:
  - maps `display_name`, `thumbnail`, `id` URL, category, tax type
  - `price_instructions.unit_price` precedence
  - fallback to `bulk_price`
  - default quantity/unit to `1 ud` when missing size fields
- [x] Add `backend/src/scrapers/mercadona/MercadonaHttpClient.unit.test.ts` with failing cases:
  - posts to `https://api2.mercadona.es/api/search/` with `query/offset/limit/wh`
  - retries on timeout/429/5xx
  - does not retry on non-429 4xx
  - throws on invalid response shape (`results` missing/non-array)

### 2) PR 1 — GREEN: implement helper modules minimally to satisfy tests (dependency: task 1)
- [x] Create `backend/src/scrapers/mercadona/types.ts` for typed request/response DTOs.
- [x] Implement `backend/src/scrapers/mercadona/MercadonaHeaders.ts` (builder + validator + typed validation error).
- [x] Implement `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.ts` (env/config-based Las Palmas resolver + fallback warning).
- [x] Implement `backend/src/scrapers/mercadona/MercadonaMapper.ts` (typed API → `IProduct` mapping with `price_instructions` precedence and normalization).
- [x] Implement `backend/src/scrapers/mercadona/MercadonaHttpClient.ts` (POST transport, timeout, bounded retries, retry classifier, response-shape guard).
- [x] Run `cd backend && pnpm test` and ensure newly added tests pass.

### 3) PR 1 — TRIANGULATE + REFACTOR helpers (dependency: task 2)
- [x] Extend helper tests with at least one additional query/payload and one additional header-valid case to prevent hardcoded pass-through behavior.
- [x] Refactor helper internals for readability without changing observable behavior.
- [x] Re-run `cd backend && pnpm test` to lock helper module baseline.

### 4) PR 2 — RED: MercadonaScraper integration tests (dependency: task 3)
- [ ] Add `backend/src/scrapers/implementations/MercadonaScraper.unit.test.ts` failing tests for orchestration behavior:
  - scraper standard flow does **not** instantiate/use Playwright context/page (`BrowserManager` not invoked in standard path)
  - scraper invokes header builder/validator before HTTP dispatch
  - scraper resolves Las Palmas `wh` via resolver and passes it to HTTP client
  - scraper maps API results through mapper to returned `IProduct[]`
  - scraper propagates terminal client errors so `ScraperBase` behavior remains intact

### 5) PR 2 — GREEN: switch Mercadona scraper standard flow to direct HTTP (dependency: task 4)
- [ ] Update `backend/src/scrapers/implementations/MercadonaScraper.ts`:
  - remove standard-flow dependency on Playwright page/context lifecycle
  - wire dependency-injected defaults for helpers from `backend/src/scrapers/mercadona/*`
  - keep method contracts and `ScraperBase` integration stable
- [ ] Add/adjust config touchpoint only if required (e.g., `backend/src/config/index.ts`) for Las Palmas `wh` environment value.
- [ ] Run `cd backend && pnpm test` and confirm integration tests pass.

### 6) PR 2 — TRIANGULATE + REFACTOR scraper integration (dependency: task 5)
- [ ] Add one additional integration test scenario covering retry success after first failure to avoid overly linear orchestration logic.
- [ ] Refactor constructor/default wiring to keep scraper thin and test-friendly.
- [ ] Re-run full tests: `cd backend && pnpm test`.

### 7) PR 3 — cleanup and obsolete path removal hardening (dependency: task 6)
- [ ] Remove or guard obsolete Mercadona-specific browser interception code paths in:
  - `backend/src/scrapers/implementations/MercadonaScraper.ts`
  - any Mercadona-only helper branches now unused
- [ ] Ensure no regressions in other scrapers by keeping shared abstractions untouched unless strictly required.
- [ ] Add/adjust concise inline docs/comments for header constraints and `wh` fallback rationale.
- [ ] Final regression run: `cd backend && pnpm test`.

## Dependency Graph (summary)
- Task 0 → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
- PR boundaries:
  - PR 1: Tasks 1–3
  - PR 2: Tasks 4–6
  - PR 3: Task 7

## Verification Gates per PR
- [x] PR 1 gate: helper unit tests pass + no scraper behavior changes yet.
- [ ] PR 2 gate: Mercadona standard flow fully HTTP-based and Playwright-independent in tests.
- [ ] PR 3 gate: obsolete Mercadona browser-path cleanup complete and full backend test suite green.

## Rollback Boundaries
- PR 1 rollback: revert `backend/src/scrapers/mercadona/*` and associated tests only.
- PR 2 rollback: revert `backend/src/scrapers/implementations/MercadonaScraper.ts` integration switch while retaining helper modules/tests.
- PR 3 rollback: revert cleanup-only commit(s) if any downstream compatibility issue appears.
