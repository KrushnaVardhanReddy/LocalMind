# Task 5.8: Test Data Generator

## Objective
Implement a local synthetic test data generator that accepts a JSON schema or SQL DDL as input and generates N rows of realistic, type-correct fake data using `@faker-js/faker` — entirely in a Web Worker, no network required.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.6).
- Phase 1 DuckDB worker must be complete — generated data is loadable into DuckDB for validation queries.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @faker-js/faker
```

### 2. Create the Generator Worker
- Create `src/lib/workers/datagen.worker.ts`.
- Implement:

  ```typescript
  interface DataGenWorkerContract {
      generateFromJsonSchema(schema: object, rowCount: number, seed?: number): Promise<object[]>;
      generateFromSqlDDL(ddl: string, rowCount: number, seed?: number): Promise<object[]>;
  }
  ```

- `generateFromJsonSchema`: parse the JSON Schema, map property types/formats to faker methods:
  - `type: 'string', format: 'email'` → `faker.internet.email()`.
  - `type: 'string', format: 'date'` → `faker.date.recent().toISOString()`.
  - `type: 'integer'` → `faker.number.int({ min, max })` (use schema constraints).
  - `type: 'boolean'` → `faker.datatype.boolean()`.
- `generateFromSqlDDL`: parse the DDL string (simple regex for `CREATE TABLE`), extract column names and types, map SQL types to faker methods.
- Support seeding (`faker.seed(seed)`) for reproducible output.
- Call `expose(new DataGenService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getDataGen()`.

### 4. Build the Generator UI
- Create `src/routes/devtools/datagen/+page.svelte`.
- Input mode toggle: "JSON Schema" vs "SQL DDL".
- Input: `<textarea>` or file drop zone.
- Row count slider: 1 – 100,000 (default: 1,000).
- Seed input: optional number for reproducibility.
- "Generate" button → runs `generateFromJsonSchema()` or `generateFromSqlDDL()`.
- Preview table: shows first 50 rows in a data grid.
- Action buttons:
  - "Load into DuckDB" → registers the full dataset into the DuckDB worker under a user-named table.
  - "Download as CSV" → streams all N rows to a downloadable CSV file.
  - "Download as JSON" → streams to a JSON array file.

### 5. Smart Field Hints
- Auto-detect semantic field names from the schema and apply smart faker mappings:
  - Column named `email` or `email_address` → `faker.internet.email()`.
  - Column named `first_name` or `name` → `faker.person.firstName()`.
  - Column named `phone` → `faker.phone.number()`.
  - Column named `address` → `faker.location.streetAddress()`.

## Definition of Done
- Generating 100,000 rows from a 10-field JSON Schema completes within 5 seconds.
- "Load into DuckDB" allows querying the generated data via the Analytics SQL panel.
- Seeded generation produces identical output across browser refreshes.
- **No mocks, no network.** Real faker generates all data in the Worker thread.
- Smart field hints produce semantically correct data for `email`, `name`, and `phone` columns.
