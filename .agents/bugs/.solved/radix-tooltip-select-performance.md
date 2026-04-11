---
type: bug
title: "Radix UI tooltips and selects cause severe UI sluggishness"
status: done
priority: critical
ai_generated: true
reviewed_by: null
created: 2026-02-23
updated: 2026-02-23
---

# Radix UI tooltips and selects cause severe UI sluggishness

> **⚠️ AI-Generated**: May contain errors. Verify before use.

## Symptoms

- Tooltips take 5-6 seconds to appear on hover
- Select dropdowns take multiple seconds to open
- General feeling of sluggishness across all page interactions
- Affects both Vite dev mode and production preview builds
- Live site (deployed from `main` branch) does not exhibit the issue

## Root Cause

Commit `b55ca95` replaced lightweight CSS-positioned tooltips with Radix UI `<Tooltip>` backed by portals, state machines, and a global `<TooltipProvider>`. The `HoverableCopyText` component wraps every copyable text cell in the dashboard — peer IDs, multiaddrs, shard filters, message data — resulting in **200-400 Radix Tooltip instances** on the Explorer and Peers pages.

Each Radix `<Tooltip>` instance:
- Registers pointer/mouse event listeners
- Creates an internal state machine
- Mounts content via `<TooltipPortal>`
- Coordinates open/close state through the global `<TooltipProvider>`

With hundreds of instances, every hover event triggers coordination logic across the entire tooltip tree, causing multi-second delays.

Commit `f4d06a8` similarly replaced native `<select>` elements with Radix UI `<Select>`, adding portal and state machine overhead to dropdown interactions.

## Solution

- **HoverableCopyText** (`src/components/HoverableCopyText.tsx`): Reverted to a conditionally rendered `<span>` with absolute positioning (matching the `main` branch approach), styled with the existing `bg-tooltip` and `--color-text-tooltip` design tokens.
- **Select** (`src/components/ui/Select.tsx`): Replaced Radix `<Select>` with a lightweight custom dropdown — a simple `<div>` with click-to-toggle visibility, click-outside-to-close, and Escape key handling. Styled via centralised `.custom-select-trigger`, `.custom-select-dropdown`, and `.custom-select-option` classes in `src/index.css`.
- **Removed** `@radix-ui/react-select` from `package.json` (added by us in this branch).
- **Kept** Radix `<Tooltip>` for the ~7 standalone uses in `PeerDetail.tsx`, `FramesAnalytics.tsx`, and `Peers.tsx` where instance count is low.
- **Kept** `<TooltipProvider>` in `App.tsx` — now only coordinates a handful of instances.

Key commit: `f5701ca`

## Prevention

- Radix UI primitives are designed for low-count, high-interaction components (modals, dialogs, accordions). They should not be used for components instantiated hundreds of times per page.
- For high-count elements (table cells, list items, repeated badges), use CSS-only or minimal JS solutions — conditional rendering of positioned spans, native elements with CSS styling.
- When adding a new UI library component, check the instance count on the heaviest page before committing.

---

_Resolved: 2026-02-23_
