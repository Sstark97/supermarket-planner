# Mercadona Scraper Specification

## Purpose

Define the standard Mercadona scraping contract to use direct HTTP API access, preserve Las Palmas warehouse targeting behavior, and keep API-to-domain product mapping correctness.

## Acceptance Criteria

- Standard Mercadona scraper execution uses direct HTTP requests and SHALL NOT depend on Playwright browser context/page creation.
- Mercadona product search requests target `https://api2.mercadona.es/api/search/` with required validated headers.
- Warehouse (`wh`) resolution for Las Palmas remains dynamic and supports the currently active logistics identifier (including 3544 when active).
- Mapping from Mercadona API payload, including `price_instructions`, remains correct for `IProduct` fields and type expectations.

## Requirements

### Requirement: Standard Flow Browser Independence

The system MUST execute the standard Mercadona scraping flow without instantiating or using Playwright browser context/page objects.

#### Scenario: Standard scraper run avoids Playwright context/page usage

- GIVEN a standard Mercadona scraping execution path
- WHEN the scraper performs a product search
- THEN no Playwright context or page is created or used
- AND the search proceeds through the non-browser transport path

### Requirement: Direct Mercadona API Search Transport

The system MUST perform Mercadona product search by issuing native HTTP requests to `https://api2.mercadona.es/api/search/`.

#### Scenario: Search request targets Mercadona API endpoint

- GIVEN a product query for Mercadona
- WHEN the scraper dispatches the search request
- THEN the request URL is `https://api2.mercadona.es/api/search/`
- AND the request is executed via native HTTP transport in scraper flow

### Requirement: Mandatory Header Validation for Mercadona Requests

The system MUST construct and validate mandatory headers for Mercadona API requests before dispatch.

#### Scenario: Request includes required Origin and realistic residential User-Agent

- GIVEN a Mercadona API search request is prepared
- WHEN headers are validated for dispatch
- THEN `Origin` equals `https://tienda.mercadona.es`
- AND `User-Agent` represents a realistic residential browser profile
- AND the request is blocked or rejected from dispatch if mandatory headers are missing or invalid

### Requirement: Dynamic Las Palmas Warehouse Resolution

The system MUST resolve Mercadona `wh` dynamically for Las Palmas logistics routing and SHALL support the currently active value (including `3544` when active).

#### Scenario: Warehouse parameter resolves to active Las Palmas mapping

- GIVEN a Mercadona search in Las Palmas operating context
- WHEN the scraper computes the `wh` request parameter
- THEN the resolved value matches the active Las Palmas logistics identifier
- AND the value is not hardcoded to a stale identifier when mapping updates

### Requirement: Typed API-to-IProduct Mapping Fidelity

The system MUST map Mercadona API payload fields to `IProduct` fields correctly, including `price_instructions`, while preserving expected type correctness.

#### Scenario: API payload is converted into typed domain product data

- GIVEN a Mercadona API response containing product data including `display_name`, `thumbnail`, and `price_instructions`
- WHEN the scraper maps response items into `IProduct`
- THEN mapped `IProduct` fields contain semantically correct values from the API
- AND mapped values satisfy expected field typing constraints
- AND `price_instructions`-derived pricing fields remain consistent with prior domain semantics
