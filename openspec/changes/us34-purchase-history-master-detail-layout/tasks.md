# Tasks — US34 Purchase History Master-Detail Layout

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 220–320 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Delivery strategy | single focused UI slice |

## Implementation Tasks

- [x] Refactor history page state to include responsive mode: `mobileViewMode: 'list' | 'detail'`.
- [x] Implement computed grouping function for year/month nested accordions.
- [x] Preserve desktop two-column master-detail layout.
- [x] Implement mobile one-panel switcher (list-only/detail-only).
- [x] Add sticky top "Volver al listado" trigger in mobile detail state.
- [x] Add inline filtering controls (search input + supermarket pills).
- [x] Add lightweight slide/fade transitions for mobile view switching.
- [x] Reconcile selected session when filters change.
- [x] Build and type-check frontend.

## Verification Tasks

- [x] `cd frontend && npm run build`
- [x] LSP diagnostics for modified history page are clean.

## Files Changed

- `frontend/src/app/shopping-history/page.tsx`

## Notes
- This task intentionally reuses existing GET endpoint and local filtering for speed.
- Future split into smaller components is possible if the page continues to grow.
