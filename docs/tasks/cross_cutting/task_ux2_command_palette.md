# Task UX-2: Command Palette (⌘K)

## Objective
Add a global command palette (triggered by `Ctrl+K` / `⌘K`) that lets power users instantly navigate between workspaces, run queries, open files, and access any feature without touching the mouse — like VS Code's Command Palette or Linear's ⌘K.

## Implementation Details

### 1. Component: `CommandPalette.svelte`
Location: `src/lib/components/CommandPalette.svelte`

- **Trigger:** `Ctrl+K` (or `⌘K` on macOS) opens a centered modal with a search input.
- **Dismiss:** `Escape` or clicking outside closes it.
- **Keyboard navigation:** Arrow keys to move through results, `Enter` to execute.

### 2. Command Registry
Create `src/lib/services/CommandRegistry.ts`:

```typescript
interface Command {
  id: string;
  label: string;
  category: 'navigate' | 'action' | 'recent' | 'query';
  icon?: string;
  shortcut?: string;
  action: () => void;
}
```

#### Built-in Commands:
| Category | Command | Action |
|---|---|---|
| Navigate | "Go to Analytics" | `goto('/analytics')` |
| Navigate | "Go to Docs" | `goto('/docs')` |
| Navigate | "Go to DevTools" | `goto('/devtools')` |
| Navigate | "Go to Media" | `goto('/media')` |
| Navigate | "Go to AI Chat" | `goto('/intelligence/chat')` |
| Action | "Open File" | Trigger File System Access API picker |
| Action | "New SQL Query" | Focus the SQL editor on the Analytics page |
| Action | "Export as HTML Report" | Trigger static report export |
| Action | "Toggle Dark Mode" | Switch theme |
| Recent | *Dynamic* | List recent files from wa-sqlite |
| Query | *Dynamic* | List saved queries from workspace store |

### 3. Fuzzy Search
- Filter commands as the user types using substring matching (case-insensitive).
- Show matching characters highlighted (bold) in the results.
- Results grouped by category with section headers.

### 4. Integration
- Register the keyboard listener in `+layout.svelte` so it works on every page.
- Prevent default browser behavior for `Ctrl+K` (which opens the browser's address bar in some browsers).

## Acceptance Criteria
- [ ] `Ctrl+K` / `⌘K` opens the command palette from any page.
- [ ] Typing filters commands with fuzzy matching.
- [ ] Arrow keys navigate results, Enter executes.
- [ ] Escape or click-outside dismisses.
- [ ] Navigation commands route to the correct workspace.
- [ ] Recent files and saved queries appear dynamically.
- [ ] Visually polished: centered modal with backdrop blur, smooth open/close animation.
