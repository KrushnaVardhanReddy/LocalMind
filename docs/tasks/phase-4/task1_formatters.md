# Task 1: Offline Data Formatters & Validators (JSON, JWT, Base64)

## Objective
Implement a suite of instant, browser-native data formatting and validation tools — JSON formatter/validator, JWT inspector, and Base64 encoder/decoder — all running synchronously in the main thread (no WASM needed) with sub-millisecond response times.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.1).
- Phase 1 scaffolding must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add ajv highlight.js
```

### 2. Create the DevTools Route
- Create `src/routes/devtools/+page.svelte` as the DevTools hub with tab navigation.
- Create `src/routes/devtools/formatters/+page.svelte`.
- Three sub-tabs: JSON, JWT, Base64.

### 3. JSON Formatter & Validator
- Left panel: raw input `<textarea>`.
- Right panel: formatted output rendered via `highlight.js` with `json` language.
- Auto-format on paste (debounced 100ms).
- JSON Schema validation:
  - Secondary `<textarea>` for optional JSON Schema input.
  - Validate using `ajv` — display errors inline with line numbers.
- Error state: red border + error message showing path (e.g., `$.user.email: must be string`).
- Buttons: "Format", "Minify", "Copy", "Clear".

### 4. JWT Inspector
- Single input field for the raw JWT token.
- On input, decode header + payload (base64url decode → JSON.parse).
- Display three panels: Header, Payload, Signature Status.
- Signature Status: "Cannot verify signature (no secret/key provided)" — display a subtle warning; never claim a JWT is "valid" without actual cryptographic verification.
- Highlight expiry (`exp`) claim — display human-readable datetime and "Expired X minutes ago" if past.

### 5. Base64 Encoder / Decoder
- Toggle switch: "Encode" vs "Decode" mode.
- In Encode mode: accepts plain text or a dropped file (image, binary).
- In Decode mode: accepts a base64 string, auto-detects if it's a data URL, offers "Download as file" if the decoded content is binary.
- Show input/output lengths and the encoding ratio.

## Definition of Done
- Pasting a 10,000-line JSON blob formats instantly (< 100ms).
- Pasting an invalid JWT shows an error; pasting a valid (non-expired) JWT displays all claims.
- Base64 encoding an image file produces a correct data URL that renders in an `<img>` tag.
- **No external API calls.** Everything runs synchronously in the browser.
- Keyboard shortcut `Ctrl+Enter` triggers the primary action on each tab.
