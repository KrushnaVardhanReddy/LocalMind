# Task 1: Universal Document Q&A Workspace

## Overview
A generic, powerful workspace that allows users to upload any document (PDFs, text files, markdown) and chat with it locally using the WebLLM engine. This single workspace replaces all niche document analyzers (Legal Contracts, Medical Lab Reports, Blueprints, etc.).

## ⚠️ CRITICAL DELEGATION CONTRACT
**To ensure conflict-free parallel execution across the LocalMind repository, you MUST strictly adhere to the following rules. Failure to do so will result in a rejected PR.**

1. **NO `WorkerManager.ts` Modifications:** 
   - You are **strictly forbidden** from modifying `src/lib/workers/WorkerManager.ts`.
   - The required workers (MuPDF for parsing, WebLLM for chat, OCR) are already initialized and available. You must import and use the existing singleton getters (e.g., `getWebLLM()`, `getMuPDF()`).
2. **STRICT Component Isolation:**
   - All UI components for this plugin MUST be placed inside `src/lib/components/plugins/universal-doc/ui/`.
   - **Do not** add generic components to `src/lib/components/ui/`. If you need a Button, Table, or Card, create a plugin-specific version inside your `universal-doc/ui` directory to prevent CSS/namespace collisions with other active PRs.
3. **State Management:**
   - Use Svelte 5 `$state()` runes exclusively. Do not use Svelte 4 stores (`writable`).

## Technical Requirements

### 1. Routes & Architecture
- **Route:** `src/routes/plugins/universal-doc/+page.svelte`
- **Layout:** Standard two-pane layout:
  - **Left Pane:** Document Viewer (Canvas rendering the PDF via MuPDF, or raw text rendering for text/markdown files).
  - **Right Pane:** Chat Interface (WebLLM interaction).

### 2. Document Ingestion (The Left Pane)
- Support drag-and-drop or file selection for `.pdf`, `.txt`, `.md`, and `.csv`.
- Use the existing `getMuPDF()` worker to parse text out of PDFs.
- For PDFs, provide a simple canvas viewer that displays the current page (using MuPDF rendering). Include basic pagination controls (Next/Prev Page).
- Extract the raw text from the document and store it in a local `$state` variable. This text represents the "context" for the LLM.

### 3. AI Chat Interface (The Right Pane)
- Use the existing `getWebLLM()` worker for chat generation.
- The system prompt for the LLM should be dynamically constructed using the extracted document text:
  `You are a helpful assistant analyzing the following document. Answer the user's questions based strictly on the provided text. \n\n <Document_Text> ${extractedText} </Document_Text>`
- Provide a standard chat UI with user bubbles and AI bubbles.
- Support markdown rendering in the AI's responses.

### 4. UI Polish & Aesthetics
- The workspace must feel extremely premium. Use glassmorphism panels, subtle micro-animations on hover/send, and a sleek dark mode palette (e.g., slate/zinc tones).
- Provide a loading skeleton while MuPDF is parsing the document and while WebLLM is generating a response.

## Acceptance Criteria
- [ ] The `universal-doc` route loads successfully.
- [ ] A user can upload a PDF and view it in the left pane.
- [ ] A user can ask a question about the PDF in the right pane, and the WebLLM engine accurately answers based on the document's content.
- [ ] `WorkerManager.ts` is completely untouched in the diff.
- [ ] All components live exclusively in `src/lib/components/plugins/universal-doc/ui/`.
- [ ] No Svelte 4 `writable` stores are used.
