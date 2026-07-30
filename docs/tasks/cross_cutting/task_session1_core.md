# Task: Session-1 (Core Session Schema & Local Export)

## Objective
Implement the `SessionManager` class to serialize the current workspace state from `wa-sqlite` into a portable `.lm` file (JSON blob) and allow users to export it.

## Prerequisites
- Review `docs/specs/cross_cutting/05_sessions_spec.md`
- Review `docs/contracts/cross_cutting/session_manager_contract.md`

## Implementation Steps
1. **Create SessionManager:** Create `src/lib/services/SessionManager.ts` implementing the `SessionManagerContract`.
2. **Implement exportSession:**
   - Fetch the active workspace ID.
   - Query `wa-sqlite` to fetch `workspaces`, `registered_files`, `queries`, and `chat_history` tables.
   - Map them to the JSON schema defined in the spec.
3. **Blob Generation (OPFS):**
   - Stringify the JSON object.
   - Use the `Blob` API to create a `application/json` file blob.
4. **UI Integration:**
   - Add an "Export Session" button to the Command Palette and the Analytics header.
   - Bind it to trigger the download of `workspace_name.lm`.

## 💡 Implementation Tips for Jules
- **Handling wa-sqlite Async Calls:** The `wa-sqlite` API is heavily asynchronous. Make sure you use `Promise.all` when fetching the different tables to prevent waterfall queries that block the UI.
- **OPFS vs Blob:** For the export download, you can just create a standard `new Blob([jsonString], { type: 'application/json' })` and use an object URL (`URL.createObjectURL(blob)`) attached to a hidden `<a>` tag to trigger the browser download.
- **Do not mock the database:** Connect directly to the existing `sqliteWorker` singleton to pull real data.
