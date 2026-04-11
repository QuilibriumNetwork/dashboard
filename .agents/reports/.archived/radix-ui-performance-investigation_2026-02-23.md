---
type: report
title: "Radix UI Performance Investigation — Dashboard Sluggishness"
ai_generated: true
reviewed_by: null
created: 2026-02-23
updated: 2026-02-23
related_tasks: []
related_docs: []
---

# Radix UI Performance Investigation — Dashboard Sluggishness

> **⚠️ AI-Generated**: May contain errors. Verify before use.

## Executive Summary

The dashboard on the `feat/restyling` branch is extremely slow and unresponsive compared to the live site on `gh-pages`. Tooltips take 5-6 seconds to appear, dropdowns take seconds to open, and there is a general feeling of sluggishness across all interactions. Both Vite dev mode and the production preview build are affected. The live site does not exhibit these issues.

After extensive investigation, the **primary suspect** is the migration from lightweight CSS-based components to Radix UI primitives during the restyling work — specifically the replacement of simple hover-based `<span>` tooltips with Radix `<Tooltip>` backed by portals, state machines, and a global `TooltipProvider`. With 200-400 tooltip instances on the main pages, this creates massive coordination overhead.

## Scope & Methodology

- **Scope**: All code differences between `main` (the branch the live site deploys from) and `feat/restyling`, focused on runtime performance
- **Methodology**:
  - Git diff analysis between branches to identify every changed component
  - Source-level review of all modified files for performance anti-patterns
  - Bundle analysis of production build output
  - Comparison of component implementations between `main` and `feat/restyling`
  - Systematic elimination of hypotheses (CSS, bundle size, polling, re-renders)
- **Tools**: Git, Vite build output, source code analysis
- **Environment**: Windows 10, regular HDD, same browser with React DevTools extension

## Findings

### Finding 1: HoverableCopyText Tooltip Migration (PRIMARY SUSPECT)

- **Impact**: CRITICAL
- **Evidence**:

**On `main` (live site) — `src/components/HoverableCopyText.tsx`:**
```tsx
// Simple conditional <span> — zero library overhead
{isHovered && (
  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-50 shadow-lg">
    {copied ? 'Copied!' : 'Click to copy'}
    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
  </span>
)}
```

**On `feat/restyling` — `src/components/HoverableCopyText.tsx`:**
```tsx
// Radix UI Tooltip with portal, state machine, event coordination
<Tooltip content={copied ? 'Copied!' : 'Click to copy'} delayDuration={0}>
  <span ...>{children}</span>
</Tooltip>
```

**Scale on a single page:**
- Each peer row renders: 1x peerId + 1-3x multiaddrs = 2-4 `HoverableCopyText` instances
- With 50-100 peers visible: **100-400 Radix Tooltip instances**
- Each Tooltip creates: a state machine, event listeners, portal mount point
- All coordinate through a single `<TooltipProvider>` in `App.tsx`
- `delayDuration={0}` forces instant processing with no debounce

**Why this is catastrophic at scale:**
Radix `<Tooltip>` is designed for a handful of tooltips per page. Each instance registers pointer/mouse event listeners, creates a Radix state machine, and uses `<TooltipPortal>` to mount content. The `TooltipProvider` coordinates open/close state across ALL instances. With hundreds of tooltips, every hover event triggers coordination logic across the entire tooltip tree.

### Finding 2: Radix Select Component Migration

- **Impact**: MEDIUM
- **Evidence**:

**On `main`:** Used native `<select>` elements for pagination and filters
**On `feat/restyling`:** Replaced with Radix UI `<Select>` (`src/components/ui/Select.tsx`) using portals and state machines

**Scale:** 4-5 instances per page (pagination select in PeerDirectory, Explorer, Peers, PeerFavorites)

**Why it contributes:** Each Radix `<Select>` creates a portal (`<SelectPrimitive.Portal>`), a content overlay (`<SelectPrimitive.Content>` with `position: "popper"`), and manages focus/keyboard/scroll interactions through a state machine. While 4-5 instances is manageable, the portal + positioning calculation on open adds noticeable delay — matching the user's report that "dropdowns take seconds to open."

**Files:**
- `src/components/ui/Select.tsx` — Radix Select wrapper
- `src/components/PeerDirectory.tsx:143` — pagination select
- `src/Explorer.tsx:1197` — pagination select
- `src/Peers.tsx:553` — pagination select
- `src/PeerFavorites.tsx:608` — pagination select

### Finding 3: Radix Checkbox Component Migration

- **Impact**: LOW (likely NOT a performance issue)
- **Evidence**:

**On `main`:** Used native `<input type="checkbox">` with CSS styling
**On `feat/restyling`:** Replaced with Radix UI `<Checkbox>` (`src/components/ui/Checkbox.tsx`)

**Scale:** ~20 instances, but only rendered inside filter/export modals — not on the main view.

**Files:**
- `src/components/ui/Checkbox.tsx` — Radix Checkbox wrapper
- `src/components/PeerDirectoryFilters.tsx` — filter checkboxes (in expandable panel)
- `src/components/FrameFeedExport.tsx` — export column checkboxes (in modal)
- `src/components/PeerDirectoryExport.tsx` — export column checkboxes (in modal)

### Finding 4: Global TooltipProvider Wrapping Entire App

- **Impact**: HIGH (amplifies Finding 1)
- **Evidence**:

**On `main` — `src/App.tsx`:** No TooltipProvider exists
**On `feat/restyling` — `src/App.tsx:39`:**
```tsx
<ThemeProvider>
  <TooltipProvider delayDuration={300}>   {/* <-- NEW: wraps entire app */}
    <PeerFavoritesProvider>
      ... all routes ...
    </PeerFavoritesProvider>
  </TooltipProvider>
</ThemeProvider>
```

The `TooltipProvider` acts as the coordination hub for ALL Radix tooltip instances. It manages which tooltip is open, handles delay logic, and processes pointer events. With hundreds of tooltip children, this provider becomes a bottleneck.

## Investigated & Ruled Out

### CSS Blur Effects (RULED OUT)
- PageLayout decorative blobs use `blur-3xl`, `blur-[120px]`, `blur-[140px]`
- Navbar uses `backdrop-blur` on sticky element
- Footer has 4 blur decorative elements
- **Ruled out because:** User confirmed the live site has similar effects, and another project uses the same blobs with no issues

### Bundle Size / thirdweb (RULED OUT)
- `thirdweb` is in `package.json` and `manualChunks` config but never imported in source
- Vendor bundle is 178KB — `thirdweb` code is NOT present (0 matches in vendor chunk)
- Vite tree-shaking correctly excluded it despite `manualChunks` declaration
- **Note:** Should still clean up the unused dependency and `manualChunks` entry

### API Polling (RULED OUT as root cause)
- 30-second `setInterval` in `Explorer.tsx:800` fetches latest data
- This exists on BOTH branches — not a regression
- While suboptimal, it doesn't explain the tooltip/dropdown sluggishness

### Frame Hydration Re-renders (RULED OUT as root cause)
- `hydrateFrameFeed()` in Explorer.tsx calls `setFrameFeed()` per batch
- This exists on BOTH branches — not a regression

### CPU / RAM (RULED OUT)
- User confirmed CPU and RAM are fine
- Issue persists in production preview (served from memory, not HDD)

### Hard Disk Speed (RULED OUT)
- User considered this but dismissed it — production preview serves from memory
- The sluggishness is in UI interactions, not file I/O

## Recommendations

### High Priority

1. **Revert HoverableCopyText to CSS-only tooltip**
   - **Why**: Primary performance bottleneck — 200-400 Radix tooltip instances per page
   - **How**: Restore the `main` branch approach (conditional `<span>`) but style it with the new design tokens (tooltip colors, typography)
   - **Files**: `src/components/HoverableCopyText.tsx`

2. **Replace Radix Select with styled native `<select>` or lightweight custom dropdown**
   - **Why**: Portal + state machine overhead causes noticeable delay on open
   - **How**: Use a native `<select>` with CSS custom styling, or build a minimal custom dropdown without portals
   - **Files**: `src/components/ui/Select.tsx`, all consumers

3. **Remove `<TooltipProvider>` from App.tsx** (if no Radix tooltips remain in high-count areas)
   - **Why**: Eliminates the global coordination overhead
   - **How**: Only keep `TooltipProvider` if standalone Radix `<Tooltip>` instances remain (analytics charts, detail pages)
   - **Files**: `src/App.tsx`

### Medium Priority

4. **Keep Radix for low-count components**
   - Checkbox (~20 instances, in modals only) — keep as-is
   - Standalone Tooltip (3-5 instances on analytics/detail pages) — keep as-is
   - Accordion — keep as-is (1-2 instances)

5. **Clean up unused thirdweb dependency**
   - Remove from `package.json`
   - Remove from `manualChunks` in `vite.config.ts`
   - Saves install time and reduces `node_modules` size

### Low Priority

6. **Conditionally disable visualizer plugin**
   - `rollup-plugin-visualizer` runs on every build with `open: true`
   - Move to dev-only or behind an env flag

## Key Principle

> **Radix UI is fine for low-count, high-interaction components** (modals, dialogs, accordions, a handful of tooltips). **It should NOT be used for components instantiated hundreds of times on a single page.** The overhead of state machines, event listeners, portals, and provider coordination compounds quadratically with instance count.

Dashboards that successfully use Radix UI follow this pattern:
- Radix for: modals, dropdowns that appear once, dialogs, accordions
- CSS/lightweight solutions for: table cell tooltips, copy buttons, status indicators — anything repeated per row

## Files Involved

| File | Role | Issue |
|------|------|-------|
| `src/components/HoverableCopyText.tsx` | Tooltip on every copyable text | Radix Tooltip (was CSS span on main) |
| `src/components/ui/Tooltip.tsx` | Radix tooltip wrapper | Portal + state machine per instance |
| `src/components/ui/Select.tsx` | Radix select wrapper | Portal + positioning overhead |
| `src/components/ui/Checkbox.tsx` | Radix checkbox wrapper | Low count, likely fine |
| `src/App.tsx:39` | TooltipProvider wrapping entire app | Coordination hub for all tooltips |
| `src/Explorer.tsx` | Main page, heaviest tooltip usage | 100+ HoverableCopyText instances |
| `src/Peers.tsx` | Peer list page | 50+ HoverableCopyText instances |
| `src/components/PeerDirectory.tsx` | Peer table component | 50+ HoverableCopyText instances |
| `src/components/PeerDirectoryFilters.tsx` | Filters with checkboxes | ~10 Radix Checkbox instances |

## Appendix

### Instance Count Estimates (Explorer Page)

| Component | Instances per row | Typical rows visible | Total instances |
|-----------|-------------------|---------------------|-----------------|
| HoverableCopyText (frame feed) | 2-4 | 20 | 40-80 |
| HoverableCopyText (peer directory) | 2-4 | 50-100 | 100-400 |
| HoverableCopyText (shard summaries) | 1 | 10-20 | 10-20 |
| HoverableCopyText (messages) | 2 | 20 | 40 |
| Select (pagination) | 1-2 | 1 | 1-2 |
| **Total Radix instances** | | | **~190-540** |

### Commit History (Relevant Changes)

- `b55ca95` — refactor: replace custom tooltips with Radix UI and add semantic tooltip tokens
- `4a1c411` — refactor: consolidate raw buttons into Button component
- `26ae375` — style: replace hardcoded styles with semantic design tokens and utility classes

---

_Created: 2026-02-23_
_Report Type: Research/Performance Investigation_
