# Tasks — US31 Shopping History Insights and Spending Metrics

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 430–620 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend metrics API) → PR 2 (frontend metrics gateway + model/hook) → PR 3 (analytics UI + tests) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Dependency-Ordered Implementation Tasks

> Endpoint naming is locked for this change: `GET /api/shopping-sessions/metrics`.

### PR 1 — Backend metrics API (hexagonal)

#### 1) RED — define backend contracts and failing tests
- [x] Add incoming port: `backend/src/application/ports/incoming/GetShoppingSessionMetricsUseCasePort.ts`.
- [x] Extend contracts: `backend/src/application/use-cases/shopping-session/contracts.ts` with metrics DTOs (`GetShoppingSessionMetricsInput`, trend bucket, supermarket metric, result DTO).
- [x] Extend repository port: `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts` with `getMetricsForUser(userId: string)`.
- [x] Add failing use-case tests: `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts`.
- [x] Extend controller tests with failing metrics scenarios in `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`:
  - should return `200` for authenticated user
  - should return `401` when unauthorized
  - should delegate unexpected errors to `next`

**Verification (RED)**
- `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`

#### 2) GREEN — implement backend metrics flow
- [x] Add use case: `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.ts`.
- [x] Implement repository method in `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts`:
  - Prisma `aggregate` for summary KPIs
  - ownership-scoped aggregation for supermarket dominance (`totalSpent`, `totalItems`)
  - weekly/monthly/yearly trend buckets
  - most frequent grocery day
- [x] Extend controller with `metrics` handler in `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts`.
- [x] Wire route in `backend/src/infrastructure/composition/bootstrap.ts`:
  - `GET /api/shopping-sessions/metrics`

**Verification (GREEN)**
- `cd backend && npm run build`
- `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`

#### 3) REFACTOR — keep adapter readable and boundary-safe
- [ ] If repository grows too large, extract adapter-private class(es):
  - `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionMetricsMapper.ts` (optional)
- [x] Keep application layer free from Prisma/SQL concerns.
- [x] Re-run backend checks.

**Verification (REFACTOR)**
- `cd backend && npm run build`
- `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`

Rollback boundary (PR 1): revert metrics port/use-case/controller/repository additions only; existing save/list/delete routes remain intact.

---

### PR 2 — Frontend metrics gateway + state/model (class-first)

#### 4) RED — frontend contracts and hook tests
- [ ] Extend `frontend/src/lib/http/ShoppingSessionGateway.ts` with metrics response contract and `getMetrics(token)` method.
- [ ] Add failing hook tests: `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx` for:
  - no fetch before insights view active
  - fetch on insights activation + authenticated status
  - error state on gateway failure

**Verification (RED)**
- `cd frontend && npm run test -- src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx`

#### 5) GREEN — implement gateway + model classes + hook
- [ ] Implement `getMetrics` in `frontend/src/lib/http/ShoppingSessionHttpClient.ts` against `GET /api/shopping-sessions/metrics`.
- [ ] Add class-first model contracts and mappers:
  - `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsContracts.ts`
  - `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.ts`
  - `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.ts`
- [ ] Add hook: `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.ts`.

**Verification (GREEN)**
- `cd frontend && npm run build`
- `cd frontend && npm run test -- src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx`

#### 6) REFACTOR — mapper/formatter tests and naming cleanup
- [ ] Add model unit tests:
  - `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts`
  - `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts`
- [ ] Ensure no exported generic `utils` module is introduced.

**Verification (REFACTOR)**
- `cd frontend && npm run test -- src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts`

Rollback boundary (PR 2): revert metrics gateway + metrics hook/model classes only; history list/detail/delete stays functional.

---

### PR 3 — Insights UI (charts + KPI cards + tab integration)

#### 7) RED — UI component tests
- [ ] Install chart library in frontend (`recharts`).
- [ ] Add failing component tests:
  - `frontend/src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx`
  - `frontend/src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx`
  - `frontend/src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx`

**Verification (RED)**
- `cd frontend && npm run test -- src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx`

#### 8) GREEN — implement analytics UI and page wiring
- [ ] Add components:
  - `frontend/src/features/shopping-history/components/ShoppingHistoryViewTabs.tsx`
  - `frontend/src/features/shopping-history/components/ShoppingHistoryInsightsPanel.tsx`
  - `frontend/src/features/shopping-history/components/ShoppingHistoryKpiCards.tsx`
  - `frontend/src/features/shopping-history/components/SupermarketDominanceChart.tsx`
  - `frontend/src/features/shopping-history/components/SpendingTrendChart.tsx`
  - `frontend/src/features/shopping-history/components/TrendAggregationSelector.tsx`
  - `frontend/src/features/shopping-history/components/ShoppingHistoryMetricsEmptyState.tsx`
- [ ] Integrate tabs + metrics hook in `frontend/src/app/shopping-history/page.tsx` while preserving history mode behavior.
- [ ] Ensure mobile and desktop states continue to work when switching between History and Insights views.

**Verification (GREEN)**
- `cd frontend && npm run build`
- `cd frontend && npm run test -- src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx`

#### 9) REFACTOR — UI semantics and error/empty behavior polish
- [ ] Ensure semantic labels and accessible tab/button text for RTL queries.
- [ ] Confirm empty-state copy for no metrics and non-destructive error state for fetch failures.
- [ ] Keep page composition root responsible for dependency construction (`new`), not leaf components.

**Verification (REFACTOR)**
- `cd frontend && npm run build`
- `cd frontend && npm run test -- src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx`

Rollback boundary (PR 3): revert only insights-tab/chart components and page wiring; metrics API and gateway can remain unused without breaking history mode.

---

## Final Verification Gate

- [x] Backend compiles and targeted unit tests pass:
  - `cd backend && npm run build`
  - `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`
- [ ] Frontend compiles and targeted metrics tests pass:
  - `cd frontend && npm run build`
  - `cd frontend && npm run test -- src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx`
- [ ] Manual sanity checks:
  - Insights tab appears and toggles with History view.
  - Donut/pie dominance chart renders with real aggregated data.
  - Trend mode switches weekly/monthly/yearly.
  - KPI cards render average ticket, total spent, and most frequent grocery day.
  - Empty-state and error-state are handled without breaking existing history mode.
