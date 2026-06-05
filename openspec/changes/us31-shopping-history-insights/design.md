# Design: US31 Shopping History Insights and Spending Metrics

## 1) Context and Goals

US31 adds an **Analytics/Insights** sub-view inside `/shopping-history` so authenticated users can understand spending patterns without manually inspecting individual saved shopping sessions.

The design keeps the current domain language and route naming:

- `GET /api/shopping-sessions/metrics`

Primary goals:
- Keep backend ownership-safe and aggregation-oriented.
- Avoid sending raw heavy history rows to the client for analytics.
- Preserve backend hexagonal architecture.
- Add a maintainable frontend analytics tab using class-first model boundaries.
- Use **Recharts** for responsive charts.
- Keep the existing history list/detail/delete behavior stable.

## 2) Current State Summary

### Backend
Existing shopping-session backend supports:
- `POST /api/shopping-sessions`
- `GET /api/shopping-sessions`
- `DELETE /api/shopping-sessions/:id`

Current persistence model:
- `ShoppingSession` contains `userId`, `shoppedAt`, `totalPrice`, `createdAt`.
- `ShoppingSessionItem` contains `supermarket`, `price`, `quantity`, and belongs to a session with cascade delete.

### Frontend
Existing `/shopping-history` page is a client composition root that wires feature model classes and hooks. It renders:
- timeline/list/detail views,
- delete confirmation flow,
- local state reconciliation.

Relevant feature structure:
- `frontend/src/features/shopping-history/components/`
- `frontend/src/features/shopping-history/hooks/`
- `frontend/src/features/shopping-history/model/`

This US should extend the feature without returning to monolithic component/hook code.

## 3) Backend API Contract

### Endpoint

```http
GET /api/shopping-sessions/metrics
Authorization: Bearer <jwt>
```

### Response: `ShoppingSessionMetricsResponse`

```ts
export interface ShoppingSessionMetricsResponse {
  totalSpent: number;
  averageTicketCost: number;
  totalPurchases: number;
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
    weekly: ShoppingSessionTrendBucket[];
    monthly: ShoppingSessionTrendBucket[];
    yearly: ShoppingSessionTrendBucket[];
  };
}

export interface ShoppingSessionTrendBucket {
  periodStart: string; // ISO date string for start of period
  totalSpent: number;
  averageTicketCost: number;
  purchaseCount: number;
}
```

### Status mapping
- `200`: metrics payload. Users with no history receive zero values and empty chart arrays.
- `401`: missing/invalid auth via existing JWT middleware.
- `500`: unexpected repository/aggregation failure, handled by existing `errorHandler`.

### Empty payload example

```json
{
  "totalSpent": 0,
  "averageTicketCost": 0,
  "totalPurchases": 0,
  "mostFrequentGroceryDay": {
    "dayOfWeek": null,
    "purchaseCount": 0
  },
  "supermarketSpending": [],
  "spendingTrends": {
    "weekly": [],
    "monthly": [],
    "yearly": []
  }
}
```

## 4) Backend Architecture

### 4.1 Application layer contracts

Add incoming port:

```ts
// backend/src/application/ports/incoming/GetShoppingSessionMetricsUseCasePort.ts
export interface GetShoppingSessionMetricsUseCasePort {
  execute(input: GetShoppingSessionMetricsInput): Promise<ShoppingSessionMetricsResult>;
}
```

Extend `backend/src/application/use-cases/shopping-session/contracts.ts` with:

```ts
export interface GetShoppingSessionMetricsInput {
  userId: string;
}

export interface ShoppingSessionTrendBucket {
  periodStart: string;
  totalSpent: number;
  averageTicketCost: number;
  purchaseCount: number;
}

export interface ShoppingSessionSupermarketMetric {
  supermarket: string;
  totalSpent: number;
  totalItems: number;
}

export interface ShoppingSessionMetricsResult {
  totalSpent: number;
  averageTicketCost: number;
  totalPurchases: number;
  mostFrequentGroceryDay: {
    dayOfWeek: string | null;
    purchaseCount: number;
  };
  supermarketSpending: ShoppingSessionSupermarketMetric[];
  spendingTrends: {
    weekly: ShoppingSessionTrendBucket[];
    monthly: ShoppingSessionTrendBucket[];
    yearly: ShoppingSessionTrendBucket[];
  };
}
```

### 4.2 Repository port

Extend `ShoppingSessionRepository` with one intention-revealing method:

```ts
getMetricsByUserId(userId: string): Promise<ShoppingSessionMetricsResult>;
```

Rationale:
- The use case needs a complete metrics result, not persistence-specific partial rows.
- Prisma/date bucketing details stay inside the infrastructure adapter.
- This keeps application code small and avoids leaking database query concerns across layers.

### 4.3 Use case

Add:

- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.ts`

Responsibilities:
1. Log execution with `userId` and no sensitive data.
2. Validate `userId` is non-empty.
3. Delegate to `shoppingSessionRepository.getMetricsByUserId(userId)`.
4. Return metrics result as-is.

No Prisma, Express, SQL, or date-bucketing implementation details in this class.

## 5) Backend Aggregation Design

### 5.1 Query strategy

Use aggregation-oriented Prisma calls where ergonomic, and raw SQL inside the Prisma adapter for expression/date-bucket aggregations that Prisma `groupBy` cannot express cleanly.

This still satisfies the US goal: compact aggregation queries, not raw heavy history rows to the client.

### 5.2 Summary KPI query

Use Prisma aggregate on `ShoppingSession`:

```ts
const summary = await prisma.shoppingSession.aggregate({
  where: { userId },
  _sum: { totalPrice: true },
  _avg: { totalPrice: true },
  _count: { _all: true },
});
```

Mapping:
- `totalSpent = summary._sum.totalPrice ?? 0`
- `averageTicketCost = summary._avg.totalPrice ?? 0`
- `totalPurchases = summary._count._all`

### 5.3 Supermarket dominance query

Dominance requires `SUM(item.price * item.quantity)`, which Prisma `groupBy` cannot express as `_sum` over a computed expression. Keep this in `PrismaShoppingSessionRepository` via `$queryRaw`:

```sql
SELECT
  item."supermarket" AS supermarket,
  COALESCE(SUM(item."price" * item."quantity"), 0) AS "totalSpent",
  COALESCE(SUM(item."quantity"), 0) AS "totalItems"
FROM "ShoppingSessionItem" item
INNER JOIN "ShoppingSession" session ON session."id" = item."sessionId"
WHERE session."userId" = $1
GROUP BY item."supermarket"
ORDER BY "totalSpent" DESC;
```

Notes:
- Ownership is enforced in the SQL join filter.
- Query returns one row per supermarket present in user history.
- The frontend can display only available supermarkets. No need to fabricate zero buckets for all five in v1.

### 5.4 Spending trend queries

Use `ShoppingSession.totalPrice` grouped by `ShoppingSession.shoppedAt`, not `createdAt`.

Use date bucketing in PostgreSQL through `$queryRaw` for weekly/monthly/yearly:

```sql
SELECT
  DATE_TRUNC('week', "shoppedAt") AS "periodStart",
  COALESCE(SUM("totalPrice"), 0) AS "totalSpent",
  COALESCE(AVG("totalPrice"), 0) AS "averageTicketCost",
  COUNT(*)::int AS "purchaseCount"
FROM "ShoppingSession"
WHERE "userId" = $1
GROUP BY DATE_TRUNC('week', "shoppedAt")
ORDER BY "periodStart" ASC;
```

Repeat with:
- `DATE_TRUNC('month', "shoppedAt")`
- `DATE_TRUNC('year', "shoppedAt")`

Wrap period selection inside adapter-private methods, not string-interpolated user input.

### 5.5 Most frequent grocery day query

Use PostgreSQL day extraction from `shoppedAt`:

```sql
SELECT
  EXTRACT(ISODOW FROM "shoppedAt")::int AS "isoDayOfWeek",
  COUNT(*)::int AS "purchaseCount"
FROM "ShoppingSession"
WHERE "userId" = $1
GROUP BY EXTRACT(ISODOW FROM "shoppedAt")
ORDER BY "purchaseCount" DESC, "isoDayOfWeek" ASC
LIMIT 1;
```

Map ISO day numbers to Spanish labels in the Prisma adapter or an adapter-private mapper class:

```ts
1 -> "Lunes"
2 -> "Martes"
3 -> "Miércoles"
4 -> "Jueves"
5 -> "Viernes"
6 -> "Sábado"
7 -> "Domingo"
```

Decision: keep labels in backend response to avoid duplicating day mapping across clients.

### 5.6 Prisma adapter class decomposition

Keep `PrismaShoppingSessionRepository` readable. If direct implementation becomes large, add adapter-private classes under the Prisma adapter folder:

- `PrismaShoppingSessionMetricsQuery.ts`
- `PrismaShoppingSessionMetricsMapper.ts`

These remain infrastructure-only and may import Prisma/raw SQL types if needed.

Recommended minimal approach:
- Add private methods in `PrismaShoppingSessionRepository` first if concise.
- Extract to classes only if the repository grows beyond readable size.

## 6) Backend HTTP Wiring

### Controller

Add constructor dependency:

```ts
private readonly getShoppingSessionMetricsUseCase: GetShoppingSessionMetricsUseCasePort
```

Add handler:

```ts
metrics = async (_req, res, next): Promise<void> => {
  try {
    const userId: unknown = res.locals.userId;
    if (typeof userId !== "string" || userId.length === 0) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await this.getShoppingSessionMetricsUseCase.execute({ userId });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
```

### Route registration

Register metrics route before `/:id` delete route to avoid route ambiguity:

```ts
app.get(
  "/api/shopping-sessions/metrics",
  jwtAuthMiddleware.authenticate,
  shoppingSessionController.metrics,
);

app.delete(
  "/api/shopping-sessions/:id",
  jwtAuthMiddleware.authenticate,
  shoppingSessionController.delete,
);
```

## 7) Frontend Dependency Decision

Install Recharts in `frontend`:

```bash
cd frontend && npm install recharts
```

Expected dependency:

```json
"recharts": "^3.x"
```

Keep chart components client-only (the page is already client-rendered).

## 8) Frontend Gateway Contract

Extend `ShoppingSessionGateway.ts`:

```ts
export interface ShoppingSessionTrendBucket {
  periodStart: string;
  totalSpent: number;
  averageTicketCost: number;
  purchaseCount: number;
}

export interface ShoppingSessionMetricsResponse {
  totalSpent: number;
  averageTicketCost: number;
  totalPurchases: number;
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
    weekly: ShoppingSessionTrendBucket[];
    monthly: ShoppingSessionTrendBucket[];
    yearly: ShoppingSessionTrendBucket[];
  };
}

export interface ShoppingSessionGateway {
  // existing save/list/delete...
  getMetrics(token: string): Promise<ShoppingSessionMetricsResponse>;
}
```

Implement in `ShoppingSessionHttpClient`:

```ts
async getMetrics(token: string): Promise<ShoppingSessionMetricsResponse> {
  const url = `${this.baseUrl}/api/shopping-sessions/metrics`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  // same error style as list/delete
}
```

## 9) Frontend Feature Architecture

### 9.1 View navigation

Add a small view mode inside `/shopping-history`:

```ts
type ShoppingHistoryViewMode = "history" | "insights";
```

This type is single-site; keep it local in the page or a dedicated hook if the hook owns the state.

Add component:

- `frontend/src/features/shopping-history/components/ShoppingHistoryViewTabs.tsx`

Props:

```ts
interface ShoppingHistoryViewTabsProps {
  activeView: "history" | "insights";
  onViewChange: (view: "history" | "insights") => void;
}
```

Behavior:
- Render `Historial` and `Analytics`/`Insights` buttons.
- Use semantic `button` elements and visible active state.

### 9.2 Metrics state hook

Add:

- `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.ts`

Responsibilities:
- Load metrics only when:
  - auth status is `authenticated`, and
  - active view is `insights` (or load eagerly if simpler; lazy preferred).
- Track `isLoadingMetrics`, `metricsErrorMessage`, and `metrics`.
- Depend on `ShoppingSessionGateway` boundary.
- Use `getAuthToken()` like existing history hooks.

Return contract local to hook file unless reused broadly.

### 9.3 Model classes

Add class-first mappers/formatters:

#### `ShoppingHistoryMetricsChartMapper`

Path:
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.ts`

Responsibilities:
- Convert API metrics into Recharts-friendly data.
- Keep chart labels/colors consistent.

Methods:

```ts
mapSupermarketSpending(metrics: ShoppingSessionMetricsResponse): SupermarketDominanceChartDatum[];
mapTrend(metrics: ShoppingSessionMetricsResponse, aggregation: TrendAggregation): SpendingTrendChartDatum[];
hasAnyMetrics(metrics: ShoppingSessionMetricsResponse | null): boolean;
```

#### `ShoppingHistoryMetricsFormatter`

Path:
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.ts`

Responsibilities:
- Format euros and fallback labels for KPI cards.
- Avoid mixing formatting rules into components.

Methods:

```ts
formatEuro(value: number): string;
formatMostFrequentGroceryDay(dayOfWeek: string | null, count: number): string;
```

### 9.4 Chart data contracts

Create:

- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsContracts.ts`

Only include types shared across multiple files:

```ts
export type TrendAggregation = "weekly" | "monthly" | "yearly";

export interface SupermarketDominanceChartDatum {
  name: string;
  totalSpent: number;
  totalItems: number;
  fill: string;
}

export interface SpendingTrendChartDatum {
  periodLabel: string;
  periodStart: string;
  totalSpent: number;
  averageTicketCost: number;
  purchaseCount: number;
}
```

If a type is only used by one component, keep it local in that component.

### 9.5 Components

Add focused components:

- `ShoppingHistoryInsightsPanel.tsx`
  - Container for analytics content.
  - Receives metrics, loading/error state, mapper/formatter instances.
  - Decides empty/error/loading view.

- `ShoppingHistoryKpiCards.tsx`
  - Renders total spent, average ticket cost, most frequent grocery day.

- `SupermarketDominanceChart.tsx`
  - Recharts `PieChart`/`Pie` inside `ResponsiveContainer`.
  - Empty state if no data.

- `SpendingTrendChart.tsx`
  - Recharts `BarChart` or `LineChart`. Recommendation: `BarChart` for totals by bucket (more readable for sparse purchase data).
  - Includes aggregation selector.

- `TrendAggregationSelector.tsx`
  - Buttons for `Semanal`, `Mensual`, `Anual`.
  - Owns no data fetching.

- `ShoppingHistoryMetricsEmptyState.tsx`
  - Friendly copy for users without saved sessions.

### 9.6 Page composition

`app/shopping-history/page.tsx` remains composition root:
- Construct gateway and class instances at module scope or inside page if stateful construction becomes necessary.
- Construct:
  - `ShoppingHistoryMetricsChartMapper`
  - `ShoppingHistoryMetricsFormatter`
- Wire `useShoppingHistoryMetrics(status, activeView, shoppingSessionGateway)`.
- Render tabs above existing content.
- Conditionally render:
  - history master-detail content when `activeView === "history"`
  - insights panel when `activeView === "insights"`

Keep `page.tsx` readable by extracting existing history content into a small component if the page grows too large:

- `ShoppingHistoryMasterDetailPanel.tsx`

This is recommended if implementing insights causes the page to exceed a comfortable size.

## 10) Frontend Empty/Error/Loading Behavior

### Loading
- Show skeleton cards and chart placeholders in insights panel.
- Do not block history list/detail state.

### Empty
- If metrics has `totalPurchases === 0`, show:
  - zeroed KPI cards, or a single friendly empty state.
  - Recommended: show empty state plus neutral KPI cards only if design remains clean.

### Error
- Show an inline non-destructive error card in insights panel:
  - `No se pudieron cargar las métricas. Intentá de nuevo en unos segundos.`
- Do not break history list/detail tab.

## 11) Testing Strategy

### Backend use case tests

Add:
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts`

Tests:
- `should return metrics for a valid user id`
- `should reject an empty user id`
- `should delegate to the shopping session repository with the authenticated user id`

Mock repository port only.

### Backend controller tests

Extend `ShoppingSessionController.unit.test.ts`:
- `should return 200 with metrics for authenticated user`
- `should return 401 when metrics request is unauthorized`
- `should delegate unexpected metrics errors to next`

### Backend persistence tests

If time permits, add integration tests for `PrismaShoppingSessionRepository.getMetricsByUserId` because aggregation SQL is non-trivial.

Recommended integration coverage:
- owned sessions only,
- summary totals/average,
- supermarket spend and item counts,
- weekly/monthly/yearly buckets,
- most frequent grocery day tie-breaker.

If integration is too expensive for this slice, add adapter mapper tests and rely on use case/controller tests, but record the risk in verify report.

### Frontend model tests

Add unit tests:
- `ShoppingHistoryMetricsChartMapper.unit.test.ts`
  - `should map supermarket spending into chart data with stable colors`
  - `should map weekly trend buckets into labeled chart data`
  - `should report no metrics for an empty metrics payload`

- `ShoppingHistoryMetricsFormatter.unit.test.ts`
  - `should format euro values for Spanish display`
  - `should format unknown most frequent day with fallback copy`

### Frontend hook tests

Add:
- `useShoppingHistoryMetrics.unit.test.tsx`

Tests:
- `should not fetch metrics before insights view is active`
- `should fetch metrics when insights view becomes active for authenticated user`
- `should expose an error message when the gateway fails`

Mock at `ShoppingSessionGateway` boundary.

### Frontend component tests

Use React Testing Library, roles/text labels:
- `ShoppingHistoryViewTabs.unit.test.tsx`
- `ShoppingHistoryKpiCards.unit.test.tsx`
- `ShoppingHistoryInsightsPanel.unit.test.tsx`

Chart components should not assert SVG internals. Assert headings, empty states, and mode buttons.

## 12) File Change Plan

### Backend production
- `backend/src/application/ports/incoming/GetShoppingSessionMetricsUseCasePort.ts`
- `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts`
- `backend/src/application/use-cases/shopping-session/contracts.ts`
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.ts`
- `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts`
- Optional if repository grows:
  - `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionMetricsMapper.ts`
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts`
- `backend/src/infrastructure/composition/bootstrap.ts`

### Backend tests
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts`
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`
- Optional integration:
  - `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.integration.test.ts`

### Frontend production
- `frontend/package.json`
- lockfile
- `frontend/src/lib/http/ShoppingSessionGateway.ts`
- `frontend/src/lib/http/ShoppingSessionHttpClient.ts`
- `frontend/src/app/shopping-history/page.tsx`
- `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsContracts.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.ts`
- `frontend/src/features/shopping-history/components/ShoppingHistoryViewTabs.tsx`
- `frontend/src/features/shopping-history/components/ShoppingHistoryInsightsPanel.tsx`
- `frontend/src/features/shopping-history/components/ShoppingHistoryKpiCards.tsx`
- `frontend/src/features/shopping-history/components/SupermarketDominanceChart.tsx`
- `frontend/src/features/shopping-history/components/SpendingTrendChart.tsx`
- `frontend/src/features/shopping-history/components/TrendAggregationSelector.tsx`
- `frontend/src/features/shopping-history/components/ShoppingHistoryMetricsEmptyState.tsx`

### Frontend tests
- Co-located unit tests for model classes, hook, and key components.

## 13) Verification Commands

Backend:

```bash
cd backend && npm run build
cd backend && npm run test:unit -- \
  src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts \
  src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts
```

Frontend:

```bash
cd frontend && npm run build
cd frontend && npm run test -- \
  src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts \
  src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts \
  src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx \
  src/features/shopping-history/components/ShoppingHistoryViewTabs.unit.test.tsx \
  src/features/shopping-history/components/ShoppingHistoryInsightsPanel.unit.test.tsx \
  src/features/shopping-history/components/ShoppingHistoryKpiCards.unit.test.tsx
```

## 14) Tradeoffs and Decisions

### Recharts vs Chart.js
Chosen: **Recharts**.

Reason:
- Declarative React-first API.
- Lowest implementation friction for dashboard-style donut/bar charts.
- Good enough for current analytics needs.

### Aggregation implementation
Chosen:
- Prisma `aggregate` for summary KPIs.
- SQL aggregation via Prisma `$queryRaw` inside persistence adapter for:
  - `SUM(price * quantity)` by supermarket,
  - date bucketing weekly/monthly/yearly,
  - most frequent grocery day.

Reason:
- Prisma `groupBy/_sum` does not support computed expression sums or ergonomic date trunc bucketing.
- Raw SQL remains encapsulated in infrastructure and returns compact aggregated rows.

### Trend chart type
Recommended: **Bar chart** for total spend by period.

Reason:
- Purchases may be sparse; bars make missing/low-volume buckets clearer than a line chart.
- Recharts can still support tooltips with average ticket and purchase count.

## 15) Open Questions / Assumptions

Assumptions locked from proposal/spec:
- Use `shoppedAt` as purchase date for all analytics.
- Dominance chart is based primarily on `totalSpent`; item count is secondary context.
- Use Spanish day labels from backend.
- `GET /api/shopping-sessions/metrics` is the only route in scope.
- Empty history returns zero/empty metrics payload.

No blocking open questions remain for implementation.

## 16) Skill Resolution

- `skill_resolution`: `paths-injected`
- Skills applied:
  - `class-first-architecture`
  - `code-semantic`
  - `hexagonal-architecture`
  - `testing`
