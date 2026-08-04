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

---

## 6. Acceptance Criteria & E2E Test Scenarios

### AC-9.1 Macro-Shell Layout
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User opens the app at `/` | Left sidebar, top-nav, center canvas, and status bar are all visible |
| AC-2 | User clicks "Analytics" in workspace nav | The analytics workspace loads in the center canvas without full-page reload |
| AC-3 | User clicks "DevTools" in workspace nav | DevTools workspace loads correctly |
| AC-4 | User toggles dark/light mode from header | Theme changes immediately across all panels |

### AC-9.2 OPFS File Explorer
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User opens the file explorer sidebar | OPFS file tree renders |
| AC-2 | User uploads a CSV via the explorer | File appears in the tree immediately |
| AC-3 | User clicks a file in the tree | File opens in the corresponding workspace |
| AC-4 | User right-clicks a file and selects "Delete" | File is removed from the tree and OPFS |

### AC-9.3 Command Palette
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User presses `Ctrl+K` from any workspace | Command palette overlay opens |
| AC-2 | User types "analytics" in the palette | Matching commands appear filtered |
| AC-3 | User presses `Escape` | Palette closes without navigation |
| AC-4 | User presses `Enter` on a command | App navigates to the selected workspace |

### AC-9.4 Dynamic Inspector Panel
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User creates a chart in Analytics | Inspector icon (🛠️) is clickable |
| AC-2 | User clicks the inspector icon | Right panel slides open with chart properties |
| AC-3 | User toggles a chart property | Chart updates in real-time |
| AC-4 | User closes the inspector | Right panel collapses |

### AC-9.5 Session Import / Export
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User exports workspace as `.lm` file | File downloads to the OS |
| AC-2 | User reloads page and imports the `.lm` file | Full workspace state is restored (queries, charts, notes) |
