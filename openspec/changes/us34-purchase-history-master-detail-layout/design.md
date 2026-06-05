# Design: US34 Purchase History Master-Detail (Responsive + Scalable Timeline)

## 1) Goals
- Scale timeline navigation for long purchase history datasets.
- Preserve fast desktop analysis with side-by-side timeline/detail.
- Provide mobile-first interaction with explicit list/detail states.
- Add inline narrowing controls without extra network round-trips.

## 2) Data and State Model

### Source data
The page consumes `GET /api/shopping-sessions` and stores:
- `entries: ShoppingSessionHistoryEntry[]`

### View state
- `selectedSessionId: string | null`
- `mobileViewMode: 'list' | 'detail'`
- `searchTerm: string`
- `supermarketFilter: string` (`all` + supermarket keys)
- `openYearKeys: string[]`
- `openMonthKeys: string[]`

### Derived state
- `filteredEntries`: local filter over source `entries`.
- `groupedEntries`: computed year/month groups from `filteredEntries`.
- `selectedEntry`: selected ticket within `filteredEntries`.

## 3) Grouping Algorithm
`buildYearMonthGroups(entries)`:
1. bucket by `year` and `month` from `shoppedAt`.
2. sort years DESC and months DESC.
3. compute labels (`June 2026` style via locale formatter).
4. return nested structure:
   - `YearGroup { yearKey, yearLabel, months[] }`
   - `MonthGroup { monthKey, monthLabel, entries[] }`

This keeps rendering logic deterministic and independent from server ordering changes.

## 4) Responsive Rendering Contract

### Desktop (`md+`)
- Grid layout: `timeline panel` + `ticket detail panel`.
- Timeline selection updates detail without route transition.

### Mobile (`< md`)
- Single panel at a time:
  - `list`: timeline + filters only.
  - `detail`: selected ticket only.
- Selection action in list moves to `detail`.
- Detail contains sticky top back trigger (`Volver al listado`) with larger hit-area.

## 5) Filtering Strategy
Inline controls at top of timeline:
- search input (product-name contains, case-insensitive),
- supermarket pills (`all` + detected supermarkets).

Filtering happens on local state:
- first supermarket match, then search match over item names.

If filtered set no longer contains selected ticket:
- auto-select first filtered entry (or clear selection if empty).

## 6) Interaction Details
- Year and month accordions are independently collapsible.
- On first load or filter changes, open-state is reconciled to available keys.
- Mobile transitions use lightweight Tailwind animation classes (`animate-in`, `slide-in-*`, `fade-in-*`).

## 7) Accessibility and UX Notes
- Back trigger in mobile detail uses `min-h-11`, bigger icon/text.
- Top-level navigation button "Volver a productos" uses larger touch target.
- Filters and pills remain keyboard reachable (button/input semantics).

## 8) Validation
Required checks:
- `npm run build` in `frontend/` passes.
- No TS/LSP errors in modified page.

## 9) Tradeoffs
- Consolidating everything in one page component reduces file churn now, but increases component size.
- Chosen intentionally for quick iteration; can be split later into `TimelinePanel`, `DetailPanel`, and hooks if this area grows.
