# Proposal: US34 Scalable Responsive Layout for Purchase History (Master-Detail)

## Problem Statement
The current `/shopping-history` view works for small datasets but degrades as purchase volume grows:
- mobile navigation targets are too small for quick back-and-forth,
- timeline becomes a long flat list,
- no inline narrowing controls for product/supermarket lookup.

This hurts discoverability and day-to-day budget tracking.

## Intent
Deliver a scalable master-detail purchase history experience with:
- hierarchical grouping (year/month accordions),
- responsive behavior (desktop two-column, mobile list/detail state switch),
- inline filtering primitives (search + supermarket pills),
- improved mobile detail navigation affordance.

## Scope
### In scope
- Refactor `shopping-history` page state to support mobile `list | detail` mode.
- Group timeline entries by year and month with collapsible sections.
- Keep desktop split layout (`>= md`) with timeline + detail.
- Add mobile sticky back trigger in detail mode.
- Add inline search and supermarket filter pills over local history state.
- Add lightweight transition animation between mobile states.

### Out of scope
- Backend persistence model changes (already implemented in previous US).
- Cross-page global filter synchronization.
- Analytics/aggregation endpoints beyond current `GET /api/shopping-sessions` response.

## Affected Areas
- `frontend/src/app/shopping-history/page.tsx`

## Success Criteria
- Timeline is grouped by year/month with counts and collapsible behavior.
- Desktop remains two-column and fully functional.
- Mobile shows only one panel at a time (`list` or `detail`) and includes sticky "Volver al listado" in detail mode.
- Search + supermarket filters reduce timeline entries in real time.
- Frontend build passes.

## Risks
- State coupling between filters, selected ticket, and accordion-open state can cause stale selection bugs.
- Mobile transitions can create jumpiness if not coordinated with sticky header offsets.

## Rollback Plan
- Revert `frontend/src/app/shopping-history/page.tsx` to previous flat list/detail implementation.
- Keep backend read endpoint unchanged.
