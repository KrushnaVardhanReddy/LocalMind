TASK: Phase 4 — Task 6: PII Data Sanitizer (JSON/CSV)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline PII (Personally Identifiable Information) redaction tool for structured data (CSV/JSON). It will scan large files utilizing the existing Transformers.js NER worker to mask detected PII and export a sanitized copy.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-4/01_devtools_engine_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Reuse Existing Workers: Delegate Named Entity Recognition to the existing NER worker (Transformers.js).
- Large Files: Process CSV and JSON in chunks (using Streams or Web Workers) to avoid locking the main UI thread.
- Zero Data Egress: The masking process must happen entirely offline.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/devtools/pii-sanitizer/` (Target directory for the new route)
- `src/lib/workers/WorkerManager.ts` (For retrieving the NER worker instance)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Parsing: Use a lightweight stream parser like `papaparse` for CSV and a streaming JSON parser for large payloads.
- Masking: Replace detected entities with placeholders like `[REDACTED_PERSON]` or `[REDACTED_EMAIL]`.
- Batching: Send text chunks to the NER worker in batches to maximize throughput.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/devtools/pii-sanitizer/+page.svelte`
2. NEW: `src/lib/components/devtools/PiiSanitizerRunner.svelte`

Commit: "feat: Phase 4 Task 6 PII Data Sanitizer"
Target branch: feature/task6-pii-sanitizer
