# Task 3: Audit Logging & Data Governance Middleware

## Objective
Implement append-only audit logging for all sensitive actions (file access, query execution, AI consent, user login) in the enterprise proxy, enabling compliance with HIPAA, SOC 2, and GDPR audit requirements.

## Prerequisites
- Review `docs/specs/phase-10/01_enterprise_spec.md` (Section 3.3).
- Task 1 (SSO) and Task 2 (RBAC) must be complete.

## Implementation Steps

### 1. Audit Log Table
Create in PostgreSQL:
```sql
CREATE TABLE audit_events (
    event_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    metadata JSONB
);

-- Index for compliance queries
CREATE INDEX idx_audit_user_time ON audit_events(user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_events(action, timestamp DESC);

-- Prevent modification (append-only enforcement)
REVOKE UPDATE, DELETE ON audit_events FROM localmind_app_role;
```

### 2. Audit Middleware
- Create `services/auth-gateway/middleware/audit.ts`.
- An Express/Hono middleware that runs on every authenticated API call.
- Logs the `AuditEvent` defined in `docs/specs/phase-10/01_enterprise_spec.md` after each action completes.
- Audit writes are **fire-and-forget** (async, non-blocking) — they must never block the API response.

### 3. Client-Side Audit Triggers
- Certain events originate client-side (query execution, AI consent):
  - After `DuckDB.query()` completes, the frontend posts a `POST /api/audit` event: `{ action: 'query.execute', resourceId: tableName }`.
  - After the AI consent modal is confirmed, post `{ action: 'ai.consent_given' }`.
- These client-originated events are validated server-side (JWT must be valid; the server enriches with real IP, timestamp).

### 4. Audit Log Viewer UI (Admin Only)
- Create `src/routes/(enterprise)/admin/audit/+page.svelte`.
- Visible only to `owner`-role users.
- Filterable table: filter by user, action type, date range.
- Export as CSV for compliance submission.
- "Live mode" toggle: new events appear without page refresh (Server-Sent Events from `/api/audit/stream`).

## Definition of Done
- Every API action generates a corresponding audit event in the PostgreSQL table.
- `DELETE FROM audit_events` is blocked by database role permissions.
- The admin audit log viewer shows real events with correct user IDs and timestamps.
- **No mocks.** Real PostgreSQL stores audit events; no in-memory fakes.
- Audit writes are fire-and-forget — API latency does not increase by more than 5ms due to audit logging.
