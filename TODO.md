# TODO — Futuristic Password Checker Redesign

## Step 1 — Analyze current app
- [x] Read `index.html`, `script.js`, `style.css`
- [x] Identify existing UI structure and JS scoring/generation

## Step 2 — Redesign UI frame (CSS)
- [ ] Replace current card styling with a “futuristic HUD shell”
  - [ ] Scanline/corner/gradient/glow accents
  - [ ] Shared frame classes usable on all pages
  - [ ] Keep CSS compact with token variables

## Step 3 — Expand interactivity (JavaScript)
- [ ] Refactor `script.js` into modular functions (still single-file)
- [ ] Add Entropy/estimate panel
- [ ] Add Strength history graph (canvas/SVG) storing last N results
- [ ] Add Rule checklist toggles + optional custom regex rule
- [ ] Upgrade generator into a multi-control generator (length + char-set toggles)
- [ ] Add “avoid similar / no ambiguous” options
- [ ] Add animated copy confirmation (toast + button state)
- [ ] Add keyboard shortcuts (Ctrl/⌘+Enter analyze, Ctrl/⌘+G generate, Esc clear)
- [ ] Add live quality badges for satisfied rules

## Step 4 — Multi-page site
- [ ] Update `index.html` to be Analyzer page (navbar links)
- [ ] Create `generator.html` (generator studio)
- [ ] Create `history.html` (history + guidance)
- [ ] Share CSS/JS across pages

## Step 5 — Testing
- [ ] Verify pages load and JS binds correctly
- [ ] Sanity-check analyzer, generator, copy, keyboard shortcuts

