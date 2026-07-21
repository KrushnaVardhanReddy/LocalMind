# Task 4: Docker & Kubernetes On-Premise Configs

## Objective
Package the LocalMind Enterprise stack (SvelteKit app, auth proxy, PostgreSQL, MinIO) as Docker Compose and Kubernetes Helm chart configurations for on-premise self-hosted deployments.

## Prerequisites
- Review `docs/specs/phase-10/01_enterprise_spec.md` (Section 3.4).
- Tasks 1–3 (SSO, RBAC, Audit) must be complete.

## Implementation Steps

### 1. Docker Compose (`docker-compose.yml`)
```yaml
services:
  app:
    image: localmind/app:latest
    environment:
      - AUTH_GATEWAY_URL=http://gateway:3001
      - DATABASE_URL=postgresql://postgres:${PG_PASSWORD}@db:5432/localmind
    ports: ["3000:3000"]
    depends_on: [gateway, db]

  gateway:
    image: localmind/gateway:latest
    environment:
      - OKTA_DOMAIN=${OKTA_DOMAIN}
      - OKTA_CLIENT_ID=${OKTA_CLIENT_ID}
      - OKTA_CLIENT_SECRET=${OKTA_CLIENT_SECRET}
      - JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private_key
    secrets: [jwt_private_key]
    ports: ["3001:3001"]

  db:
    image: postgres:16-alpine
    environment: { POSTGRES_PASSWORD: "${PG_PASSWORD}" }
    volumes: [pgdata:/var/lib/postgresql/data]

  minio:
    image: minio/minio:latest
    command: server /data
    environment:
      - MINIO_ROOT_USER=${MINIO_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
    volumes: [minio_data:/data]

volumes: { pgdata: {}, minio_data: {} }
secrets:
  jwt_private_key:
    file: ./secrets/jwt_private_key.pem
```

### 2. Kubernetes Helm Chart (`helm/localmind/`)
- Create standard Helm chart structure: `Chart.yaml`, `values.yaml`, `templates/`.
- Templates: `deployment-app.yaml`, `deployment-gateway.yaml`, `service-*.yaml`, `ingress.yaml`, `secret.yaml`, `pvc-postgres.yaml`.
- `values.yaml` should expose: replica counts, image tags, resource requests/limits, ingress host, SSO provider configuration, TLS cert secret name.

### 3. Database Migrations
- Create `db/migrations/` directory with numbered SQL migration files.
- Use `golang-migrate` or `flyway` for automated schema migration on container startup.
- The `gateway` service runs migrations before starting.

### 4. Health Checks & Readiness Probes
- `GET /health` on both `app` and `gateway` — returns `{ status: 'ok', version: '...' }`.
- Configure Kubernetes `livenessProbe` and `readinessProbe` in all Deployment templates.

### 5. CI Docker Build
- Add `.github/workflows/docker-build.yml` that builds and pushes `localmind/app:latest` to GHCR on every push to `main`.

## Definition of Done
- `docker compose up` starts the full stack and the app is accessible at `http://localhost:3000`.
- Helm chart installs cleanly on a local `k3s` or `kind` cluster: `helm install localmind ./helm/localmind`.
- Health checks return `{ status: 'ok' }` for all services.
- **No mocks.** Real PostgreSQL and real MinIO are required; no in-memory database substitutions.

---

# Task 5: SOC 2 Compliance Documentation
(Deferred — documentation task, no code. To be completed by the compliance team after audit logging is validated in production.)

---

# Phase 10: End-to-End Testing

## Objective
Validate enterprise features (SSO login, RBAC, audit logging) end-to-end using a real test Okta tenant and a PostgreSQL test database.

## Test Cases (`tests/phase-10/`)

```typescript
// sso.spec.ts
test('SSO login redirects and returns authenticated session', async ({ page }) => {
    // Navigate to /auth/login?provider=okta
    // Complete Okta test account login
    // Assert: redirected to /dashboard with user name displayed
    // Assert: JWT cookie is set with correct expiry
});

// rbac.spec.ts
test('Viewer cannot access Save button', async ({ page }) => {
    // Login as viewer-role user for a workspace
    // Navigate to the workspace
    // Assert: "Save Query" button is disabled or absent
});

// audit.spec.ts
test('Query execution generates audit event', async ({ page }) => {
    // Login as editor, run a SQL query
    // Navigate to /admin/audit (as owner)
    // Assert: a 'query.execute' event appears in the audit log
});
```

## Definition of Done
- Tests pass using real Okta test credentials (stored in CI secrets).
- **No mocks.** Real auth gateway, real PostgreSQL, real RBAC enforced.
