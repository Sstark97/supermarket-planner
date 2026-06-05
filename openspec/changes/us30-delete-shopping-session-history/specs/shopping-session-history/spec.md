# Shopping Session History Specification

## Purpose

Allow authenticated users to remove an unwanted historical shopping session record from their own history with explicit confirmation, ownership-safe backend behavior, and immediate UI synchronization.

## Requirements

### Requirement: Historical Session Deletion Action Visibility

The system MUST provide an identifiable delete action for each deletable shopping session record in the history experience.

#### Scenario: Delete action appears in detail panel

- GIVEN an authenticated user is viewing a shopping session detail
- WHEN the detail panel is rendered
- THEN the UI shows a visible delete control for that session
- AND the control communicates destructive intent through iconography or text

### Requirement: Deletion Confirmation Gate

The system MUST require explicit user confirmation before executing shopping session deletion.

#### Scenario: User opens confirmation modal before delete

- GIVEN the user activates the delete control for a shopping session
- WHEN the delete action is triggered
- THEN the UI opens a confirmation modal before sending a delete request
- AND the modal states that deletion is irreversible

#### Scenario: User cancels deletion

- GIVEN the confirmation modal is open
- WHEN the user cancels
- THEN no delete request is sent
- AND the targeted shopping session remains unchanged in the UI

### Requirement: Ownership-Enforced Deletion API

The backend MUST expose `DELETE /api/shopping-sessions/:id` and MUST enforce authenticated ownership before deletion.

#### Scenario: Owner deletes own shopping session

- GIVEN an authenticated user requests `DELETE /api/shopping-sessions/:id`
- AND the shopping session belongs to that user
- WHEN the backend processes the request
- THEN the backend returns a success response
- AND the target shopping session is deleted from persistence
- AND associated shopping session items are deleted via relational cascade semantics

#### Scenario: Unauthenticated deletion request

- GIVEN a request to `DELETE /api/shopping-sessions/:id` without valid authentication
- WHEN the backend processes the request
- THEN the backend returns `401 Unauthorized`
- AND no data is deleted

#### Scenario: Non-owner or missing shopping session

- GIVEN an authenticated request to `DELETE /api/shopping-sessions/:id`
- AND the target session is missing or not owned by the requester
- WHEN the backend processes the request
- THEN the backend returns `404 Not Found`
- AND no ownership information is leaked by response variance

### Requirement: Immediate History UI Synchronization After Delete

The frontend MUST update history state immediately after successful deletion without requiring a manual page refresh.

#### Scenario: Deleted entry disappears from timeline and detail context

- GIVEN the user confirms deletion and receives a successful backend response
- WHEN frontend state is updated
- THEN the deleted session is removed from rendered history groups
- AND the detail panel selects a remaining valid session or empty-state fallback
- AND the user does not need to hard-refresh the page

#### Scenario: Failed deletion preserves current UI data

- GIVEN the user confirms deletion
- WHEN the backend delete request fails
- THEN the targeted session remains in UI state
- AND the UI exits loading state safely
- AND the user receives an error notification
