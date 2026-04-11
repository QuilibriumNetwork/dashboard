# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quilibrium Network Explorer Dashboard — a React SPA for browsing frames, peers, provers, and shards on the Quilibrium blockchain. Deployed as static files to GitHub Pages (branch: `gh-pages`).

## Commands

```bash
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run test:ui      # Vitest with browser UI

# Type checking (not in package.json scripts)
npx tsc --noEmit --jsx react-jsx --skipLibCheck
```

## Architecture

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS v3 + React Router v7

### Routing & Pages

All page components live at `src/` root level and are lazy-loaded via `React.lazy` in `src/App.tsx`:

| Route | Component |
|-------|-----------|
| `/` | `Explorer.tsx` — main dashboard (frames + peers overview) |
| `/frames/:frameNumber` | `FrameDetail.tsx` |
| `/frames-analytics` | `FramesAnalytics.tsx` |
| `/peers` | `Peers.tsx` |
| `/peers/:peerId` | `PeerDetail.tsx` |
| `/peer-favorites` | `PeerFavorites.tsx` |
| `/provers/shards/:filter` | `ShardDetail.tsx` |

### State Management

No Redux or external state library. Uses:
- **ThemeContext** (`src/components/helpers/ThemeContext.tsx`) — dark/light mode, persisted to localStorage, class-based Tailwind dark mode
- **PeerFavoritesContext** (`src/components/helpers/PeerFavoritesContext.tsx`) — favorite peers with labels, persisted to localStorage

### API Layer

`src/lib/api.ts` — all API calls go through `explorerApi` object, which wraps `fetch` against `https://explorer-api.quilibrium.com`. Key types (`GlobalFrame`, `PeerRecord`, `ProverRecord`, etc.) are defined and exported from this file.

### Caching

- `src/lib/frameCache.ts` — IndexedDB cache for frame data (max 2000 entries with pruning)
- `src/lib/analyticsCache.ts` — analytics data caching

### Key Utilities

- `src/components/helpers/classnames.ts` — `cn()` function (clsx + tailwind-merge)
- `src/lib/format.ts` — formatting helpers (bytes, timestamps, numbers)
- `src/lib/peers.ts` / `src/lib/provers.ts` — data processing for peers and provers

### Component Organization

- `src/components/ui/` — reusable UI primitives (Button with CVA variants, Modal, Spinner, Icons, Accordion via Radix UI)
- `src/components/` — feature components (navbar, footer, search, peer directory, etc.)
- `src/home/` and `src/build/` — marketing/landing page sections

### Styling

Tailwind v3 with class-based dark mode. Custom color palette defined in `tailwind.config.js` (pink, burgundy, beige, etc.). Custom fonts: Inter (body), AtAero (headings). Path alias `@/` maps to `src/`.

### Reference Folder (`src/_reference/`)

This folder contains obsolete files from the previous website that was mirrored into this repo. They are kept because they may be useful as reference, but they are **not used** in the current application. **Do not search, modify, or refactor files in `src/_reference/`** — they are outside the scope of any restyling, refactoring, or code changes.

### Notable Dependencies

- **Recharts** — charts/analytics
- **Framer Motion + GSAP** — animations
- **@tanstack/react-virtual** — virtualized lists
- **thirdweb** — Web3 wallet integration
- **decimal.js** — precise arithmetic
- **react-helmet-async** — page metadata

---
*Updated: 2026-02-22T23:00*
