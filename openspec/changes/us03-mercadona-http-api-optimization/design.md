# Design: US03 MercadonaScraper Optimization via Direct HTTP API Requests

## 1) Context and Goals

This design replaces Mercadona's current Playwright interception flow with direct HTTP calls to Mercadona's internal search API while preserving existing domain semantics (`IProduct` mapping, Canary tax assumptions, categorization behavior) and base scraper reliability behavior (`ScraperBase` circuit breaker + error propagation).

Primary goals:
- Eliminate Playwright context/page creation in standard Mercadona flow.
- Use native HTTP transport to `https://api2.mercadona.es/api/search/`.
- Enforce mandatory request headers with explicit validation before dispatch.
- Resolve Las Palmas `wh` dynamically with safe fallback.
- Preserve mapping fidelity for `price_instructions` to `IProduct` pricing fields.
- Add strict TDD seams and tests for transport/header/warehouse/mapping/error policies.

## 2) Current State Summary

Current `MercadonaScraper` (`backend/src/scrapers/implementations/MercadonaScraper.ts`):
- Creates Playwright context/page via `BrowserManager`.
- Injects `postal_code` and hardcoded `wh=3544` into browser localStorage.
- Intercepts API response through `page.route` and maps from intercepted JSON.
- Falls back to DOM scraping path when API intercept fails.

Pain points:
- Browser dependency adds overhead and fragility.
- `wh` hardcoded in client-side storage.
- No Mercadona-focused unit tests for HTTP contracts.

## 3) Target Architecture

### 3.1 High-level flow (standard path)

`MercadonaScraper.search(query)` (via `ScraperBase`) -> `MercadonaScraper.scrape(query)` ->
1. Build validated Mercadona headers.
2. Resolve active `wh` for Las Palmas.
3. Perform direct HTTP request with timeout + bounded retries.
4. Parse typed response payload.
5. Map typed items to `IProduct`.
6. Return products (or throw on terminal failure, preserving base class behavior).

### 3.2 Proposed module responsibilities

- `MercadonaScraper.ts` (orchestrator only)
  - Calls helper services/functions.
  - No Playwright/browser usage.

- `mercadona/MercadonaHttpClient.ts` (new)
  - Encapsulates POST call to `https://api2.mercadona.es/api/search/`.
  - Applies timeout and retry policy.
  - Returns typed response DTO.

- `mercadona/MercadonaHeaders.ts` (new)
  - Builds realistic browser-like headers.
  - Validates mandatory headers before request dispatch.

- `mercadona/MercadonaWarehouseResolver.ts` (new)
  - Resolves active `wh` for Las Palmas.
  - Provides deterministic fallback policy.

- `mercadona/MercadonaMapper.ts` (new)
  - Converts typed API records to `IProduct`.
  - Handles `price_instructions` precedence and normalization.

This keeps scraper logic thin and maximizes unit-test seam quality.

## 4) HTTP Transport Contract

## 4.1 Endpoint and method
- URL: `https://api2.mercadona.es/api/search/`
- Method: `POST`
- Content-Type: `application/json`

### 4.2 Request shape

```ts
interface MercadonaSearchRequest {
  query: string;
  offset: number;   // default 0
  limit: number;    // default 24 (or current effective page size)
  wh: string;       // resolved warehouse id
}
```

Design note: keep request payload minimal and explicit; avoid browser-only fields not required for API acceptance.

### 4.3 Response shape (typed)

```ts
interface MercadonaSearchResponse {
  results: MercadonaApiProduct[];
  total?: number;
  // allow unknown metadata fields without breaking
  [k: string]: unknown;
}

interface MercadonaApiProduct {
  id: string | number;
  display_name?: string;
  thumbnail?: string;
  price_instructions?: {
    unit_price?: number | string;
    bulk_price?: number | string;
    unit_size?: number | string;
    size_format?: string; // e.g. "kg", "L", "ud"
    approx_size?: boolean;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
```

## 5) Header Builder and Validation Strategy

### 5.1 Mandatory headers
Mandatory minimum before dispatch:
- `Origin: https://tienda.mercadona.es`
- `User-Agent`: realistic residential browser UA (desktop Chrome/Safari/Edge profile)
- `Accept: application/json, text/plain, */*`
- `Content-Type: application/json`
- `Referer: https://tienda.mercadona.es/`
- `Accept-Language: es-ES,es;q=0.9`

Optional-but-recommended:
- `Sec-Fetch-Site: same-site`
- `Sec-Fetch-Mode: cors`
- `Sec-Fetch-Dest: empty`

### 5.2 Validation policy
`validateMercadonaHeaders(headers)` returns structured result or throws typed error (`MercadonaHeaderValidationError`).

Validation rules:
- Missing required key => reject request before network call.
- `Origin` mismatch => reject.
- UA realism check (non-empty + must match common browser signature regex for Mozilla/AppleWebKit/Chrome/Safari/Edg).
- Empty string values treated as missing.

Rationale: fail-fast guarantees anti-bot-sensitive requirements are always present.

## 6) Dynamic `wh` Resolver (Las Palmas)

### 6.1 Resolver strategy
`resolveMercadonaWarehouse(postalCode)`:
1. Attempt to load active mapping from controlled source (env/config map), e.g. `MERCADONA_WH_LAS_PALMAS`.
2. Validate value shape (numeric string).
3. If valid, use active configured value.
4. Else fallback to safe default `3544`.
5. Emit warning log on fallback activation.

### 6.2 Safe fallback policy
- Fallback is stable and explicit (no silent empty `wh`).
- Only Las Palmas scope is implemented in this change.
- If future non-Las-Palmas expansion appears, resolver interface supports extension without touching scraper flow.

## 7) Mapping Pipeline to `IProduct`

### 7.1 Price semantics (`price_instructions`)
Price precedence:
1. `unit_price`
2. `bulk_price`
3. `0` (last-resort default)

Unit text derivation for normalizer:
- If both `unit_size` and `size_format` exist: `${unit_size} ${size_format}`
- Else default `1 ud`

Then reuse existing `normalizePricePerUnit(priceRaw, quantityRaw)` to preserve cross-scraper consistency.

### 7.2 Product mapping
For each `MercadonaApiProduct`:
- `name` <- `display_name ?? ''`
- `image` <- `thumbnail ?? undefined`
- `url` <- `https://tienda.mercadona.es/product/${id}` when `id` present
- `taxType` <- `detectTaxType('IGIC')` (current Canary behavior)
- `category` <- existing `categorize(name)`
- `id` <- `uuidv4()`
- `scrapedAt` <- current ISO timestamp

### 7.3 Type safety strategy
- No `any` in mapper/client contracts.
- DTO interfaces in dedicated module.
- Narrowing guards for optional nested fields (`price_instructions`).
- Unknown top-level response fields allowed via index signature to avoid brittle breakage.

## 8) Error Handling / Retry / Timeout Policy

Compatibility target: preserve `ScraperBase` semantics (throw on scrape failure, circuit breaker increments there).

Transport policy in `MercadonaHttpClient`:
- Timeout per attempt: `10_000ms` (AbortController).
- Retries: up to 2 retries after initial attempt (max 3 total attempts).
- Retryable conditions:
  - Network exceptions
  - Timeout aborts
  - HTTP 429 / 5xx
- Non-retryable conditions:
  - Header validation errors
  - HTTP 4xx (except 429)
  - Response schema invalid (`results` missing/non-array)

Backoff:
- Fixed small delay or linear backoff (e.g. 300ms, 600ms).
- Keep deterministic and unit-testable by injecting `sleep` dependency.

## 9) Strict TDD Plan and Test Seams

## 9.1 Test seams
Inject dependencies into scraper constructor (with defaults) to isolate behavior in tests:
- `httpClient.search`
- `headerBuilder.build + validate`
- `warehouseResolver.resolve`
- `mapper.mapSearchResults`

This allows RED tests without network calls.

### 9.2 Planned tests (RED -> GREEN -> TRIANGULATE -> REFACTOR)

1. **Transport path, no Playwright**
   - RED: assert scraper does not call `BrowserManager.getInstance()` / no page APIs.
   - GREEN: new flow uses only injected HTTP client.

2. **Endpoint + request payload**
   - RED: expect POST to exact URL with `query`, `offset`, `limit`, resolved `wh`.
   - TRIANGULATE: add second query case to avoid hardcoded payload assumptions.

3. **Header validation gate**
   - RED: missing Origin rejects before fetch.
   - RED: unrealistic UA rejects before fetch.
   - GREEN: valid headers allow request.

4. **Warehouse resolution**
   - RED: configured valid Las Palmas `wh` is used.
   - RED: invalid/missing config falls back to `3544` and logs warning.

5. **Mapping fidelity (`price_instructions`)**
   - RED: `unit_price` path maps expected price + unit normalization.
   - TRIANGULATE: `bulk_price` fallback when `unit_price` absent.
   - TRIANGULATE: missing sizes defaults to `1 ud`.

6. **Retry/timeout behavior**
   - RED: timeout triggers retry then success on second/third attempt.
   - RED: 429/500 retried; 400 not retried.
   - GREEN: terminal failure rethrows to `ScraperBase.search`.

### 9.3 Test files (planned)
- `backend/src/scrapers/implementations/MercadonaScraper.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaHttpClient.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaHeaders.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.unit.test.ts`
- `backend/src/scrapers/mercadona/MercadonaMapper.unit.test.ts`

### 9.4 Evidence recording format
For apply/verify phase, capture command and result per cycle:
- Command: `cd backend && pnpm test`
- RED evidence: failing test names + expected reason
- GREEN evidence: passing targeted/new tests
- REFACTOR evidence: all tests still passing after cleanup

## 10) File Change Plan

Planned production files:
- `backend/src/scrapers/implementations/MercadonaScraper.ts` (rewrite standard flow)
- `backend/src/scrapers/mercadona/MercadonaHttpClient.ts` (new)
- `backend/src/scrapers/mercadona/MercadonaHeaders.ts` (new)
- `backend/src/scrapers/mercadona/MercadonaWarehouseResolver.ts` (new)
- `backend/src/scrapers/mercadona/MercadonaMapper.ts` (new)
- `backend/src/scrapers/mercadona/types.ts` (new DTO interfaces)
- optional config touchpoint in `backend/src/config/index.ts` for `MERCADONA_WH_LAS_PALMAS`

Planned tests: see section 9.3.

## 11) Rollout and Safety

- Stage 1: land helper modules + tests.
- Stage 2: switch Mercadona scraper implementation to direct HTTP path.
- Stage 3: remove obsolete Playwright interception branch from Mercadona only.
- Observe logs for fallback `wh` usage and HTTP rejection patterns.
- If regression: revert Mercadona-specific files; preserve tests and refine contracts.

## 12) Tradeoffs and Alternatives

### Chosen approach
Direct HTTP + strict header validation + typed mapper.

Pros:
- Faster and less resource-intensive than browser flow.
- Lower fragility vs UI changes.
- Better testability via pure modules.

Cons:
- More exposed to API anti-bot/header drift.
- Requires active maintenance of realistic request headers.

### Alternative A: Keep Playwright interception (status quo)
Pros: naturally browser-like traffic.
Cons: slow, brittle, harder unit testing; does not meet acceptance criteria.

### Alternative B: Hybrid HTTP-first then browser fallback
Pros: resilience if API blocks.
Cons: reintroduces browser dependency in standard path; violates explicit browser-independence requirement unless fallback is strictly non-standard/disabled by default.

### Alternative C: Central shared HTTP framework for all scrapers now
Pros: consistency.
Cons: broad scope expansion beyond this change; higher delivery risk.

Decision: implement Mercadona-focused modules now, with interfaces reusable for future standardization.

## 13) Open Questions / Assumptions

Assumptions:
- Mercadona API continues accepting current minimal payload shape with `wh`.
- Las Palmas active `wh` can be maintained via config/env without introducing a discovery API in this change.
- Existing categorization behavior (`categorize`) remains unchanged.

No blocking open question identified for this design phase.
