# Task UX-1: Landing Dashboard & Workspace Routing

## Objective
Replace the monolithic `+page.svelte` (768 lines, all features jammed together) with a clean workspace launcher dashboard and separate routed workspaces. This is the single most impactful UX change — it determines whether a new user stays or leaves within 10 seconds.

## Current Problem
- Everything lives in `/` — file upload, query editor, pivot builder, AI insights, chart viewer, data diffing.
- New users are overwhelmed. There is no visual hierarchy or progressive disclosure.
- There is no way to quickly jump between Analytics, Docs, DevTools, and Media workflows.

## Implementation Details

### 1. Home Dashboard (`/`)
Replace the current `+page.svelte` with a clean **launcher dashboard**:

```
┌─────────────────────────────────────────────────────────┐
│  🧠 LocalMind                           [⌘K] [⚙️]     │
│─────────────────────────────────────────────────────────│
│                                                         │
│  🔒 Zero data leaves your browser                       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ 📊       │  │ 📄       │  │ 🛠️       │  │ 🎬      ││
│  │Analytics │  │  Docs    │  │ DevTools │  │ Media   ││
│  │          │  │          │  │          │  │         ││
│  │ CSV, SQL │  │ PDF, OCR │  │JSON, Git │  │FFmpeg   ││
│  │ Charts   │  │ Search   │  │Logs, HAR │  │Whisper  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│                                                         │
│  Recent Files                                           │
│  ├── sales_2024.csv          (Analytics, 2 min ago)     │
│  ├── contract_v3.pdf         (Docs, 1 hour ago)         │
│  └── server_logs.har         (DevTools, yesterday)      │
│                                                         │
│  Quick Actions                                          │
│  [📂 Open File]  [📋 Paste Data]  [🎯 Try Sample Data] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Key Elements:
- **Workspace cards** — 4 large cards for Analytics, Docs, DevTools, Media. Clicking one navigates to that workspace route.
- **Privacy badge** — "🔒 Zero data leaves your browser" shown prominently on every page load.
- **Recent files** — Query wa-sqlite for recently opened files, show as a list with workspace type and timestamp.
- **Quick actions** — "Open File" (trigger File System Access API), "Paste Data" (clipboard → DuckDB), "Try Sample Data" (load bundled demo CSV).
- **Sample dataset** — Bundle a small `demo_sales.csv` (< 50KB) in `static/` so new users can click "Try Sample Data" and immediately see the pivot builder, charts, and SQL working.

### 2. Workspace Routes
Move each major feature into its own SvelteKit route:

```
src/routes/
├── +page.svelte              ← NEW: Landing dashboard (launcher)
├── analytics/
│   └── +page.svelte          ← Analytics workspace (file upload, query, pivot, charts, dashboard builder)
├── docs/
│   └── +page.svelte          ← Docs workspace (already exists, extend it)
├── devtools/
│   └── +page.svelte          ← DevTools workspace (formatters, git, logs, etc.)
├── media/
│   └── +page.svelte          ← Media workspace (FFmpeg, Whisper, video clipper)
└── intelligence/
    └── chat/+page.svelte     ← Already exists (AI chat)
```

### 3. Shared Navigation Sidebar
Create a persistent sidebar/top-nav component (`WorkspaceNav.svelte`) in `+layout.svelte`:
- Shows current workspace with active indicator.
- Quick-switch between workspaces.
- Collapsible on mobile.
- Shows privacy badge.

### 4. Migrate Existing Code
- Extract Analytics-related code from the current 768-line `+page.svelte` into `/analytics/+page.svelte`.
- Preserve all existing functionality — this is a restructure, not a rewrite.
- The current `+page.svelte` becomes the dashboard launcher.

## Acceptance Criteria
- [ ] Home page (`/`) shows a clean workspace launcher with 4 workspace cards.
- [ ] Clicking a workspace card navigates to its dedicated route.
- [ ] Recent files list shows last 10 opened files from wa-sqlite.
- [ ] "Try Sample Data" loads a bundled demo CSV and opens Analytics.
- [ ] Shared navigation component allows switching between workspaces from any route.
- [ ] Privacy badge ("🔒 Zero data leaves your browser") visible on the dashboard.
- [ ] All existing Analytics functionality preserved in `/analytics`.
- [ ] Mobile-responsive layout (cards stack vertically, sidebar becomes a drawer).
