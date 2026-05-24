# Proposal: US03 MercadonaScraper Optimization via Direct HTTP API Requests

## Problem Statement
The current `MercadonaScraper` depends on Playwright context/page lifecycle and browser traffic interception to obtain product data. This adds runtime overhead, increases fragility against UI/session changes, and hardcodes `wh=3544` through browser-side localStorage injection. In addition, there are no Mercadona-focused unit tests to protect behavior during refactor.

## Intent
Refactor Mercadona scraping to use direct server-side HTTP requests against `https://api2.mercadona.es/api/search/`, removing Playwright usage from the standard flow while preserving product mapping quality (including `price_instructions`) and enforcing validated mandatory headers.

## Scope
### In scope
- Replace standard Mercadona search flow with direct HTTP API requests.
- Add request-header construction/validation for Mercadona API calls, including:
  - `Origin: https://tienda.mercadona.es`
  - realistic residential User-Agent
  - other mandatory headers required by Mercadona API contract.
- Implement dynamic `wh` resolution for Las Palmas logistics region (accepting current/active value, including 3544).
- Preserve current product mapping semantics from API payload (`display_name`, `thumbnail`, `price_instructions`, etc.).
- Add Mercadona-focused unit tests first (strict TDD) covering transport, headers, `wh`, and mapping behavior.

### Out of scope
- Broad scraper architecture rewrites across other supermarkets.
- UI/browser fallback redesign beyond compatibility handling needed during transition.
- Non-Las-Palmas regionalization logic.

## Affected Areas
- `backend/src/scrapers/implementations/MercadonaScraper.ts`
- Potential new helper module(s) for Mercadona HTTP client / header policy / warehouse resolution under `backend/src/scrapers/**`.
- Test suite additions under `backend/src/**/__tests__` or existing scraper test locations.
- Optional config touchpoints for `wh` mapping and header defaults if needed.

## Delivery Approach (strict TDD)
1. Add failing unit tests for:
   - no Playwright context/page usage in standard flow,
   - direct call to `https://api2.mercadona.es/api/search/`,
   - mandatory validated headers,
   - dynamic Las Palmas `wh` mapping,
   - API payload-to-domain product mapping.
2. Implement minimal production changes to satisfy tests.
3. Remove/guard obsolete browser-only code paths in Mercadona standard execution.
4. Run project test command: `cd backend && pnpm test`.

## Risks
- Mercadona API anti-bot behavior may reject insufficient/unnatural headers.
- `wh` semantics may evolve; stale assumptions can silently reduce result quality.
- Refactor may regress mapping fields (especially `price_instructions`) if payload shape varies.
- Transport-level failures (timeouts/retries) can alter scraper reliability profile.

## Rollback Plan
- Keep changes isolated to Mercadona scraper path and related helpers.
- If production behavior regresses, restore prior Playwright-interception implementation from VCS and disable direct-flow path via targeted revert.
- Retain newly added tests (adjusted as needed) to document expected contract.

## Success Criteria
- Standard Mercadona scraping path completes without creating/using Playwright context/page.
- Requests are sent directly to `https://api2.mercadona.es/api/search/`.
- Mandatory headers are present and validated, including correct `Origin` and realistic residential UA.
- `wh` is dynamically resolved for Las Palmas (3544 or current active equivalent).
- Mercadona-focused unit tests exist and pass with `cd backend && pnpm test`.
