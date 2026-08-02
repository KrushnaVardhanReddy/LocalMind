TASK: Phase 6 — Task 14: LocalMind Annotate (Image & Screenshot Annotation)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build a purely offline image annotation tool (rectangles, arrows, text, blur) utilizing HTML5 Canvas or Fabric.js. This will allow users to quickly markup screenshots and redact sensitive areas before sharing them.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-6/01_specialized_plugins_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Native Canvas / Fabric.js: Use purely client-side canvas logic. No heavy WASM required.
- No Network: Images must never be transmitted off-device.
- Fast Render: The UI must be responsive even for 4K images.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/plugins/annotate/` (Target directory for the new route)
- `src/lib/components/ui/` (Reuse existing UI elements like Buttons and Dropzones)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Canvas Layering: Maintain an original image background layer and an interactive vector overlay layer.
- Export: When exporting, flatten the layers into a single `canvas.toDataURL('image/png')` and trigger a local file download.
- Blur/Redaction: Implement a blur filter on a specific rectangular region to easily redact text from screenshots.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/annotate/+page.svelte`
2. NEW: `src/lib/components/plugins/annotate/CanvasEditor.svelte`

Commit: "feat: Phase 6 Task 14 Annotate plugin"
Target branch: feature/task14-annotate
