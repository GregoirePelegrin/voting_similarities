# Responsive Design — TODOs

The app is currently desktop-first. Below are the gaps identified during the audit, ordered by impact.

---

## High (breaks layout on <768px)

- [ ] **Voter detail header** — `display: "flex"` row with 4 `PercentageGauge` (80px each = 320px) + info card. Add `flexWrap: "wrap"` or switch to Grid.
- [ ] **Group detail header** — flex row with group name, color dot, member count, category filter, toggle buttons. Add `flexWrap: "wrap"`.
- [ ] **CategoryFilter** — `minWidth: 300` overflows most phones. Switch to `minWidth: {xs: "100%", sm: 300}` or similar.
- [ ] **Map page** — no Grid at all. Stack charts vertically on mobile instead of side-by-side.

## Medium (usability)

- [ ] **Responsive typography** — `h4` (~34px) is large on a 360px screen. Add responsive `fontSize` via theme or `sx` on key headings.
- [ ] **Page padding** — `p: 3` (24px) is wasteful on narrow screens. Use `p: {xs: 1.5, md: 3}` on `AnimatedPage`.
- [ ] **DataGrid columns** — list pages mix fixed pixel widths (160px, 180px) with `flex: 1`. On narrow screens, fixed columns force horizontal scroll. Consider hiding low-priority columns at `xs` or using flex-only sizing.
- [ ] **Persistent drawer on desktop** — currently temporary on all screen sizes. Add `useMediaQuery` to switch to persistent variant at `md+`.

---

## Backend / API

- [ ] **Add `/api/` prefix to all backend routes** — currently routes like `/voters`, `/groups`, `/embedddings` are at the root. Adding `/api/` allows the Caddyfile to proxy with a single `reverse_proxy /api/* 127.0.0.1:8000` instead of listing every path. This touches `backend/app/api/routes.py` (prefix the router), `frontend/src/api/client.ts` (update the base URL), and `Caddyfile` (simplify). Requires a `deploy-production.sh` rebuild.

---

## Low (nice-to-have)

- [ ] **PercentageGauge** — fixed `size` (80px default in detail pages). Could accept a responsive size via `sx`.
- [ ] **Scatter plots** — fixed `aspectRatio: 3/2` wastes vertical space on tall phone screens. Consider `aspectRatio: {xs: 1, md: 3/2}` or dynamic height.
- [ ] **Error dialog** — use `fullScreen={{xs: true, sm: false}}` on `ErrorDialog` for better mobile UX.
- [ ] **CategoryHeatmap** — `minWidth: 600` on inner box. Already has `overflowX: "auto"` so it scrolls — acceptable.
- [ ] **Grid spacing** — `spacing={{xs: 1, md: 3}}` instead of uniform `spacing={3}` to reduce gaps on mobile.
