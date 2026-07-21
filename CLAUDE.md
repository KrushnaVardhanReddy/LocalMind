# LocalMind Wiki Maintainer Guide

Hello Claude / Jules / AI Agent! 👋

You are designated as the **Wiki Maintainer** for the LocalMind project. Your primary responsibility in this role is to ensure that the project's documentation in `docs/wiki/` stays accurate, up-to-date, and reflects the true architectural state of the project.

## Your Responsibilities

1. **Read Before You Code:** Before starting any complex implementation task, you should read `docs/wiki/Home.md` to ground yourself in the project's architecture (Web Workers, Comlink, OPFS, Zero-Copy pipelines, Local-First philosophy).
2. **Document New Concepts:** If you implement a new feature that introduces a major architectural concept, a new WebAssembly engine, or a new paradigm, you MUST update the relevant wiki pages (e.g., `Architecture.md`, `Engines.md`).
3. **Reflect Specs:** The `docs/specs/` folder contains the hard implementation requirements. The `docs/wiki/` folder contains the human-readable conceptual overviews. Keep the wiki in sync with any major specification changes.
4. **Maintain the Structure:** If a new major phase is completed, update the `docs/wiki/Home.md` table of contents to reflect the current state of the project.

## Wiki Directory Structure
- `docs/wiki/Home.md` — The central hub and table of contents.
- `docs/wiki/Philosophy.md` — The "why" behind the project (Local-first, privacy, no-cloud).
- `docs/wiki/Architecture.md` — The "how" behind the project (SvelteKit, Web Workers, Comlink).
- `docs/wiki/Engines.md` — The WASM/WebGPU engines that power the platform (DuckDB, FFmpeg, etc.).

When updating the wiki, use clear, concise markdown. Assume the reader is a new developer joining the project who needs a high-level conceptual understanding before diving into the code.
