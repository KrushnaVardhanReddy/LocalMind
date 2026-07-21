# Task 5.9: Local Mock API Server

## Objective
Implement an in-browser mock API server using Mock Service Worker (MSW) that intercepts `fetch()` requests and returns realistic synthetic responses derived from a dropped OpenAPI spec — enabling developers to test frontends without a running backend.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.7).
- Task 5.8 (Test Data Generator) should be complete — the mock server can use the DataGen worker to generate response bodies.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add msw @readme/openapi-parser
```

### 2. OpenAPI Spec Parser
- Create `src/lib/utils/openapi-parser.ts`.
- Use `@readme/openapi-parser.validate()` to parse and dereference the OpenAPI spec.
- Extract all endpoints: `{ method, path, responseSchema, exampleResponse }`.

### 3. MSW Handler Generator
- Create `src/lib/mock-server/handler-generator.ts`.
- For each extracted endpoint, generate an MSW `http.get/post/put/delete()` handler.
- Response body priority:
  1. Use `example` field from the OpenAPI spec if present.
  2. If no example, use `DataGenWorkerContract.generateFromJsonSchema(responseSchema, 1)` to generate a single realistic response.
- Set correct `Content-Type` headers from the spec.
- Simulate realistic latency (default: 200ms ± 50ms random jitter).

### 4. MSW Service Worker Setup
- Run `bunx msw init static/ --save` to copy the MSW service worker file to `static/`.
- In `src/lib/mock-server/index.ts`:
  - `startMockServer(handlers: HttpHandler[])`: calls `worker.start({ onUnhandledRequest: 'bypass' })`.
  - `stopMockServer()`: calls `worker.stop()`.

### 5. Build the Mock Server UI
- Create `src/routes/devtools/mock-server/+page.svelte`.
- Drop zone: accepts `.json` or `.yaml` OpenAPI spec files.
- Endpoint list: after parsing, show all detected endpoints in a table (method badge + path).
- Per-endpoint controls:
  - **Enabled toggle**: include/exclude from mock.
  - **Status code override**: change response status (200, 201, 400, 500).
  - **Latency override**: slider 0–5000ms.
- "Start Mock Server" button → initializes MSW with all enabled handlers.
- "Stop" button → stops MSW.
- Activity log: shows intercepted requests in real time (method, path, status, latency).
- Active state indicator: green pill "Mock Server Active" in the top bar when running.

## Definition of Done
- Loading a PetStore OpenAPI spec detects all endpoints and generates handlers.
- A `fetch('/pets')` call from a browser tab returns the mocked response from MSW.
- The activity log updates in real time as requests are intercepted.
- **No mocks of the mock server.** Real MSW intercepts real `fetch()` calls.
- Stopping the server causes subsequent `fetch()` calls to pass through to the real network.
