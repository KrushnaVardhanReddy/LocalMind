# Phase 4: Developer Workspace — Testing Specification

## 1. Overview
End-to-End testing requirements for Phase 4. Tests use Playwright against the local SvelteKit dev server. Fixtures are committed to `tests/fixtures/phase-4/`.

## 2. Test Fixtures Required
- `valid_schema.json` — A well-formed JSON file.
- `invalid_schema.json` — A JSON file with a syntax error.
- `openapi_spec.yaml` — A valid OpenAPI 3.0 spec.
- `sample_code.ts` — A TypeScript source file with known functions and classes.
- `secrets_file.txt` — A text file containing a fake (non-functional) AWS key pattern for secret scanning.
- `jwt_token.txt` — A file containing a known, non-sensitive JWT for decode testing.

## 3. Test Scenarios

### 3.1 JSON Validation
- **Action**: Upload `valid_schema.json`. Verify validation passes with a success indicator. Upload `invalid_schema.json`. Verify a specific syntax error is reported with line number.

### 3.2 Log Analysis via DuckDB
- **Action**: Upload a structured JSON log file. Verify it is loaded as a SQL table. Execute `SELECT level, COUNT(*) FROM logs GROUP BY level` and verify results are displayed.

### 3.3 Code Structure Analysis (tree-sitter)
- **Action**: Upload `sample_code.ts`. Trigger code analysis.
- **Verification**:
  1. Extracted function and class names match known contents of the fixture.
  2. A basic complexity metric is displayed.
  3. No content is sent to an external API.

### 3.4 Secret Scanner
- **Action**: Upload `secrets_file.txt`. Trigger the secret scanner.
- **Verification**:
  1. The scanner detects the fake AWS key pattern.
  2. The matched pattern and line number are displayed.
  3. The scanner completes locally — no external requests.

### 3.5 JWT Decoder
- **Action**: Upload `jwt_token.txt` or paste a JWT string. Trigger decode.
- **Verification**:
  1. The decoded header and payload are displayed.
  2. Expiry status is shown.
  3. No network request is made.

### 3.6 Accessibility Audit
- **Action**: Load the Developer Workspace with a file active.
- **Verification**: Zero axe-core violations at `critical` or `serious` level.

## 4. Acceptance Criteria
- [ ] All scenarios pass against the local build.
- [ ] Secret scanner and JWT decoder are verified to make no external network calls.
- [ ] No axe-core violations at `critical` or `serious` level.
