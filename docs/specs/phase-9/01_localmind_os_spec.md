# Phase 9: LocalMind OS Macro-Shell Specification

## 1. Overview
The "LocalMind OS" is a unified macro-shell that houses all independent workspaces (Analytics, DevTools, PDF, etc.). It adopts a modern, VS Code-like layout to ensure the user never feels like they are leaving the application context. 

## 2. Layout Structure
- **Left Sidebar (Explorer):** Houses OPFS file tree, workspace navigation, and plugins.
- **Top Navigation:** Contains global state context and triggers for the Command Palette.
- **Center Canvas:** The active workspace component (e.g., PivotBuilder, Markdown Editor).
- **Right Sidebar (Inspector):** Context-aware panel for properties, filters, and the global AI assistant.
- **Status Bar:** Global worker health, OPFS storage quota, and background tasks.

## 3. Technology Stack & Packages
- **Command Palette:** We will use an existing UI command palette package (e.g., `svelte-command-palette` or `ninja-keys`) to avoid reinventing the wheel and ensure robust fuzzy-search and keyboard accessibility.
- **State Management:** Svelte 5 runes (`$state`) via a global `workspace.store.svelte.ts` to coordinate layouts.
- **File Explorer:** OPFS (Origin Private File System) integration for a native file-tree experience.

## 4. Key Workflows
- **`Ctrl+K` Global Hook:** Should open the command palette from *any* workspace.
- **Contextual Sidebars:** Clicking a node in a Treemap inside the Center Canvas should be able to broadcast an event that the Right Sidebar catches to display detailed properties.

## 5. Migration Strategy
Instead of full-page routes (e.g., `/analytics`), pages will be refactored into workspace components (`<AnalyticsWorkspace />`) that render inside the central canvas of `+layout.svelte`.
