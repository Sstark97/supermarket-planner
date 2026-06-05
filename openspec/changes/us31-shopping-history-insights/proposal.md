# Proposal: US31 Shopping History Insights and Spending Metrics

## Problem Statement
Users can save, browse, and delete historical shopping sessions, but the history view still requires manual inspection to understand spending patterns. Budget-conscious shoppers need a fast way to answer questions such as:

- Which supermarket receives most of my household grocery spend?
- Is my grocery spending increasing or decreasing over time?
- What is my average checkout cost?
- Which day of the week do I most often buy groceries?

Without an analytics view, the saved history is useful as a record but weak as a budgeting and decision-making tool.

## Intent
Add an **Analytics/Insights** sub-view inside the shopping history area that summarizes a registered user's own saved shopping sessions with high-level KPI cards and responsive charts.

The backend contract must keep current domain naming:

- `GET /api/shopping-sessions/metrics`

No `purchases` rename or alias is in scope for this change.

## Scope

### In scope
- Add authenticated backend endpoint: `GET /api/shopping-sessions/metrics`.
- Compute metrics only for the authenticated `userId` from JWT middleware.
- Return compact, aggregated metric payloads instead of raw item/session rows where possible.
- Add application use case and ports following backend hexagonal architecture.
- Add Prisma-backed repository methods for shopping-session metrics aggregation.
- Add an **Analytics/Insights** tab or sub-section inside `/shopping-history`.
- Render:
  - supermarket dominance chart (donut/pie recommended),
  - spending trend chart with weekly, monthly, and yearly aggregation modes,
  - KPI cards for average ticket cost, total spent to date, and most frequent grocery day.
- Add frontend gateway/client method for metrics retrieval.
- Keep frontend feature structure maintainable under `frontend/src/features/shopping-history/` using internal `components/`, `hooks/`, `model/`, and API/gateway boundaries as appropriate.
- Install one lightweight responsive chart library in `frontend`.

### Out of scope
- Renaming `ShoppingSession` / `ShoppingSessionItem` models to `PurchaseHistory` / `PurchaseItem`.
- Adding `GET /api/purchases/metrics`.
- Global/admin analytics across users.
- Predictive forecasting, anomaly detection, budgeting recommendations, or price-change attribution.
- Exporting analytics data to CSV/PDF.
- Reworking existing history delete/list behavior beyond integrating a tab/sub-view navigation affordance.

## Affected Areas

### Backend
- `backend/src/application/ports/incoming/` — new metrics use-case port.
- `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts` — metrics query contract(s).
- `backend/src/application/use-cases/shopping-session/` — metrics contracts and use case.
- `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts` — Prisma aggregation implementation.
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts` — metrics handler.
- `backend/src/infrastructure/composition/bootstrap.ts` — use-case construction and route wiring.

### Frontend
- `frontend/src/lib/http/ShoppingSessionGateway.ts` — metrics gateway contract.
- `frontend/src/lib/http/ShoppingSessionHttpClient.ts` — `GET /api/shopping-sessions/metrics` implementation.
- `frontend/src/app/shopping-history/page.tsx` — composition/root wiring for the analytics sub-view.
- `frontend/src/features/shopping-history/` — analytics components, state hooks, chart data mappers/classes, and tab/sub-view UI.
- `frontend/package.json` and lockfile — chart library dependency.

## Product Behavior
1. User opens `/shopping-history`.
2. The page offers a clear sub-view/tab switch between history list/detail and **Analytics/Insights**.
3. Selecting **Analytics/Insights** loads the authenticated user's metrics.
4. The analytics view shows:
   - **Total spent to date** KPI.
   - **Average ticket cost** KPI.
   - **Most frequent grocery day** KPI.
   - **Supermarket dominance** donut/pie chart showing spend distribution by supermarket.
   - **Spending trend** chart with aggregation controls for weekly, monthly, and yearly views.
5. Empty history state shows a friendly message instead of empty charts.
6. Metrics failures show non-destructive error feedback and do not break the existing history list/detail flow.

## Backend Contract

### Endpoint

```http
GET /api/shopping-sessions/metrics
Authorization: Bearer <jwt>
```

### Response shape (proposed)

```ts
interface ShoppingSessionMetricsResponse {
  totalSpent: number;
  averageTicketCost: number;
  mostFrequentGroceryDay: {
    dayOfWeek: string | null;
    purchaseCount: number;
  };
  supermarketSpending: Array<{
    supermarket: string;
    totalSpent: number;
    totalItems: number;
  }>;
  spendingTrends: {
    weekly: Array<{
      periodStart: string;
      totalSpent: number;
      averageTicketCost: number;
      purchaseCount: number;
    }>;
    monthly: Array<{
      periodStart: string;
      totalSpent: number;
      averageTicketCost: number;
      purchaseCount: number;
    }>;
    yearly: Array<{
      periodStart: string;
      totalSpent: number;
      averageTicketCost: number;
      purchaseCount: number;
    }>;
  };
}
```

### Response mapping
- `200`: metrics payload, including empty arrays/zero values when the user has no saved sessions.
- `401`: unauthenticated or invalid token.
- `500`: unexpected aggregation/repository failure.

## Chart Library Decision

### Option A — Recharts (recommended)
**Pros**
- React-first API and widely used for dashboards.
- Good fit for simple donut/pie, line, and bar charts.
- Responsive containers are straightforward.
- Works well with Tailwind layout wrappers.
- Lower implementation friction for current requirements.

**Cons**
- Bundle impact is non-zero.
- Some deep customization can become verbose.

### Option B — Chart.js + react-chartjs-2
**Pros**
- Mature charting engine with strong ecosystem.
- Good rendering performance.
- Familiar chart grammar for many developers.

**Cons**
- More imperative/config-heavy than Recharts.
- Requires registering chart primitives.
- Less aligned with the current component-oriented React style.

### Option C — CSS/SVG custom charts
**Pros**
- Minimal dependency footprint.
- Full control over markup and styling.

**Cons**
- Higher implementation risk and maintenance cost.
- Accessibility and responsiveness would need custom work.
- Not worth it for multiple chart types in this slice.

### Recommendation
Use **Recharts** for this US. It provides the smallest implementation surface for responsive donut/pie and line/bar charts while keeping code readable and component-oriented.

## Architecture Notes

### Backend
- Preserve strict hexagonal architecture.
- Controller reads auth context/path/query only and delegates to an incoming use-case port.
- Use case coordinates metric retrieval and response shaping.
- Repository port exposes intention-revealing methods or a single metrics method returning application-level DTOs.
- Prisma aggregation stays in the infrastructure persistence adapter.
- No Prisma, Express, or framework types in `domain/` or `application/`.

Potential repository contract:

```ts
getMetricsByUserId(userId: string): Promise<ShoppingSessionMetrics>;
```

Implementation can use Prisma `_sum`, `_count`, `groupBy`, and targeted `findMany` projections. If weekly/monthly/yearly grouping cannot be expressed cleanly with Prisma `groupBy` alone, use a small raw SQL query encapsulated inside the Prisma adapter only, or fetch a compact projection of session headers (`shoppedAt`, `totalPrice`) and aggregate in an application/model class. The design phase should choose the simplest maintainable approach.

### Frontend
- Keep chart data mapping in named classes (for example, `ShoppingHistoryMetricsChartMapper`) rather than exported utility functions.
- Keep object construction in page/container composition or feature composition boundaries.
- Do not add `useMemo`/`useCallback` by default; React Compiler is enabled.
- Components should stay focused:
  - tab/sub-view navigation,
  - KPI cards,
  - supermarket dominance chart,
  - spending trend chart,
  - aggregation mode controls,
  - empty/error states.

## Testing Approach

### Backend
- Use-case unit tests mock the repository port.
- Controller unit tests cover auth and response mapping.
- Persistence aggregation tests can be added as integration tests if the metrics SQL/Prisma logic becomes non-trivial.

Expected backend behaviors:
- should return zero/empty metrics when user has no shopping sessions.
- should aggregate total spent and average ticket cost for owned sessions only.
- should aggregate supermarket spending and item counts by owned session items only.
- should calculate most frequent grocery day from `shoppedAt`.
- should map authentication failures to `401`.

### Frontend
- Component tests use React Testing Library roles/text, not CSS selectors.
- Gateway tests or hook tests mock at the gateway boundary.
- Chart components can be tested via accessible headings/labels and mapped data contracts rather than SVG internals.

Expected frontend behaviors:
- should switch from history list/detail to Analytics/Insights view.
- should render KPI values from metrics payload.
- should render empty state when metrics contain no history.
- should switch trend aggregation mode between weekly, monthly, and yearly.
- should show an error state when metrics loading fails.

## Proposal Question Round
Interactive SDD would normally ask a product question round before finalizing. This delegated subagent cannot ask the end user directly, so this proposal records assumptions for parent/user review:

1. **Dominance basis:** use total money spent as the primary supermarket dominance metric, while also returning item counts for labels/tooltips.
2. **Trend semantics:** weekly/monthly/yearly should show total spend by period; weekly can include average ticket cost as secondary data in tooltips.
3. **Date source:** use `ShoppingSession.shoppedAt` as the business purchase date, not `createdAt`.
4. **Empty state:** users with no history should see friendly copy and zeroed KPI cards rather than chart skeletons.
5. **Chart dependency:** install Recharts unless the user explicitly prefers a different charting library.

## Risks
- Prisma aggregation by week/month/year may require careful implementation because Prisma `groupBy` does not always cover date bucketing ergonomically.
- Chart library dependency increases frontend bundle size.
- Metrics can become misleading if old sessions contain incomplete supermarket/category data.
- Timezone/date bucketing must be consistent; using `shoppedAt` in local Spanish/Canary context should be clarified in design.
- Adding analytics inside the existing history view can overgrow the feature if components are not carefully decomposed.

## Rollback Plan
- Backend: remove `GET /api/shopping-sessions/metrics` route, metrics use case, and repository method; existing list/save/delete behavior remains unaffected.
- Frontend: remove analytics tab/sub-view, chart components, metrics gateway method, and chart dependency.
- Database: no schema rollback expected.

## Success Criteria
- `/shopping-history` exposes an **Analytics/Insights** sub-view.
- Authenticated users can view metrics computed only from their own shopping sessions.
- `GET /api/shopping-sessions/metrics` returns compact metrics without exposing other users' data.
- Supermarket dominance chart renders spend distribution across available supermarkets.
- Spending trend chart supports weekly, monthly, and yearly aggregation views.
- KPI cards display average ticket cost, total spent to date, and most frequent grocery day.
- Empty and error states are user-friendly.
- Backend and frontend touched tests/builds pass.

## Skill Resolution
- `skill_resolution`: `paths-injected`
- Loaded and applied:
  - `.claude/skills/class-first-architecture/SKILL.md`
  - `.claude/skills/code-semantic/SKILL.md`
  - `.claude/skills/hexagonal-architecture/SKILL.md`
  - `.claude/skills/testing/SKILL.md`
