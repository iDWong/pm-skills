# KiraKira three-surface system

Use this reference when the task concerns KiraKira visual style beyond glass material.

## 1. Surface routing

| Surface | Root class | Theme / brand | Geometry | Material |
|---|---|---|---|---|
| Mobile App | `.t-app` | Dark `#0A0A0A` + `#D9FF00`; light `#F3F2EE` + ink `#2B2A26` | 6 / 16 / 18 / 24px radii; 44px targets; 16px screen gutter | Glass panels 22px, controls 9–10px |
| Public website | `.t-web` | Same App palette and themes | 1200px shell, 920px narrow reading width, 68px nav, 32px desktop gutter / 20px mobile gutter | Fixed canvas texture; glass sticky navigation and crossed panels |
| Operations console | `.t-admin` | Light `#F9F9F9`, brand blue `#0064FA`, pressed `#004FB3` | 3 / 6 / 12px radii; 32px controls; 232px sidebar; data-dense tables | Opaque SemiDesign surfaces; no blur or ambient texture |

Do not use acid green in the console or SemiDesign blue in App/web.

## 2. Shared semantics and color

App/web use `--brand`, `--brand-muted`, `--brand-line`, `--on-brand` instead of fixed colors.
Dark brand is `#D9FF00` on `#0A0A0A`; light brand is ink `#2B2A26` on `#F3F2EE`.

Console semantic colors are blue / green / orange / red and have separate text tokens:

| Token | Value | Use |
|---|---|---|
| `--brand` | `#0064FA` | primary action, active nav, links |
| `--brand-press` / `--info-text` | `#004FB3` | text on pale blue / pressed state |
| `--ok` / `--ok-text` | `#10B981` / `#0B6B4F` | success status |
| `--warn` / `--warn-text` | `#FC8800` / `#8A5000` | warning status |
| `--danger` / `--danger-text` | `#EF4444` / `#B42318` | risk and destructive actions |

Keep status fill low-alpha and status text dark enough for AA. Do not borrow App neon green for console success states.

## 3. Component contract

### App and web

- **Panel:** cards, grouped lists, sheets, dropdowns, KPI blocks, and toast use the panel glass token pair. App cards usually use 16–24px radii.
- **Control:** inputs, selects, unselected chips, secondary/outline/ghost buttons, and incoming bubbles use control glass. Inputs are at least 44px, with a 3px focus ring via `--brand-muted`.
- **Solid:** primary/danger button, selected chip/radio card, badge, outgoing bubble. Use opaque brand surface and `--on-brand`; no blur.
- **Media:** avatars, posters, photos, and video are content layers; never make them glass.
- **Nested panels:** only outer panel blurs. Inner panel is `--surface-soft` with no backdrop filter.

### Website composition

- Use `.wrap` at 1200px and `.wrap--nar` at 920px. Collapse 3–4 column grids to two columns at 980px and one at 680px.
- Sticky `.wnav` uses 68px height, `--material-nav`, 18px blur, and a subtle divider. Do not let the mobile web nav compete with App chrome.
- Hero title: `clamp(38px,5.6vw,64px)`; section title: `clamp(28px,3.4vw,40px)`. Use fluid type rather than static desktop headings.
- Use `background-attachment:fixed` for the long-page texture. Disable the texture in index/preview walls that have no glass panels.

### Operations console composition

- Use `.adm` grid: 232px sidebar + flexible main column. At ≤900px collapse to a single main column.
- Sidebar links are 44px tall; standard button/input/select are 32px; compact actions 28px; prominent actions 40px.
- Cards and filter strips are opaque white with 12px card radius, 20px internal padding, 1px low-alpha divider, and restrained shadow.
- Table headers are sticky and opaque (`#F3F3F3`), rows use 11–12px cell padding, and tables scroll horizontally through a wrapper rather than shrinking columns below readability.

## 4. Layer and motion contract

Use z-order intentionally: base content `0`, sticky `10`, persistent chrome `16`, floating action `18`, scrim `39`, sheet/modal `40`, toast `60`, prototype/dev tools `80`.

Animate state, not decoration: App/web use 150ms control feedback, 260ms standard transitions, and 420ms large transitions. Respect `prefers-reduced-motion`; disable carousel and panel transitions rather than merely speeding them up.

## 5. Forms and responsive safety

- App: 16px page gutter, 44px minimum controls, 16px control radius, error message immediately below the field, full-width primary continuation action.
- Web: retain 44px touch targets even when controls visually compact; wrap actions before they overflow. Keep text columns `min-width:0` so truncation works.
- Console: 32px density is acceptable because the pointer is assumed; use 44px sidebar row height and never rely on color alone for status.
- Every flex/grid text cell that can overflow must receive `min-width:0`; image/thumb columns are explicit fixed widths.
