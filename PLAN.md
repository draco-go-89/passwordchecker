# Edit Plan — Futuristic Simple Frame + Multi-Page Interactive Password Suite

## Information Gathered
- `index.html` is a Bootstrap-based single-page layout with:
  - Navbar linking to `#analyzer`, `#generator`, `#about` anchors
  - One analyzer card containing:
    - password input + show/hide button
    - Analyze / Generate buttons
    - strength progress bar
    - result panel
- `script.js` currently implements:
  - `checkPassword()` scoring (length, upper, lower, digit, symbol) and updates a simple strength bar + textual feedback
  - `togglePassword()` show/hide
  - `generatePassword()` random generator with a fixed charset + random length 12–17
  - Live update on input events
- `style.css` provides a compact glass/HUD aesthetic, but the “frame” is still essentially the existing analyzer card.

## Plan
### A) Redesign “frame” (CSS)
- Replace/extend the primary card styling into a futuristic “HUD shell”:
  - add layered borders, scanline glow, corner accents, and subtle animated gradients
  - unify spacing/typography via CSS variables
  - make the frame consistent across pages (shared class)

### B) Upgrade JS for richer interactivity across the site
Implement a shared app module (still plain JS):
- **Entropy/estimate panel**: show estimated bits of entropy + crack time tiers.
- **Strength history graph**: store last N analyses and render a mini canvas/inline SVG chart.
- **Rule checklist with toggles**:
  - built-in criteria (length, upper, lower, digit, symbol)
  - user-selectable required rules (checkboxes)
  - optional custom regex rule
- **Generator studio**:
  - sliders for length
  - toggles for character sets
  - “avoid similar” and “no ambiguous chars” options
  - “strength target” button to auto-tune settings
- **Animated copy confirmation**:
  - copy button state + small toast
- **Keyboard shortcuts**:
  - Ctrl/⌘ + Enter = Analyze
  - Ctrl/⌘ + G = Generate
  - Esc = clear result
- **Live quality badges**:
  - show which rules are satisfied as the user types

### C) Multi-page site (3+ pages total)
- Keep the same visual system and share scripts/styles.
- Convert anchor sections into real pages:
  - `index.html` = Analyzer (and quick generate)
  - `generator.html` = Generator studio
  - `history.html` (or `guides.html`) = Strength history + tips
  - Optional: keep `about.html` for project/about.
- Update navbar links to full page navigation.

### D) Implementation approach
- Refactor `script.js` into modular functions but keep it single-file for simplicity.
- Make DOM wiring resilient (query by ids per page).
- Ensure no regressions: existing IDs used by `index.html` keep working.

## Dependent Files to Edit
- `index.html`
- `style.css`
- `script.js`
- Create: `generator.html`
- Create: `history.html`
- (Optional) Create: `about.html`

## Followup Steps
- Open each HTML page in browser and verify:
  - analyzer scoring
  - entropy estimation panel
  - strength history graph updates
  - generator controls generate valid passwords
  - copy toast works
  - keyboard shortcuts work

<ask_followup_question>
If you want Bootstrap removed (or kept), say which. Otherwise I will keep Bootstrap for navbar/layout and focus redesign on CSS+JS.
</ask_followup_question>

