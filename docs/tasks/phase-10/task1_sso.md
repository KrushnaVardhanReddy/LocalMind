# Task 1: Headless API & SSO Authentication (SAML/Okta)

## Objective
Implement the enterprise authentication gateway as a Cloudflare Worker (or lightweight Node.js service) supporting SAML 2.0 / OIDC SSO (Okta, Azure AD, Google Workspace), issuing short-lived JWTs to authenticated browser sessions.

## Prerequisites
- Review `docs/specs/phase-10/01_enterprise_spec.md` (Section 3.1).
- Phase 11 (Cloudflare Proxy) architecture understanding is helpful for context.

## Implementation Steps

### 1. Auth Gateway Service
- Create `services/auth-gateway/` (a separate Cloudflare Worker or Express app).
- Implement OIDC discovery: `GET /.well-known/openid-configuration` on the IdP → cache metadata.
- `GET /auth/login?provider=okta` → redirect to IdP authorization URL with PKCE.
- `GET /auth/callback` → exchange code for ID token, validate, issue a LocalMind session JWT.

### 2. Session JWT Schema
```typescript
interface LocalMindSessionJWT {
    sub: string;          // SSO user ID
    email: string;
    name: string;
    org_id: string;       // Enterprise org ID
    tier: 'enterprise';
    roles: string[];      // Workspace role IDs
    exp: number;          // 1 hour from issue
    iat: number;
}
```
Sign with RS256. Store the private signing key as a Cloudflare Secret.

### 3. SvelteKit Auth Integration
- Create `src/lib/auth/session.ts`.
- On SvelteKit load (server-side in `+layout.server.ts`), check for the session JWT in an `HttpOnly` cookie.
- If missing or expired, redirect to `/auth/login`.
- Expose the decoded user object to Svelte via `locals.user`.

### 4. RBAC Enforcement
- Create `src/lib/auth/rbac.ts` with `canEdit(user, workspaceId)` and `canView(user, workspaceId)` helpers.
- Apply these guards in all workspace API routes.

### 5. Enterprise Landing Page
- Create `src/routes/(enterprise)/dashboard/+page.svelte`.
- Shows a welcome message with the authenticated user's name and organization.
- Lists workspaces the user has access to with their role badge (Owner / Editor / Viewer).

## Definition of Done
- Clicking "Login with Okta" redirects correctly to the Okta login page.
- After authentication, the dashboard shows the user's name and workspace list.
- Accessing a workspace as a Viewer hides all "Save" and "Export" buttons.
- **No mocks.** A real (test) Okta developer account is used for the E2E test.
- JWT expiry is enforced — an expired token triggers re-authentication.
