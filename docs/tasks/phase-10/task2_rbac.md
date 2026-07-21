# Task 2: Team Workspaces & RBAC

## Objective
Implement multi-user team workspaces with role-based access control, enabling organizations to share dashboards, saved queries, and file registrations across team members with appropriate permissions.

## Prerequisites
- Review `docs/specs/phase-10/01_enterprise_spec.md` (Section 3.2).
- Task 1 (SSO) must be complete — workspace access is gated by authenticated session.

## Implementation Steps

### 1. Extend wa-sqlite Schema (Server-Side)
For enterprise, workspace metadata is stored in **PostgreSQL** (not just OPFS) so it's shared across users:
```sql
CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,  -- SSO subject
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);
```

### 2. Workspace API Endpoints
- `POST /api/workspaces` — create a new workspace (owner only).
- `GET /api/workspaces` — list workspaces the authenticated user is a member of.
- `POST /api/workspaces/{id}/members` — invite a user by email (owner only).
- `PATCH /api/workspaces/{id}/members/{userId}` — change a member's role (owner only).
- `DELETE /api/workspaces/{id}/members/{userId}` — remove a member (owner only).

### 3. Workspace Sync
- Saved queries, dashboard panels, and file metadata are synced to the server (PostgreSQL) when a workspace is in "Team" mode.
- Local-only workspaces continue to use OPFS/wa-sqlite.
- A "Team Workspace" badge distinguishes synced from local workspaces in the UI.

### 4. Invite Flow UI
- In workspace settings, add a "Members" tab.
- Email input + Role dropdown + "Invite" button.
- Member list with current roles and "Remove" buttons.
- Pending invitations shown as "Invited (awaiting login)".

### 5. Permission Guards
- All destructive actions (delete workspace, remove file, overwrite dashboard) check `canEdit()`.
- Viewer-role users see a disabled state on all write actions with tooltip: "You have read-only access to this workspace."

## Definition of Done
- User A creates a workspace and invites User B as Editor.
- User B logs in and sees the workspace in their dashboard.
- User B can save queries but cannot delete the workspace.
- **No mocks.** Real PostgreSQL + real Okta SSO for E2E validation.
- Revoking User B's membership immediately removes their access on next API call.
