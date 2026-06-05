# Apply Progress — us31-shopping-history-insights

## Scope / PR Boundary
- **Applied slices:** PR1 (backend metrics API) + PR2 (frontend metrics gateway/model/hook).
- **Out of scope in this apply:** PR3 insights UI/charts/tab integration.

## Completed Tasks

### PR1 (backend)
- Marked PR1 backend tasks as completed in `tasks.md`:
  - incoming metrics use-case port
  - metrics contracts
  - repository port metrics method
  - use-case tests
  - controller metrics tests
  - metrics use case implementation
  - Prisma adapter metrics aggregation implementation
  - controller metrics handler
  - route wiring for `GET /api/shopping-sessions/metrics`
  - backend checks rerun
  - final backend gate (build + targeted tests)

### PR2 (frontend metrics foundation)
- Marked PR2 tasks completed in `tasks.md`:
  - gateway contract extension with `getMetrics(token)`
  - HTTP client implementation for `GET /api/shopping-sessions/metrics`
  - class-first model contracts/mappers/formatter/assembler
  - dedicated metrics hook (`useShoppingHistoryMetrics`) with loading/error/data/reload
  - hook test coverage for activation/fetch/error behavior
  - model unit tests for mapper and formatter
  - confirmed no generic exported `utils` module was introduced for insights logic

## Files Changed

### Backend
- `backend/src/application/ports/incoming/GetShoppingSessionMetricsUseCasePort.ts`
- `backend/src/application/ports/outgoing/ShoppingSessionRepository.ts`
- `backend/src/application/use-cases/shopping-session/contracts.ts`
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.ts`
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts`
- `backend/src/infrastructure/adapters/driven/persistence/prisma/PrismaShoppingSessionRepository.ts`
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.ts`
- `backend/src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`
- `backend/src/infrastructure/composition/bootstrap.ts`
- `backend/src/application/use-cases/shopping-session/SaveShoppingSessionUseCase.unit.test.ts`
- `backend/src/application/use-cases/shopping-session/GetShoppingSessionsUseCase.unit.test.ts`
- `backend/src/application/use-cases/shopping-session/DeleteShoppingSessionUseCase.unit.test.ts`

### Frontend (PR2)
- `frontend/src/lib/http/ShoppingSessionGateway.ts`
- `frontend/src/lib/http/ShoppingSessionHttpClient.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsContracts.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryInsightsModelAssembler.ts`
- `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.ts`
- `frontend/src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts`
- `frontend/src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts`
- `openspec/changes/us31-shopping-history-insights/tasks.md`
- `openspec/changes/us31-shopping-history-insights/apply-progress.md`

## Verification Commands Run
- `cd backend && npm run build`
- `cd backend && npm run test:unit -- src/application/use-cases/shopping-session/GetShoppingSessionMetricsUseCase.unit.test.ts src/infrastructure/adapters/driving/http/ShoppingSessionController.unit.test.ts`
- `cd frontend && npm run build`
- `cd frontend && npm run test -- src/features/shopping-history/hooks/useShoppingHistoryMetrics.unit.test.tsx`
- `cd frontend && npm run test -- src/features/shopping-history/model/ShoppingHistoryMetricsChartMapper.unit.test.ts src/features/shopping-history/model/ShoppingHistoryMetricsFormatter.unit.test.ts`
- `cd frontend && npx tsc --noEmit -p tsconfig.json`

## Test Evidence
- Backend build passed.
- Backend targeted tests passed.
- Frontend build passed.
- Frontend targeted hook/model tests passed.
- Frontend type-check (`npx tsc --noEmit`) passed.

## Design Notes / Deviations
- Endpoint naming preserved as required: `GET /api/shopping-sessions/metrics`.
- PR2 intentionally avoids UI/tab/chart integration; it prepares gateway + model + hook for PR3.
- Insights model layer implemented with classes (`ChartMapper`, `Formatter`, `ModelAssembler`) to keep transformations explicit and testable.

## Remaining Tasks
From `tasks.md`, remaining unchecked items (PR3/UI slice):
- `- [ ] Install chart library in frontend (\`recharts\`).`
- `- [ ] Add failing component tests:`
- `- [ ] Add components:`
- `- [ ] Integrate tabs + metrics hook in \`frontend/src/app/shopping-history/page.tsx\` while preserving history mode behavior.`
- `- [ ] Ensure mobile and desktop states continue to work when switching between History and Insights views.`
- `- [ ] Ensure semantic labels and accessible tab/button text for RTL queries.`
- `- [ ] Confirm empty-state copy for no metrics and non-destructive error state for fetch failures.`
- `- [ ] Keep page composition root responsible for dependency construction (\`new\`), not leaf components.`
- `- [ ] Frontend compiles and targeted metrics tests pass:`
- `- [ ] Manual sanity checks:`

## Workload / Delivery
- Delivery path honored: chained PR strategy.
- Current implementation corresponds to **PR1 + PR2**, leaving PR3 as focused UI integration work.
