# Task 7: End-to-End Testing — Phase 4 (LocalMind DevTools)

## Objective
Establish a comprehensive, zero-mock Playwright E2E test suite for all Phase 4 DevTools features — formatters, converters, code analysis, pipelines, log parsing, visual diffing, test data generation, and the mock API server — across Chrome, Firefox, and WebKit.

## Prerequisites
- All Phase 4 tasks (Tasks 1 through 5.9) must be fully complete and merged.
- Playwright must already be installed from Phase 1 E2E testing.
- **No mocking rule:** All tests must exercise real WASM engines, real libraries, and real browser APIs. `page.route()` interception is only permitted for external network requests from the mock API server tests. Worker initialization must use real binaries — never stub the `WorkerManager`.

## Implementation Steps

### 1. Test Fixtures
Create `tests/fixtures/devtools/`:
- `sample.json` — valid 500-line JSON object (nested).
- `invalid.json` — syntactically invalid JSON.
- `sample.jwt` — a real (expired) JWT token string.
- `sample.yaml` — a 50-key YAML document.
- `sample.xml` — a 100-element XML document.
- `typescript_file.ts` — a 200-line TypeScript file with functions, classes, and imports.
- `nginx.log` — 10,000 lines of realistic nginx access log format.
- `screenshot_a.png` and `screenshot_b.png` — two nearly identical screenshots with a button moved 10px.
- `petstore.yaml` — the standard Swagger PetStore OpenAPI spec.
- `user_schema.json` — a JSON Schema for a user object (name, email, age, address).

### 2. Formatter Tests (`tests/phase-4/formatters.spec.ts`)
```typescript
test('JSON formatter formats minified JSON correctly', async ({ page }) => {
    // Navigate to /devtools/formatters
    // Paste content of sample.json (minified)
    // Assert: formatted output panel shows pretty-printed JSON with indentation
});

test('JSON formatter shows error for invalid JSON', async ({ page }) => {
    // Paste invalid.json content
    // Assert: red error border and error message with line number are visible
});

test('JWT inspector decodes a valid JWT and shows expiry', async ({ page }) => {
    // Select JWT tab, paste sample.jwt
    // Assert: header and payload panels render with decoded JSON
    // Assert: expiry field shows human-readable "Expired X time ago"
});

test('Base64 encoder round-trips plain text correctly', async ({ page }) => {
    // Select Base64 tab, type "Hello LocalMind"
    // Assert: encoded output is "SGVsbG8gTG9jYWxNaW5k"
    // Toggle to Decode, paste the encoded string
    // Assert: decoded output is "Hello LocalMind"
});
```

### 3. Converter Tests (`tests/phase-4/converters.spec.ts`)
```typescript
test('JSON to YAML conversion produces valid YAML', async ({ page }) => {
    // Navigate to /devtools/converters
    // Select JSON → YAML, paste sample.json
    // Assert: output panel contains valid YAML (starts with a key, not a bracket)
});

test('Malformed XML shows a descriptive error message', async ({ page }) => {
    // Select XML → JSON, paste "<unclosed_tag>"
    // Assert: error message visible, no unhandled exception
});
```

### 4. Code Analysis Tests (`tests/phase-4/code.spec.ts`)
```typescript
test('tree-sitter extracts functions from a TypeScript file', async ({ page }) => {
    // Navigate to /devtools/code
    // Drop typescript_file.ts fixture
    // Assert: language badge shows "TypeScript"
    // Assert: at least one function symbol is shown in the tree view
});
```

### 5. Log Parser Tests (`tests/phase-4/logs.spec.ts`)
```typescript
test('Log parser loads nginx log and generates regex suggestion', async ({ page }) => {
    // Navigate to /devtools/logs
    // Drop nginx.log fixture
    // Assert: 10,000 lines are visible in the virtualized list
    // Click the first log line → "Generate pattern" tooltip appears
    // Click "Generate pattern"
    // Assert: regex editor is populated with a pattern containing named groups
});
```

### 6. Visual Diff Tests (`tests/phase-4/visual-diff.spec.ts`)
```typescript
test('Visual diff detects changed pixels between two screenshots', async ({ page }) => {
    // Navigate to /devtools/visual-diff
    // Drop screenshot_a.png on Expected, screenshot_b.png on Actual
    // Click "Compare"
    // Assert: percentage changed is > 0% and < 5%
    // Assert: diff heatmap image is rendered
});

test('Identical images report 0% changed', async ({ page }) => {
    // Drop screenshot_a.png on both Expected and Actual
    // Click "Compare"
    // Assert: "0% changed" is displayed
});
```

### 7. Test Data Generator Tests (`tests/phase-4/datagen.spec.ts`)
```typescript
test('Generator produces correct number of rows from JSON Schema', async ({ page }) => {
    // Navigate to /devtools/datagen
    // Paste user_schema.json content
    // Set row count to 100
    // Click "Generate"
    // Assert: preview table shows exactly 50 rows (capped preview)
    // Assert: "100 rows generated" label is visible
});
```

### 8. Mock Server Tests (`tests/phase-4/mock-server.spec.ts`)
```typescript
test('Mock server intercepts fetch calls after activation', async ({ page }) => {
    // Navigate to /devtools/mock-server
    // Drop petstore.yaml
    // Assert: endpoint list shows GET /pets, POST /pets
    // Click "Start Mock Server"
    // Assert: "Mock Server Active" badge is visible
    // In page context, execute fetch('/pets')
    // Assert: response status is 200
    // Assert: activity log shows one intercepted request
});
```

## Definition of Done
- `bun run test:e2e -- tests/phase-4/` passes across Chrome, Firefox, and WebKit.
- **Zero mocks.** All WASM workers and libraries use real implementations.
- All tests pass in CI without requiring a network connection.
- Total Phase 4 test suite runtime does not exceed 8 minutes.
- Each test file is independently runnable (`bun run test:e2e -- tests/phase-4/formatters.spec.ts`).
