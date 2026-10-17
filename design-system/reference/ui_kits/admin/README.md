# Admin dashboard — UI kit

Hi-fi, click-through recreation of the operations admin shown in the reference screens (uploads/06, 08, 12, 13, 14, 15–17), rebuilt on the design-system components and branded Alice Teixeira.

## Files
- `index.html` — the app. Responsive: desktop ≥1024 (sticky glass sidebar), tablet/mobile drawer, ≤640 stacked mobile layout. Hash routes: `#tasks` (default), `#analytics`, `#batch`, `#shifts`, `#pass`.
- `mobile.html` — the same app in three 390px frames (Tasks, My pass, Analytics).
- `App.jsx` — shell, routing, theme, role switch, modals (Medical record book, Day view, QR).
- `TasksScreen.jsx`, `AnalyticsScreen.jsx`, `BatchScreen.jsx`, `ShiftsScreen.jsx`, `PassScreen.jsx` — one file per page.
- `data.js` — sample copy transcribed from the reference.
- `kit.css` — page-level grids only (KPI rows, two-column rows, hero, flow board, pass card).

## Interactions
- Sidebar tiles/items navigate; groups collapse; « collapses to a rail (desktop) or opens the drawer (mobile).
- Click the user card to switch role: **admin** (I. Vorontsov — Analytics, Tasks, Batch movement) ↔ **employee** (E. Panova — Shift schedule, My pass).
- Sun/moon toggles light/dark (`data-theme` on `<html>`, persisted).
- Filter chips + search filter the tables; chart bars/lines show tooltips on hover.
- Calendar day / task card / "Create task" → Day modal; "Learn more" / Qualification → Medical record modal; "Show QR" / pass QR → QR modal.

## Not recreated
Screens not shown in the reference (Microbiology, Environmental monitoring, Audit log, Training…) render an intentional blank state. The login screen is referenced in the deck ("Login overview") but its design was not included, so it is omitted. PT/EN toggle is cosmetic (no translations).
