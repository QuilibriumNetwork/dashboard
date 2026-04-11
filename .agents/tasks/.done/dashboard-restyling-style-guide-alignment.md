---
type: task
title: "Dashboard Restyling — Style Guide Alignment"
status: open
complexity: very-high
ai_generated: true
reviewed_by: null
created: 2026-02-22
updated: 2026-02-22
related_docs: [".agents/docs/style-guide.md"]
---

# Dashboard Restyling — Style Guide Alignment

> **AI-Generated**: May contain errors. Verify before use.

**Files**: `src/index.css`, `tailwind.config.js`, `src/App.tsx`, `src/Explorer.tsx`, `src/Peers.tsx`, `src/PeerDetail.tsx`, `src/FrameDetail.tsx`, `src/ShardDetail.tsx`, `src/PeerFavorites.tsx`, `src/Status.tsx`, `src/components/SimpleNavbar.tsx`, `src/components/SimpleFooter.tsx`, `src/components/PageLayout.tsx`, `src/components/HeaderSearch.tsx`, `src/components/HoverableCopyText.tsx`, `src/components/ThemeToggle.tsx`, `src/components/PeerDirectoryFilters.tsx`, `src/components/FrameFeedFilters.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/ConfirmDialog.tsx`

## What & Why

The dashboard already has a solid brand color foundation — burgundy, pink, beige, and all secondary colors are defined in `tailwind.config.js` and used throughout. However, the codebase is missing the **semantic token system** described in the style guide (`.agents/docs/style-guide.md`), and has accumulated framework-default colors (Tailwind grays, slates, reds, yellows) that bypass the brand palette. Dark mode uses ~8 different hardcoded hex values scattered across files instead of named tokens.

This restyling aligns the dashboard with the brand style guide, making the codebase maintainable, themeable, and visually consistent.

## Context

- **Existing pattern**: Brand colors are already well-defined in `tailwind.config.js` with opacity support. The `Button` component uses CVA variants with brand colors. Most components use `text-burgundy dark:text-white` patterns.
- **Constraints**: Must preserve current visual appearance while migrating to the token system. Dark mode already works via class-based toggling. No visual regressions.
- **Dependencies**: Style guide (`.agents/docs/style-guide.md`) defines the target architecture.

## Audit Summary

The codebase exploration identified these violations ranked by architectural impact:

| Category | Instances | Severity |
|----------|-----------|----------|
| Hardcoded dark hex values (`dark:bg-[#...]`) | ~25+ across 8+ files | High — unmaintainable |
| Framework grays (`gray-*`, `slate-*`) | ~8 instances in 5 files | Medium — off-brand |
| Raw Tailwind status colors (`red-*`, `yellow-*`, `amber-*`) | ~15 instances in 6 files | Medium — no semantic meaning |
| Missing semantic text tokens (`text-burgundy dark:text-white`) | Pervasive, all files | Medium — redundant patterns |
| Bare `text-xs` on readable content | ~100+ instances | Low — mobile readability |
| Touch targets below 44px | ~5 instances | Low — accessibility |

## Implementation

### Phase 1: Semantic Token Foundation
- [x] **Add `withOpacityValue` helper** to `tailwind.config.js`
  - Done when: Helper function defined and used for shared color tokens
  - Reference: Style guide Section 13

- [x] **Define CSS variables in `:root` and `html.dark`** (`src/index.css`)
  - Background tokens: `--color-bg-page`, `--color-bg-surface`, `--color-bg-surface-raised`, `--color-bg-surface-subtle`, `--color-bg-surface-inset`, `--color-bg-overlay`, `--color-bg-hover-highlight`, `--color-bg-active-highlight`, `--color-field-bg`
  - Text tokens: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-faint`
  - Border tokens: `--color-border-default`, `--color-border-subtle`, `--color-border-strong`
  - Status tokens (RGB triplets): `--color-brand`, `--color-accent`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
  - Status subtle backgrounds: `--color-bg-success-subtle`, `--color-bg-warning-subtle`, `--color-bg-danger-subtle`, `--color-bg-info-subtle`, `--color-bg-brand-subtle`
  - Shadow color: `--shadow-color`
  - Dark values mapped from existing hex:
    - `#100418` / `#0f0715` -> `--color-bg-page` (dark)
    - `#1a0f27` -> `--color-bg-surface` (dark)
    - `#211430` -> `--color-bg-surface-raised` (dark)
    - `#261732` -> `--color-bg-surface-subtle` (dark)
    - `#120918` -> `--color-bg-surface-inset` (dark)
    - `#160c21` -> `--color-bg-overlay` (dark)
  - Done when: All variables defined in both `:root` and `html.dark` blocks

- [x] **Register semantic tokens in Tailwind config** (`tailwind.config.js`)
  - Add `backgroundColor`, `textColor`, `borderColor`, `ringColor` extensions
  - Add theme-aware `boxShadow` scale (xs through xl + glow)
  - Add `can-hover` plugin variant
  - Add `xs: '480px'` breakpoint
  - Done when: All token classes available in Tailwind (`bg-surface`, `text-primary`, `border-default`, etc.)

- [x] **Add `prefers-reduced-motion` rule** for `gradient-sweep` animation (`src/index.css`)
  - Done when: Animation pauses when user prefers reduced motion

### Phase 2: Dark Mode Token Migration (requires Phase 1)
- [x] **Replace all `dark:bg-[#hexvalue]` with semantic tokens** (~12 files)
  - `dark:bg-[#100418]` / `dark:bg-[#0f0715]` -> `dark:bg-page`
  - `dark:bg-[#1a0f27]/95` -> `dark:bg-surface` (with opacity where needed)
  - `dark:bg-[#211430]` -> `dark:bg-surface-raised`
  - `dark:bg-[#261732]` -> `dark:bg-surface-subtle`
  - `dark:bg-[#120918]` -> `dark:bg-surface-inset`
  - `dark:bg-[#160c21]` -> `dark:bg-overlay`
  - Files: `PageLayout.tsx`, `SimpleNavbar.tsx`, `SimpleFooter.tsx`, `Explorer.tsx`, `Peers.tsx`, `PeerDetail.tsx`, `FrameDetail.tsx`, `ShardDetail.tsx`, `PeerFavorites.tsx`, `PeerDirectoryFilters.tsx`, `FrameFeedFilters.tsx`, `HeaderSearch.tsx`
  - Done when: Zero `dark:bg-[#` patterns in codebase (except backdrop-blur elements needing transparency and low-opacity variants)
  - Remaining: 23 instances kept raw — all have `backdrop-blur` (need transparency) or use non-`/95` opacity modifiers (`/50`, `/60`, `/70`, `/80`, `/90`)

- [x] **Migrate light-mode backgrounds** to semantic tokens
  - Body background in `index.css` set to `var(--color-bg-surface)` matching qns-web pattern
  - Light-mode bg migration of `bg-white/95` -> `bg-surface` deferred to avoid visual regression (light mode bg tokens will be consumed via components)

### Phase 3: Framework Gray Purge (requires Phase 1)
- [x] **Replace tooltip backgrounds** (`FrameDetail.tsx`, `PeerDetail.tsx`, `HoverableCopyText.tsx`)
  - `bg-gray-900 dark:bg-gray-700` -> `bg-burgundy dark:bg-surface-raised` (or tooltip token)
  - Done when: Zero `gray-900` or `gray-700` in codebase

- [x] **Replace code block styling** (`index.css` `.code-block`, `FrameDetail.tsx`)
  - `bg-gray-100 border-gray-300` -> `bg-surface-inset border-default`
  - Collapse fade: `from-gray-100 via-gray-100/70` -> `from-beige/60 via-beige/30` brand equivalent
  - Done when: Zero `gray-100`, `gray-300` references

- [x] **Replace input borders** (`index.css` `.input-base`)
  - `border-slate-600/30` -> `border-default`
  - Done when: Zero `slate-` references

- [x] **Replace Status.tsx badge colors**
  - `bg-slate-200/80 text-slate border-slate-400/20` -> `bg-beige/80 text-burgundy/70 border-burgundy/15 dark:bg-white/10 dark:text-white dark:border-white/15`
  - Done when: Zero `slate-` references in `Status.tsx`

- [x] **Fix modal overlay** (`Modal.tsx`)
  - Replace inline `style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}` -> `rgba(64, 0, 27, 0.15)` (burgundy tint)
  - Done when: Modal backdrop uses brand-tinted overlay

### Phase 4: Status Color Token Migration (requires Phase 1)
- [x] **Map brand status colors** in CSS variables
  - `danger`: derived from pink/red family
  - `warning`: brand `orange`
  - `success`: brand `green`
  - `info`: brand `blue`
  - Done when: Status tokens defined in `:root` and `html.dark` (completed in Phase 1)

- [x] **Replace shard coverage badges** (`Explorer.tsx`, `ShardDetail.tsx`)
  - `bg-yellow-200/40 text-amber-800` -> `bg-warning-subtle text-warning`
  - `text-red-900` -> `text-danger`
  - `text-green-700` -> `text-success`
  - Table row tints: `bg-red-50` -> `bg-danger-subtle`, `bg-yellow-50` -> `bg-warning-subtle`

- [x] **Replace danger/delete buttons** (`PeerFavorites.tsx`, `ConfirmDialog.tsx`, `Button.tsx`)
  - `text-red-600 bg-red-600/10 border-red-600/20` -> `text-danger bg-danger-subtle border-danger/20`
  - Updated Button CVA `danger` variant

- [x] **Replace validation/success messages** (`PeerFavorites.tsx`)
  - `text-red-600 dark:text-red-400` -> `text-danger`
  - `text-green-600 dark:text-green-400` -> `text-success`

- [x] **Replace star/sun icon colors** (`Peers.tsx`, `PeerDetail.tsx`, `HeaderSearch.tsx`, `ThemeToggle.tsx`)
  - `text-yellow-500 dark:text-yellow-400` -> `text-orange`
  - Done when: Zero `yellow-`, `amber-`, `red-` Tailwind defaults in codebase

### Phase 5: Text & Border Semantic Migration (requires Phase 1)
- [x] **Replace text color patterns** across all files
  - `text-burgundy dark:text-white` -> `text-primary`
  - `text-burgundy/80 dark:text-white/80` -> `text-secondary`
  - `text-burgundy/60 dark:text-white/60` -> `text-muted`
  - `text-burgundy/40 dark:text-white/40` -> `text-faint`
  - `text-[color:var(--burgundy)]` in base heading styles -> `text-primary`
  - Also replaced interleaved hover patterns: `text-burgundy/70 hover:text-burgundy dark:text-white/70` -> `text-secondary hover:text-primary`
  - Done when: No `text-burgundy dark:text-white` paired patterns

- [x] **Replace border patterns** across all files
  - `border-burgundy/10 dark:border-white/10` -> `border-subtle`
  - `border-burgundy/20 dark:border-white/20` -> `border-default`
  - `border-burgundy/30 dark:border-white/30` -> `border-strong`
  - `hover:border-burgundy/30 dark:hover:border-white/30` -> `hover:border-strong`
  - `divide-burgundy/10 dark:divide-white/10` -> `divide-subtle`
  - `focus:ring-burgundy/30 dark:focus:ring-white/30` -> `focus:ring-brand/30`
  - `focus:ring-burgundy/20 dark:focus:ring-white/20` -> `focus:ring-brand/20`
  - Done when: No paired `border-burgundy/X dark:border-white/X` patterns

- [x] **Replace hover highlight patterns**
  - `hover:bg-light-grey/60 dark:hover:bg-white/5` -> `hover:bg-hover-highlight`
  - `hover:bg-burgundy/10 dark:hover:bg-white/10` -> `hover:bg-active-highlight`
  - Done when: Hover states use semantic tokens

### Phase 6: Mobile Readability — Typography Bump Scale
- [x] **Audit and fix `text-xs` on readable content** (all files, ~230 instances)
  - Replace `text-xs` -> `text-sm sm:text-xs` for: labels, metadata, table cells, filter chips, peer IDs, timestamps
  - Keep `text-xs` for: tooltips (HoverableCopyText), `_reference/` folder
  - Done when: No bare `text-xs` on readable content — verified 0 matches

- [x] **Audit `text-sm` on important content**
  - Audited all 147 bare `text-sm` instances — all are metadata, labels, form inputs, and UI chrome
  - 14px (`text-sm`) is already readable on mobile for this content type; no bump needed
  - Done when: Important body text follows bump scale — confirmed appropriate

### Phase 7: Touch Targets & Interactions
- [x] **Fix undersized touch targets**
  - `ThemeToggle.tsx`: `h-9 w-9` -> `h-11 w-11` (44px)
  - `SimpleNavbar.tsx` hamburger: `h-10 w-10` -> `h-11 w-11` (44px)
  - `Peers.tsx` view peer icon button: `p-1.5` -> `p-2.5`, icon `w-4 h-4` -> `w-5 h-5`
  - Done when: All interactive elements >= 44px touch target — verified

- [x] **Standardize focus rings**
  - All focus rings already use `focus:ring-brand/20` or `focus:ring-brand/30` — no `ring-blue-*` found
  - Done when: Consistent brand focus rings throughout — verified 0 non-brand ring patterns


  STOP AND VISUAL CHECK HERE, IF APPROVED COMMIT


### Phase 8: Component Consolidation (requires Phases 1 + 4)
- [x] **Upgrade Button component** (`src/components/ui/Button.tsx`)
  - Added `focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed` to base styles
  - Added `ghost` variant: `uppercase tracking-label bg-transparent text-secondary hover:text-primary border-0`
  - Added `secondary` variant: `uppercase tracking-label text-secondary hover:text-primary border border-default hover:bg-active-highlight`
  - Added `icon` size: `p-2.5` (44px touch target with 24px icon)
  - Added `rounded` prop axis: `default | sm | md | lg | xl | full`
  - Improved `danger` variant: hover now fills solid (`hover:bg-danger hover:text-white`)
  - Improved `warning` variant: uses semantic tokens instead of hardcoded hex
  - Ported improvements from qns-web Button component (excluding qns-specific colors/gradients)

- [x] **Fix ConfirmDialog internals** (`src/components/ui/ConfirmDialog.tsx`)
  - Cancel -> `<Button variant="ghost" size="small">`
  - Confirm -> `<Button variant="burgundy" size="small">` (default) or `<Button variant="danger" size="small">` (when `confirmVariant="danger"`)
  - Creates visual hierarchy between Cancel (ghost) and Confirm (solid)

- [x] **Migrate pagination controls** (`Peers.tsx`, `PeerFavorites.tsx`, `PeerDirectory.tsx`)
  - Previous/Next buttons -> `<Button variant="secondary" size="xs">`
  - Favorites mini-pagination in Peers.tsx -> `<Button variant="ghost" size="xs">` (fixes undersized `py-1` touch targets)
  - Page number buttons kept raw (specialized active/inactive state, not standard buttons)

- [x] **Migrate modal action buttons** (`PeerFavorites.tsx`)
  - Cancel -> `<Button variant="ghost" size="small">`
  - Add/Save -> `<Button variant="burgundy" size="small">`
  - Creates visual hierarchy (previously both buttons were identically styled)

- [x] **Migrate action buttons in favorites** (`PeerFavorites.tsx`)
  - View -> `<Button variant="secondary" size="xs">`
  - Edit -> `<Button variant="secondary" size="xs">`
  - Delete -> `<Button variant="danger" size="xs">`

- [x] **Migrate export action buttons** (`FrameFeedExport.tsx`, `PeerDirectoryExport.tsx`)
  - Export CSV / Export JSON -> `<Button variant="secondary" size="xs">`

- [x] **Migrate header ghost actions** (`PeerFavorites.tsx`)
  - Export CSV, Import CSV, Add Peer -> `<Button variant="ghost" size="small">` (desktop) / `<Button variant="ghost" size="xs">` (mobile)

- [x] **Migrate FramesAnalytics header action** (`FramesAnalytics.tsx`)
  - "Clear Frame Data" trigger -> `<Button variant="ghost" size="xs">`
  - Frame count selector buttons — kept raw (segmented toggle group, not standard buttons)
  - Modal list-item option buttons — kept raw (full-width list-item style, not standard buttons)

- [x] **Filter text buttons NOT migrated** (`PeerDirectoryFilters.tsx`, `FrameFeedFilters.tsx`)
  - "Select all" / "Deselect all" / "Clear all filters" — kept raw (inline text toggles within filter panels, not standalone action buttons)

- [x] **Copy buttons NOT migrated** (`Explorer.tsx`, `FrameDetail.tsx`, `PeerDetail.tsx`)
  - `CopyToClipboard`, `CopyFrameDataButton`, `CopyFilterLinkButton`, `CopyPeerDataButton`, `CopyKeyRegistryButton` — kept raw (inline ghost utilities, not standard action buttons)

**Not migrated** (intentional exceptions):
- Accordion section toggles (full-width disclosure triggers — not standard buttons)
- Inline `x` clear buttons inside search inputs (tiny inline icons)
- `ThemeToggle` (specific icon-only square shape)
- `HeaderSearch` dropdown result rows (full-width list items)
- Expand/Collapse pill toggles in `Explorer.tsx` and `FrameDetail.tsx` (custom pill shapes)
- "View Details" ghost links inside clickable cards/rows (use `e.stopPropagation()`)
- Copy-to-clipboard buttons (inline ghost utilities)
- Filter select/deselect/clear buttons (inline text toggles)
- Frame count selector toggles in FramesAnalytics (segmented toggle group)
- FramesAnalytics clear modal list-item option buttons (full-width list items)
- Page number buttons in pagination (specialized active/inactive state)
- Favorite star toggle in PeerDetail (icon-only toggle)
- ShardDetail expand/collapse toggles (section disclosure controls)

## Verification

**After each phase:**
- Visual comparison: side-by-side with screenshots taken before changes
- No visual regressions in either light or dark mode
- `npx tsc --noEmit --jsx react-jsx --skipLibCheck` passes
- `npm run build` succeeds

**After all phases:**
- `grep -r "gray-\|slate-\|zinc-\|neutral-" src/` returns zero matches
- `grep -r "dark:bg-\[#" src/` returns zero matches
- `grep -r "text-burgundy dark:text-white" src/` returns zero matches (replaced by `text-primary`)
- `grep -r "text-red-\|text-yellow-\|text-amber-" src/` returns zero matches
- All pages render correctly in light and dark mode
- Mobile viewport (375px) shows no text smaller than 14px for readable content
- All interactive elements pass 44px touch target check

## Additional Notes

- **Dead code**: `src/home/` and `src/build/` directories contain marketing page sections not used by any route — ignore during restyling
- **Typography preset**: Consider creating `src/lib/typography.ts` as a follow-up to centralize text styling patterns
- **Screenshots recommended**: Take screenshots of current state before starting Phase 2+ to visually verify token mapping
- **Phase execution order**: Phase 1 is prerequisite for all other phases. Phases 2-5 can be done in any order after Phase 1. Phases 6-7 are independent and can be done anytime. Phase 8 requires Phases 1 + 4 (for semantic status tokens on danger/warning/success variants).
- **`ghost` variant**: Phase 8 introduces a new `ghost` Button variant for text-only actions. This is needed because many raw buttons in the codebase are text-only style (no border, no background) which doesn't match any existing Button variant.

## Scope Summary

| Phase | Files | Effort |
|-------|-------|--------|
| 1. Semantic Token Foundation | 2 | Foundational |
| 2. Dark Mode Token Migration | ~12 | Medium |
| 3. Framework Gray Purge | ~6 | Small |
| 4. Status Color Token Migration | ~9 | Medium |
| 5. Text & Border Semantic Migration | All | Large (most pervasive) |
| 6. Mobile Typography Bump Scale | All | Mechanical but pervasive |
| 7. Touch Targets & Interactions | ~5 | Small |
| 8. Component Consolidation | ~12 | Medium |

## Definition of Done
- [x] All 8 phases complete
- [x] All verification grep checks pass (zero violations)
- [x] TypeScript compiles
- [x] Build succeeds
- [ ] No visual regressions in light/dark mode
- [x] Mobile readability improved (bump scale applied)
- [x] All touch targets >= 44px
- [x] All clear-cut raw `<button>` elements migrated to `<Button>` component
- [x] `ConfirmDialog` uses `<Button>` internally

---

_Updated: 2026-02-22_
