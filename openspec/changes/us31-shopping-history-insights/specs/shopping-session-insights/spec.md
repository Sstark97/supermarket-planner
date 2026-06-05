# Shopping Session Insights Specification

## Purpose

Provide authenticated users with an Analytics/Insights view that summarizes personal shopping-session history with actionable spending metrics and trends.

## Requirements

### Requirement: Analytics Insights Sub-View Availability

The system MUST provide an Analytics/Insights sub-view within the shopping history experience.

#### Scenario: User switches from history list to analytics

- GIVEN an authenticated user is on `/shopping-history`
- WHEN the user selects the Analytics/Insights tab or section
- THEN the UI renders metrics and charts for that user
- AND the existing history list/detail flow remains available as an alternative sub-view

### Requirement: Ownership-Scoped Metrics API

The backend MUST expose `GET /api/shopping-sessions/metrics` and MUST return metrics for the authenticated owner only.

#### Scenario: Authenticated user retrieves personal metrics

- GIVEN a request to `GET /api/shopping-sessions/metrics` with valid authentication
- WHEN the backend processes the request
- THEN the backend returns aggregated metrics computed from shopping sessions owned by the authenticated `userId`
- AND the response excludes other users' data

#### Scenario: Unauthenticated metrics request

- GIVEN a request to `GET /api/shopping-sessions/metrics` without valid authentication
- WHEN the backend processes the request
- THEN the backend returns `401 Unauthorized`
- AND no metrics payload is returned

### Requirement: Supermarket Dominance Distribution

The system MUST provide supermarket dominance data suitable for rendering a pie or donut chart across supported supermarkets.

#### Scenario: Dominance chart uses aggregated supermarket metrics

- GIVEN the authenticated user has one or more saved shopping sessions
- WHEN metrics are requested
- THEN the response contains aggregated supermarket distribution values
- AND the frontend renders a supermarket dominance chart from that aggregated data
- AND the chart represents spending distribution (and MAY include item-count context)

### Requirement: Spending Trend Aggregations by Period

The system MUST provide historical expenditure trends grouped by weekly, monthly, and yearly aggregations.

#### Scenario: Metrics response includes trend buckets for all supported periods

- GIVEN metrics are requested for an authenticated user
- WHEN the backend builds the metrics payload
- THEN the payload contains weekly, monthly, and yearly trend series
- AND each series groups totals by its period bucket
- AND the frontend can switch trend visualization between these aggregation modes

### Requirement: KPI Cards for Personal Spending Summary

The system MUST provide KPI values for average ticket cost, total spent to date, and most frequent grocery day.

#### Scenario: Analytics KPI cards render from metrics payload

- GIVEN the user opens Analytics/Insights
- WHEN metrics retrieval succeeds
- THEN the UI displays:
  - average ticket cost,
  - total spent to date,
  - most frequent grocery day
- AND values reflect only that authenticated user's history

### Requirement: Metrics Endpoint Uses Aggregation-Oriented Retrieval

The backend MUST compute metrics with aggregation-oriented persistence queries to avoid returning raw heavy history rows to the client.

#### Scenario: Backend returns compact aggregated payload

- GIVEN a metrics request to `GET /api/shopping-sessions/metrics`
- WHEN the backend executes persistence queries
- THEN the backend uses aggregation-capable query patterns (for example, `groupBy`, `_sum`, `_count`, or equivalent compact projections)
- AND the response contains only the metrics-oriented payload needed for analytics rendering

### Requirement: Empty-State Analytics Behavior

The system MUST handle users with no shopping history without chart/runtime failures.

#### Scenario: User has no saved sessions

- GIVEN an authenticated user with zero saved shopping sessions
- WHEN the user opens Analytics/Insights
- THEN KPI values are returned as neutral defaults
- AND chart datasets are empty but valid
- AND the UI displays a friendly empty-state message
