# Quilibrium Brand Style Guide

> **Purpose**: Brand identity and visual design reference for AI agents and developers building any Quilibrium web property.
> This guide defines the design boundaries — the colors, typography, and principles that make a site feel like Quilibrium. Individual sites have creative freedom within these boundaries.

---

## 1. Color Palette

### Primary Colors

| Name       | Hex       | RGB              | Tailwind Token  | Role |
|------------|-----------|------------------|-----------------|------|
| Burgundy   | `#40001b` | `64, 0, 27`      | `burgundy`      | Primary text color on light backgrounds. The brand's "dark" — used instead of black. Dark-mode backgrounds use much darker shades derived from this hue, not burgundy at full strength. |
| Pink       | `#ff056d` | `255, 5, 109`    | `pink`          | Primary accent. CTAs, links, interactive highlights. |

Burgundy and pink are the core brand pair — the signature Quilibrium identity. The main website and marketing pages should always lead with them. App projects may adopt an additional dominant color (e.g., purple, blue) as their primary interactive/brand color while keeping pink as the accent and burgundy as the text dark.

### Secondary Colors

| Name     | Hex       | Tailwind Token | Role |
|----------|-----------|----------------|------|
| Blue     | `#0287f2` | `blue`         | Category differentiation, informational accents |
| Purple   | `#6330ca` | `purple`       | Category differentiation, visited-link state |
| Green    | `#22a941` | `green`        | Success states, positive indicators |
| Orange   | `#ff6000` | `orange`       | Attention, warnings, energy |

Secondary colors are for differentiation and meaning — feature cards, tags, status indicators. On the main website and marketing pages, they should never replace pink as the primary accent. However, app projects may elevate one secondary color (e.g., purple, blue) as the app's dominant brand/interactive color — in that case, pink typically remains the accent but the secondary color drives the `brand` semantic token.

### Neutrals

| Name       | Hex       | Tailwind Token | Usage |
|------------|-----------|----------------|-------|
| White      | `#ffffff` | `white`        | Backgrounds, text on dark sections |
| Beige      | `#f0e9e4` | `beige`        | Warm backgrounds, section alternation |
| Light Grey | `#f8f8f8` | `light-grey`   | Default page body background |
| Dark Grey  | `#beb8b4` | `dark-grey`    | Muted text (non-token projects), disabled states, subtle borders |

### Light Tints

Each secondary color has a pastel variant for soft backgrounds (tags, badges, card accents):

| Name          | Hex       | Tailwind Token   |
|---------------|-----------|-------------------|
| Light Pink    | `#ffe6f0` | `light-pink`     |
| Light Blue    | `#daeeff` | `light-blue`     |
| Light Purple  | `#e7ddff` | `light-purple`   |
| Light Green   | `#dbf4dc` | `light-green`    |
| Light Orange  | `#ffe8df` | `light-orange`   |

**Pairing pattern**: Light tint background with its full-color foreground (e.g., `light-pink` bg + `pink` text).

### Color Rules

1. **Never use raw black** (`#000000`). Dark text and dark backgrounds should be tinted with the project's dominant brand color. For most Quilibrium sites this means burgundy — but the principle is "brand-tinted darks," not "always burgundy." Dark-mode backgrounds should use a *very dark* shade of the brand color (close to black but perceptibly tinted), not the brand color at full strength.
2. **Avoid default framework grays** (e.g., Tailwind's `gray-100`…`gray-900`, or Bootstrap's gray scale) for visible UI. Use the brand neutrals (`dark-grey`, `beige`, `light-grey`) instead.
3. **Pink is for primary actions**: buttons, links, key highlights. Do not dilute it by using it on decorative or low-priority elements.
4. **One accent color per context**: When using secondary colors for differentiation (e.g., feature cards), assign one color per card. Do not mix multiple secondary colors within a single element.
5. **Contrast pairing**:
   - On light backgrounds (`white`, `beige`, `light-grey`) → use the project's dark text color (burgundy on the main site, or whatever `text-primary` resolves to in token-based projects).
   - On dark backgrounds → use `white` or `pink` for text.

---

## 2. Semantic Color Token System

The raw palette (Section 1) defines what colors exist. The **semantic token system** defines what colors *mean*. This separation is what enables dark mode, alternate themes, and consistent intent across different projects without touching component code.

### Two-Layer Architecture

| Layer | Purpose | Example Tokens | Changes With Theme? |
|-------|---------|----------------|---------------------|
| **Raw Palette** | Fixed brand colors for theme-independent elements (hero gradients, footer, brand marks) | `burgundy`, `pink`, `purple`, `beige` | No |
| **Semantic Tokens** | Role-based colors that swap values between themes | `bg-surface`, `text-primary`, `border-default` | Yes |

**When to use which:**

| Scenario | Use |
|----------|-----|
| Themed component (card, button, form, page layout) | Semantic tokens |
| Brand-fixed element (hero gradient, footer, logo mark) | Raw palette |
| Indicating status (success, error, warning) | Semantic status tokens |
| Gradients on brand sections | Raw palette CSS variables |

**Rule:** Components should use semantic tokens by default. Only use raw palette colors for elements that are intentionally theme-independent.

### Background Tokens

Every project should define these background roles. The specific values are project-dependent — what matters is that the hierarchy is maintained:

| Token | Role | Guidance |
|-------|------|----------|
| `page` | Outermost page background | Warmest/deepest background in the hierarchy |
| `surface` | Content area default | Slightly elevated from page |
| `surface-raised` | Cards, modals, dropdowns | The brightest (light) or most elevated (dark) surface |
| `surface-subtle` | Hover states, secondary areas | Between surface and surface-raised |
| `surface-inset` | Recessed or grouped sections | Same as or slightly deeper than surface |
| `overlay` | Modal/dialog floating surfaces | For floating UI layers (modals, tooltips, popovers) |
| `hover-highlight` | Interactive hover feedback | Brand tint at low opacity (~15-20%) |
| `active-highlight` | Interactive pressed/active feedback | Brand tint at slightly higher opacity (~25-30%) than hover |
| `field` | Form input backgrounds | Applied globally via `@layer base` selectors (see Section 8); typically matches surface-raised |

**Hierarchy principle:** Each elevation step should be visibly distinct from adjacent levels. In light themes this usually means progressively whiter; in dark themes, progressively lighter.

**`overlay` vs. `field`:** Both may share the same underlying value, but use `overlay` for floating surfaces (modals, tooltips, popovers) and `field` for form input backgrounds. They serve different semantic purposes and may diverge as a project evolves.

### Text Tokens (4-Tier Hierarchy)

Text uses a 4-tier opacity/color hierarchy rather than hard-coded palette references:

| Token | Role | Typical Implementation |
|-------|------|------------------------|
| `primary` | Headings, key content | Full-strength text color |
| `secondary` | Body text, subtitles | Primary at ~80% |
| `muted` | Helper text, labels | Primary at ~60% |
| `faint` | Placeholders, disabled text | Primary at ~40% |

**Rule:** Never use raw `black`, framework grays, or direct palette references for themed text. Use the semantic text tier. For example, instead of `text-burgundy/60` for muted text, use `text-muted`.

### Border Tokens (3-Tier)

| Token | Role | Typical Implementation |
|-------|------|------------------------|
| `default` | Standard component borders | Text-primary color at ~15% opacity |
| `subtle` | Dividers, faint separators | Text-primary color at ~7% opacity |
| `strong` | Emphasized or active-state borders | Text-primary color at ~30% opacity |

**Implementation note:** Border colors should be derived from the theme's text primary color at varying opacities, optionally tinted toward the project's dominant hue. This ensures borders feel cohesive with text rather than feeling like a separate system.

### Shared Semantic Colors (Status & Intent)

These tokens communicate meaning regardless of theme. Each project assigns specific RGB values per theme — what this guide mandates is the *role* and *naming*:

| Token | Role | Source Guidance |
|-------|------|-----------------|
| `brand` | Primary brand actions, focus rings, interactive highlights | Derived from the project's dominant brand color |
| `accent` | CTAs, links, key highlights | Typically pink or the project's primary accent |
| `success` | Positive states, confirmations | Green family |
| `warning` | Attention, caution states | Orange/amber family |
| `danger` | Errors, destructive actions | Red family |
| `info` | Informational callouts, neutral notices | Blue family |

**Dark theme adjustment:** Status colors should be brightened or shifted for adequate contrast on dark backgrounds. Don't reuse the exact same values from light mode — test each for readability.

These tokens should work with any Tailwind prefix: `text-success`, `bg-brand`, `border-danger/30`, etc.

### Status Subtle Backgrounds

Each status color should have a handpicked subtle background variant for callouts, badges, and banners:

| Token | Role | Light Guidance | Dark Guidance |
|-------|------|----------------|---------------|
| `bg-success-subtle` | Success callout/badge bg | Pastel green | Status color at ~20% opacity |
| `bg-warning-subtle` | Warning callout/badge bg | Pastel orange | Status color at ~20% opacity |
| `bg-danger-subtle` | Error callout/badge bg | Pastel red/pink | Status color at ~20-28% opacity |
| `bg-info-subtle` | Info callout/badge bg | Pastel blue | Status color at ~20% opacity |
| `bg-brand-subtle` | Brand accent bg | Pastel brand tint | Brand color at ~20-25% opacity |

**Pairing pattern:** Subtle background + full-strength text color of the same status (e.g., `bg-success-subtle` + `text-success`). These pairs should be pre-tested for contrast in both themes.

**Implementation note:** Light mode subtle backgrounds are typically fixed hex pastels. Dark mode subtle backgrounds work best as the full-strength status color at 20-28% opacity over the dark surface — this keeps them harmonious with the dark base.

### Token Architecture Rules

1. **Name tokens by role, not color.** `bg-surface-raised` not `bg-white`. `text-muted` not `text-grey-60`.
2. **Never use framework defaults** (`bg-gray-100`, `text-slate-700`, `border-zinc-200`) — they bypass the token system and break theming.
3. **Keep the raw palette available** for theme-independent zones, but treat it as the exception.
4. **Store tokens as CSS variables** swapped via a class on `<html>` (e.g., Tailwind's `darkMode: "class"`). This is the mechanism — individual values are per-project.
5. **Use RGB triplets for shared colors** (e.g., `--color-brand: R G B`) to enable Tailwind opacity modifiers (`bg-brand/50`). The actual values are project-specific — the brand color might be purple, blue, green, or any dominant app color. Background, text, and border tokens that don't need opacity can use any format.

---

## 3. Gradients

### Brand Gradient

The only approved gradient combination is **burgundy ↔ pink**. This is the signature Quilibrium gradient.

- Use it for hero backgrounds, CTA sections, and premium feature highlights.
- Direction is flexible (diagonal, horizontal, vertical) depending on the design context.
- Multi-stop variants may include a mid-tone like `#6d012e` between burgundy and pink for smoother transitions.

### Section Transition Gradients

To smoothly connect sections with different background colors, use vertical gradients between neutral tones:
- `white → beige` or `beige → white` for soft section transitions.
- These are subtle and only serve to avoid hard color cuts between adjacent sections.

### Animated Gradient Text

A slow-moving gradient shimmer (pink ↔ burgundy) can be applied to hero headlines for visual emphasis. On dark backgrounds, the shimmer uses white ↔ pink instead.

Reserve animated gradient text for primary hero headlines only — never on body text, subheadings, or buttons.

### Gradient Rules

1. **Burgundy-to-pink is the only brand gradient**. Never create gradients combining other brand colors (e.g., no blue-to-green, no orange-to-purple).
2. **Neutral transitions are functional, not decorative**. Use `white ↔ beige` gradients only for section flow, not as a design feature.
3. **Gradient text is a headline-only treatment**. Use sparingly for maximum impact.

---

## 4. Typography

### Font Families

| Font       | Role                          | Weights                              |
|------------|-------------------------------|--------------------------------------|
| **AtAero** | Headings (h1–h6)             | Regular (400), Medium (500), Semibold (600) |
| **Inter**  | Body text, UI, labels          | Regular (400), Medium (500), Bold (700)     |

Both fonts are loaded as WOFF2 for web use.

### Heading Hierarchy

All headings use **AtAero Semibold (600)**. On light backgrounds, the color is burgundy; on projects using the semantic token system, use `text-primary`. Sizes are responsive — larger on desktop, smaller on mobile:

| Level | Mobile       | Tablet (640px+) | Desktop (1024px+) |
|-------|--------------|-----------------|---------------------|
| h1    | 3rem (48px)  | 3.75rem (60px)  | 4.5rem (72px)       |
| h2    | 1.875rem (30px) | 2.25rem (36px) | 3rem (48px)        |
| h3    | 1.5rem (24px) | 1.875rem (30px) | 2.25rem (36px)     |
| h4    | 1.25rem (20px) | 1.5rem (24px)  | 1.875rem (30px)    |
| h5    | 1.125rem (18px) | 1.25rem (20px) | 1.5rem (24px)      |

### Body Text

- Default body: **Inter**, 16px (1rem)
- Bold text: `font-weight: 600`
- Body text color: `text-primary` (semantic token) or burgundy (non-token projects)
- Muted/secondary text: `text-muted` (semantic token) or `dark-grey` (non-token projects)

### Typography Presets

Projects that use Tailwind should define a centralized typography preset object to ensure consistent text styling. This prevents ad-hoc class combinations from drifting across components.

**Reference implementation** (from the QNS Web project — adapt sizes and spacing per project):

```ts
export const typography = {
  title: {
    page:        "mt-6 text-4xl font-semibold leading-tight text-primary sm:text-5xl",
    pageCompact: "text-4xl font-semibold leading-tight text-primary sm:text-5xl",
    section:     "text-2xl font-semibold text-primary",
    card:        "text-2xl font-semibold text-primary break-all leading-tight",
    highlight:   "text-base font-semibold text-primary sm:text-lg",
  },
  subtitle: {
    page: "mt-4 max-w-2xl text-base leading-7 text-secondary sm:text-lg",
    card: "mt-1 text-xs text-muted",
  },
  label: {
    section: "text-xs font-semibold uppercase tracking-[0.3em] text-secondary",
    form:    "block text-sm font-semibold uppercase tracking-[0.25em] text-secondary",
  },
  tag: {
    page: "inline-flex items-center rounded-full border border-subtle bg-brand-subtle px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-secondary",
  },
  body: {
    default: "text-sm text-secondary",
    large:   "text-base text-secondary",
    muted:   "text-sm text-muted",
  },
};
```

**Key patterns:**
- All color references use semantic tokens (`text-primary`, `text-secondary`, `text-muted`)
- Sizes use mobile-first responsive patterns (`text-4xl sm:text-5xl`)
- Structural styles (border, background, padding) can be included for composite presets like `tag.page`

Usage:
```tsx
import { typography } from '@/lib/typography';
<h1 className={typography.title.page}>Welcome</h1>
<p className={typography.body.default}>Description here</p>
```

### Centralizing Repeated Utility Combos

When the same combination of Tailwind classes appears across multiple components or pages — titles, labels, card layouts, status badges, graphic elements — extract it into a shared definition rather than duplicating inline. This prevents drift, makes updates a single-point change, and keeps templates readable.

**Two approaches, both valid:**

| Approach | Best For | Example |
|----------|----------|---------|
| **JS/TS preset objects** (like `typography` above) | Component-level reuse where you compose with `cn()`. Gives TypeScript autocomplete and works well with conditional merging. | `typography.title.section`, `cardStyles.compact` |
| **CSS `@apply` classes** in the global stylesheet | Patterns that span unrelated components, or that include pseudo-states/responsive modifiers that are awkward in a JS string. | `.section-label`, `.stat-value`, `.link-animated` |

**When to extract:**
- The same combo of 3+ utilities appears in 3+ places.
- You've already copy-pasted a class string and had to update it in multiple files.
- The pattern includes hover/focus/responsive modifiers that make the JS string hard to read.

**When NOT to extract:**
- A combo appears in only 1-2 places — just leave it inline.
- The "shared" pattern is actually slightly different each time (different spacing, different color) — forced extraction leads to override clutter.
- The combo is already handled by an existing component (e.g., Button variants, Badge). Use the component, don't recreate it as a class.

**CSS `@apply` example:**
```css
/* In your global CSS file */
@layer components {
  .section-label {
    @apply text-sm font-semibold uppercase tracking-[0.3em] text-secondary sm:text-xs;
  }

  .stat-value {
    @apply font-mono text-2xl font-semibold text-primary sm:text-3xl;
  }
}
```

**Rule:** Prefer JS preset objects for typography and text styling (where the typography preset pattern is already established). Prefer CSS `@apply` for non-text patterns (layout combos, decorative elements, interactive states) and for patterns that include pseudo-classes.

### Link Styling

- Default: pink, no underline
- Hover: animated underline slides in from left (2px, `currentColor`)
- Visited: purple with purple underline on hover (default). If the project uses purple as its brand color, choose a different visited-link color that is visually distinct from unvisited links.

This link pattern is a brand signature — consistent across sites where possible.

### Typography Rules

1. **Headings = AtAero. Body = Inter.** Never cross these. AtAero is not for body text; Inter is not for headings.
2. **Text color** uses semantic tokens (`text-primary`, `text-secondary`, `text-muted`) on projects with the token system. On projects without tokens, use burgundy for primary text and `dark-grey` for muted text.
3. **Never use raw `black`** or framework grays for text.
4. **Inline links use pink with animated underline on hover** — this is a recognizable Quilibrium interaction pattern.

---

## 5. Mobile-First Responsive Design

### Typography Bump Scale

On mobile (< 640px), small text must be one size larger than its desktop equivalent for readability:

| Desktop Target | Mobile Size | Pattern (Tailwind)    |
|----------------|-------------|------------------------|
| 12px (xs)      | 14px (sm)   | `text-sm sm:text-xs`   |
| 14px (sm)      | 16px (base) | `text-base sm:text-sm` |

**Rules**:
- Never use 12px text on mobile for readable content (labels, nav, citations, help text).
- Always write mobile-first breakpoints (base size is mobile, `sm:` overrides for larger).
- Exceptions: decorative badges, character counters, keyboard hints.

### Touch Targets (44px Minimum)

All interactive elements must have a minimum 44×44px touch area on mobile:

| Element          | Minimum Size | How to Achieve |
|------------------|-------------|----------------|
| Buttons          | 44×44px     | Sufficient padding + min-height |
| Icon buttons     | 44×44px     | Padding around the icon (not just the icon itself) |
| Clickable list items | 44px height | Vertical padding of at least 12px |
| Form inputs      | 44px height | Explicit height (e.g., `h-11` / `2.75rem`) |

**Rules**:
- Bare small icons (24px, 32px) must never be the sole click target — wrap with padding.
- Adjacent touch targets need at least 8px gap between them.

### Mobile Keyboard Handling

For inputs near the bottom of the viewport, ensure they remain visible when the mobile keyboard opens:
- Add scroll margin to the input (≈ 64px).
- On focus, scroll the input into view with a 300ms delay (to let the keyboard finish animating).

---

## 6. Spacing & Layout

### Content Width

Maximum content width: **1440px**, centered horizontally.

Horizontal padding scales with viewport:
- Mobile: **16px** (1rem)
- Tablet (640px+): **24px** (1.5rem)
- Desktop (1024px+): **80px** (5rem)

### Breakpoints

| Name | Min Width | Common Use |
|------|-----------|------------|
| xs   | 480px     | Small → regular phone transition |
| sm   | 640px     | Phone → tablet |
| md   | 768px     | Tablet → small laptop |
| lg   | 1024px    | Desktop |
| xl   | 1280px    | Wide desktop |
| 2xl  | 1536px    | Ultra-wide |

The `xs` breakpoint at 480px is a custom addition to Tailwind's defaults — use it for fine-tuning phone layouts.

### Section Spacing

Vertical padding between page sections should be generous and consistent:

| Section Type | Mobile | Tablet | Desktop |
|-------------|--------|--------|---------|
| Standard    | 64px   | 80px   | 96px    |
| Tight       | 40px   | 56px   | 64px    |
| Hero        | 128px top / 64px bottom | 160px / 80px | 192px / 96px |

Hero sections have extra top padding to clear the fixed navbar.

### Spacing Principles

1. **Consistent vertical rhythm** — adjacent sections should use the same or close spacing values. Avoid jarring jumps.
2. **Use gap utilities** on flex/grid containers rather than individual margin on children.
3. **Don't hard-code pixel widths** for responsive containers — use max-width + auto margins + responsive padding.

---

## 7. Page Section Alternation (Marketing Sites)

Marketing pages alternate between light and dark *sections* within the same page. This is distinct from app-level dark mode (Section 8).

### Light Sections (Default)

| Element          | Approach |
|------------------|----------|
| Background       | White, beige, light-grey, or white↔beige gradient |
| Text             | Burgundy (primary), dark-grey (secondary) |
| Accent           | Pink |
| Links            | Pink with animated underline; purple when visited |
| Primary button   | Pink fill |
| Secondary button | Burgundy fill or burgundy outline |
| Cards            | White or beige background, minimal shadow |

### Dark Sections (Burgundy)

Used for heroes, CTA banners, and feature highlights.

| Element          | Approach |
|------------------|----------|
| Background       | Solid burgundy, or burgundy↔pink gradient |
| Text             | White (primary), white at 70% opacity or beige (secondary) |
| Accent           | Pink |
| Links            | Pink, or white with underline |
| Primary button   | Pink fill, or white fill |
| Secondary button | White outline |
| Cards            | White at 10% opacity |

### Section Theme Rules

1. **Never use black text** in either section type. Burgundy on light, white on dark.
2. **Pink works on both** — it has sufficient contrast against both white and burgundy backgrounds.
3. **Minimum white opacity on dark backgrounds**: 70% for secondary text. Don't go below this for readable content.
4. **Cards on dark backgrounds**: Semi-transparent white (`~10% opacity`). Never solid white (too harsh) or semi-transparent black (off-brand).
5. **Theme transitions**: When switching from light to dark sections (or vice versa), use gradient backgrounds for smooth visual flow rather than hard color cuts.

---

## 8. App-Level Dark Mode (Web Apps)

Section 7 covers alternating dark/light *sections within a marketing page*. This section covers a full **app-level dark mode** — where the entire UI switches between light and dark via user preference.

### Principles

1. **Tint your darks, don't go gray.** Dark-mode backgrounds should be *very dark* but carry a subtle hue derived from the project's dominant brand color (e.g., deep purple, deep teal, deep burgundy). The result should be close to black but perceptibly tinted — not the brand color at full strength, and never pure black (`#000000`) or neutral grays. This preserves brand warmth without making backgrounds feel colored rather than dark.
2. **Elevation through lightness.** Higher-elevation surfaces (cards, modals) should be progressively lighter than the base dark background. The user should be able to perceive visual layering: `page` (deepest) → `surface` → `surface-raised` (lightest dark).
3. **Brighten status colors.** Success, warning, danger, and info colors need to be adjusted (brighter, warmer, or shifted) for adequate contrast on dark backgrounds. Never reuse light-mode values without testing.
4. **Subtle backgrounds via opacity.** Status-subtle backgrounds in dark mode should use the status color at low opacity (20-28%) over the dark surface rather than fixed hex values. This keeps them harmonious with whatever the dark base color is.
5. **Tint your borders.** Dark mode borders should use a hue-tinted white (e.g., brand-tinted) at low opacity rather than pure white at low opacity. This avoids a cold, sterile feel.
6. **Adapt shadows.** Shadows in dark mode should use near-black with very low saturation. Dark backgrounds absorb subtle shadows, so slightly higher opacity than light mode is acceptable.
7. **Use a `--shadow-color` CSS variable** that swaps between themes so shadow definitions don't need to be duplicated.

### Theme-Independent Zones

Some UI regions should remain visually fixed regardless of the active theme:
- **Hero sections** with brand gradients (always burgundy-to-pink)
- **Footer** (always dark)
- **Glass/frosted elements** overlaid on gradient backgrounds

Mark these zones so that global theme overrides (e.g., auto-theming of form inputs) are excluded. In CSS this can be done with a class like `theme-independent` and `:not()` selectors.

### Base-Layer Form Input Theming

Rather than applying theme colors to every input element via Tailwind utility classes, use `@layer base` rules to globally theme form inputs. This ensures all inputs are automatically themed without per-component effort:

```css
@layer base {
  input[type="text"]:not(.theme-independent *),
  input[type="number"]:not(.theme-independent *),
  textarea:not(.theme-independent *),
  select:not(.theme-independent *) {
    background-color: var(--color-field-bg);
    color: rgb(var(--color-text-primary));
    border-color: var(--color-border-default);
  }
}
```

The `:not(.theme-independent *)` selector excludes inputs inside theme-independent zones (e.g., hero glass cards) so their explicit Tailwind classes take effect instead.

### Implementation Notes

- Use Tailwind's `darkMode: "class"` strategy (class on `<html>`).
- Store theme preference in `localStorage` and respect `prefers-color-scheme` for system mode.
- CSS variable definitions live in `:root` (light) and `html.dark` (dark) blocks.
- Each project chooses its own dark palette — the style guide does not prescribe specific dark hex values. What it prescribes is the *system*: the token names, the hierarchy, and the principles above.

---

## 9. Visual Style Principles

### Shadows

The brand aesthetic is **flat and minimal**. Shadows should be:
- Extremely subtle — used to create a sense of elevation, not decoration.
- Used sparingly — only on cards or elevated surfaces that need separation from their background.
- Never heavy. Avoid large blur/spread shadows for standard UI.

Projects should define a **shadow scale** (xs through xl) using a theme-aware `--shadow-color` CSS variable. This allows the same shadow definitions to work in both light and dark themes. A `glow` shadow using the brand color at ~40% is useful for interactive focus/hover states.

### Border Radius

- Buttons and inputs: **12px** (or equivalent `rounded-xl`)
- Cards and containers: **12px–16px** (`rounded-xl` to `rounded-2xl`)
- Never use fully rounded (`rounded-full`) on cards or rectangular containers.
- Pills and badges can use higher radius.

### Borders

- Use semantic border tokens (`border-default`, `border-subtle`, `border-strong`) when the project has a token system.
- For projects without tokens: use brand neutrals at low opacity — `dark-grey` at ~30%, or the primary dark color at ~10%.
- Never use raw black, framework grays, or high-contrast borders unless there's a specific accessibility need.

### Transitions & Animation

Standard transition for interactive elements:
- **Duration**: 300ms
- **Easing**: `cubic-bezier(0, 0, 0.5, 1)` — a gentle ease-out
- Apply to color properties by default. Use `transition-all` only when multiple properties change simultaneously (e.g., background + border + text color on buttons).

Entrance/reveal animations for scroll-triggered content:
- **Pattern**: Fade-in with a subtle upward slide (`opacity: 0 → 1`, `translateY(1rem) → 0`)
- **Duration**: 500ms with staggered delays (150ms between siblings)
- **Trigger**: Use `IntersectionObserver` — don't animate on initial page load above the fold

The `can-hover` variant (see Section 11) should be used for hover-only effects that shouldn't trigger on touch devices.

**Reduced motion:** All animations (entrance reveals, gradient shimmer, spinners) must respect `prefers-reduced-motion: reduce`. At minimum, wrap keyframe animations and transition-heavy effects in a media query check:

```css
@media (prefers-reduced-motion: reduce) {
  .gradient-sweep { animation: none; }
  /* Reduce or disable entrance animations */
}
```

For React projects, consider an AnimationContext that lets users toggle animations via a UI control (e.g., a footer toggle).

### Button Interaction Pattern

Each project defines its own Button component with variant-specific hover and active states. The style guide does not prescribe specific hover mechanics (e.g., "solid must swap to outline") — those vary by variant, context, and project.

**What this guide does require:**
- **Every button variant must have a visible hover state.** The user should always get feedback that a button is interactive.
- **Every button variant must have a visible active/pressed state** that is distinct from hover — slightly deeper or more saturated. Use the `active-highlight` token where appropriate.
- **Active feedback should be immediate** — no transition delay on press (transitions are for hover entry/exit, not for the pressed state).
- **Disabled buttons** should look visibly muted (`text-faint`, reduced opacity) and suppress hover/active styles.

### Focus States

- Focus rings should use the `brand` semantic token (e.g., `ring-brand/20`) or a brand accent tint rather than the browser default or framework default blue.
- Prefer `focus-visible` over `focus` to avoid showing focus rings on mouse clicks while preserving them for keyboard navigation.
- This ensures focus indicators are on-brand while remaining visible.

---

## 10. Loading, Empty & Error States

### Loading States (Two Tiers)

| Tier | When to Use | Visual Pattern |
|------|-------------|----------------|
| **Inline spinner** | Data loading within a visible page (fetching list items, submitting a form) | Small rotating icon in the `brand` color, sized to match surrounding text (16px–24px) |
| **Full-page spinner** | Route-level loading, initial app load, lazy-loaded page chunks | Centered branded illustration or logo mark with a gentle pulse animation |

**Rules:**
- Buttons should show an inline spinner and disable interaction during submission — never leave a button looking clickable while processing.
- Use `<Suspense>` fallbacks with the full-page spinner for lazy-loaded routes.

### Skeleton Loaders

For content areas where the layout is known but data is loading:
- Use `bg-surface-subtle` as the skeleton base color.
- Apply a shimmer/pulse animation using `bg-brand-subtle` at ~30% opacity.
- Match the skeleton shape to the expected content (text lines, card rectangles, avatar circles).
- Skeleton loaders are preferred over spinners when the page structure is predictable — they reduce perceived load time.

### Empty States

When a page or section has no data to display:

| Element | Style |
|---------|-------|
| Icon | From the project icon set, in `text-muted`, sized 40–48px |
| Title | `text-primary`, semibold, short (e.g., "No names listed") |
| Description | `text-muted`, 1-2 sentences explaining why and what to do |
| CTA (optional) | Primary or outline button to guide the user to the next action |

**Rule:** Never show a blank page. Every empty state should communicate what would normally appear here and how to populate it.

### Page-Level Error States

For route-level or critical errors:
- Same visual structure as empty states (icon + title + description + optional CTA).
- Icon should carry `text-danger` color.
- Offer a retry action or a link back to a known-good page.
- Avoid exposing raw error messages or stack traces — show a user-friendly message with an error code for support reference if needed.

---

## 11. Accessibility

### Color Contrast

- All text/background combinations must meet **WCAG AA** minimum contrast ratios (4.5:1 for body text, 3:1 for large text and UI components).
- The semantic token system should be designed with this in mind — test every `text-*` token against its expected `bg-*` surface in both light and dark themes.
- Status colors (`success`, `warning`, `danger`, `info`) must be tested for contrast when used as text on both their subtle background and on the default surface.

### Focus & Keyboard Navigation

- All interactive elements must be reachable via `Tab` and activatable via `Enter` or `Space`.
- Use `focus-visible` for ring styles to avoid showing focus indicators on mouse clicks.
- **Modals/dialogs**: Trap focus inside the modal while open. Close with `Escape`. Return focus to the trigger element on close.
- **Dropdowns/menus**: `Enter`/`Space` to open, `Escape` to close, arrow keys to navigate options.
- **Segmented toggles**: Use `role="group"` on the container and `aria-pressed` on each option.

### ARIA Patterns

| Component | Required ARIA |
|-----------|---------------|
| Modal | `role="dialog"`, `aria-modal="true"`, `aria-label` or `aria-labelledby` |
| Close button | `aria-label="Close"` |
| Decorative SVGs/icons | `aria-hidden="true"` |
| Navigation | `<nav>` landmark element |
| Mobile menu toggle | `aria-label="Toggle menu"`, `aria-expanded` |
| Pagination | `aria-current="page"` on active page, `aria-label` on all buttons |
| Filter dropdowns | `aria-expanded`, `aria-haspopup`, `aria-label` |
| Status badges | Visually hidden prefix for screen readers (e.g., `<span class="sr-only">Status:</span>`) |

### Semantic HTML

- Use proper heading hierarchy (`h1` → `h2` → `h3` etc.) — never skip levels.
- Use `<nav>`, `<main>`, `<footer>` landmark elements.
- Use `<button>` for interactive controls, not `<div>` or `<span>` with click handlers.
- Use `<a>` for navigation, `<button>` for actions.

---

## 12. Quick Reference: Do / Don't

### General

| Do | Don't |
|----|-------|
| Tint dark text/backgrounds with the brand color (e.g., burgundy for most Quilibrium sites) | Use raw black (#000000) or framework dark grays |
| Use brand neutrals (beige, light-grey, dark-grey) | Use framework gray scales (gray-100, slate-200, etc.) |
| Use pink for primary CTAs and links | Use pink for decoration or secondary elements |
| Use minimal, subtle shadows | Use heavy drop shadows (shadow-lg, shadow-xl) |
| Use 12px border radius for buttons/cards | Use `rounded-full` on rectangular containers |
| Use AtAero for headings, Inter for body | Mix font roles (AtAero in body, Inter in headings) |
| Size up small text on mobile (bump scale) | Use 12px text on mobile for readable content |
| Ensure 44px touch targets on mobile | Leave small icons as bare click targets |
| Respect `prefers-reduced-motion` | Assume all users want animations |
| Use `focus-visible` for focus rings | Use browser-default blue focus rings |
| Provide empty states with guidance | Show blank pages when there's no data |

### Semantic Tokens (for projects using the token system)

| Do | Don't |
|----|-------|
| `bg-surface-raised` for cards | `bg-white` or `bg-gray-50` |
| `bg-surface` for content areas | `bg-gray-100` or hard-coded hex |
| `text-primary` for headings | `text-black` or `text-gray-900` |
| `text-secondary` for body text | `text-burgundy/80` or `text-gray-700` |
| `text-muted` for helper text | `text-gray-500` or `text-dark-grey` |
| `text-faint` for placeholders | `text-gray-400` or `placeholder-gray-400` |
| `border` (default) for component borders | `border-gray-200` or `border-black/10` |
| `border-subtle` for dividers | `border-gray-100` |
| `text-success` + `bg-success-subtle` | `text-green-600` + `bg-green-100` |
| `text-danger` + `bg-danger-subtle` | `text-red-500` + `bg-red-100` |
| `ring-brand` for focus rings | `ring-blue-500` |
| `bg-hover-highlight` for hover states | Hard-coded `hover:bg-gray-50` |
| `bg-active-highlight` for pressed states | No visual feedback on press |

---

## 13. Tailwind Configuration Reference

> **Version note:** This configuration is written for **Tailwind CSS v3.x**. Tailwind v4 uses a CSS-first configuration model — the `tailwind.config.js` file is replaced by CSS-based config, and the `withOpacityValue` helper is unnecessary (v4 handles CSS variable colors natively). Adapt these patterns accordingly if starting a new project on v4.

### Raw Palette Colors

When setting up Tailwind for a new Quilibrium project, add these brand colors to your config:

```js
// tailwind.config.js — colors extend block
colors: {
  burgundy: "rgb(64 0 27 / <alpha-value>)",
  pink: "rgb(255 5 109 / <alpha-value>)",
  beige: "rgb(240 233 228 / <alpha-value>)",
  "dark-grey": "rgb(190 184 180 / <alpha-value>)",
  "light-grey": "rgb(248 248 248 / <alpha-value>)",
  green: "rgb(34 169 65 / <alpha-value>)",
  blue: "rgb(2 135 242 / <alpha-value>)",
  orange: "rgb(255 96 0 / <alpha-value>)",
  purple: "rgb(99 48 202 / <alpha-value>)",
  "light-pink": "rgb(255 230 240 / <alpha-value>)",
  "light-green": "rgb(219 244 220 / <alpha-value>)",
  "light-blue": "rgb(218 238 255 / <alpha-value>)",
  "light-purple": "rgb(231 221 255 / <alpha-value>)",
  "light-orange": "rgb(255 232 223 / <alpha-value>)",
}
```

The `<alpha-value>` syntax enables opacity modifiers (e.g., `bg-burgundy/80`).

### Semantic Token Setup

For projects that implement the semantic token system (Section 2), add these to the Tailwind config. The CSS variable values are project-specific — this defines the *structure*:

```js
// Helper: reads an RGB triplet CSS variable and enables Tailwind opacity modifiers
// (Tailwind v3 only — not needed in v4)
function withOpacityValue(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(${variable}))`
      : `rgb(var(${variable}) / ${opacityValue})`;
}

module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Raw palette (always available, theme-independent) ...
        // ... (see above)

        // Semantic shared colors (theme-aware, opacity-compatible)
        brand:   withOpacityValue("--color-brand"),
        accent:  withOpacityValue("--color-accent"),
        success: withOpacityValue("--color-success"),
        warning: withOpacityValue("--color-warning"),
        danger:  withOpacityValue("--color-danger"),
        info:    withOpacityValue("--color-info"),
      },

      // Background-only tokens
      backgroundColor: {
        page:               "var(--color-bg-page)",
        surface:            "var(--color-bg-surface)",
        "surface-raised":   "var(--color-bg-surface-raised)",
        "surface-subtle":   "var(--color-bg-surface-subtle)",
        "surface-inset":    "var(--color-bg-surface-inset)",
        overlay:            "var(--color-bg-overlay)",
        field:              "var(--color-field-bg)",
        "hover-highlight":  "var(--color-bg-hover-highlight)",
        "active-highlight": "var(--color-bg-active-highlight)",
        // Status subtle backgrounds
        "success-subtle": "var(--color-bg-success-subtle)",
        "warning-subtle": "var(--color-bg-warning-subtle)",
        "danger-subtle":  "var(--color-bg-danger-subtle)",
        "info-subtle":    "var(--color-bg-info-subtle)",
        "brand-subtle":   "var(--color-bg-brand-subtle)",
      },

      // Text-only tokens
      textColor: {
        primary:   withOpacityValue("--color-text-primary"),
        secondary: "var(--color-text-secondary)",
        muted:     "var(--color-text-muted)",
        faint:     "var(--color-text-faint)",
      },

      // Border-only tokens
      borderColor: {
        DEFAULT: "var(--color-border-default)",
        subtle:  "var(--color-border-subtle)",
        strong:  "var(--color-border-strong)",
      },

      // Focus ring
      ringColor: {
        brand: withOpacityValue("--color-brand"),
      },

      // Theme-aware shadow scale
      boxShadow: {
        xs:   "0 8px 30px -12px rgba(var(--shadow-color), 0.12)",
        sm:   "0 8px 30px -12px rgba(var(--shadow-color), 0.25)",
        md:   "0 20px 50px -20px rgba(var(--shadow-color), 0.15)",
        lg:   "0 25px 60px -20px rgba(var(--shadow-color), 0.2)",
        xl:   "0 35px 80px -48px rgba(var(--shadow-color), 0.28)",
        glow: "0 0 30px -5px rgb(var(--color-brand) / 0.4)",
      },
    },
  },
};
```

### CSS Variable Template

Define the semantic token values in your global CSS. Each project fills in its own values — this shows the structure and variable names:

```css
:root {
  /* Raw palette (only what's consumed by CSS rules like gradients) */
  --pink: #ff056d;
  --burgundy: #40001b;
  /* ... other raw vars as needed ... */

  /* Backgrounds */
  --color-bg-page:             /* project light page bg */;
  --color-bg-surface:          /* project light surface */;
  --color-bg-surface-raised:   /* project light raised surface */;
  --color-bg-surface-subtle:   /* project light subtle surface */;
  --color-bg-surface-inset:    /* project light inset surface */;
  --color-bg-overlay:          /* project light overlay (floating surfaces) */;
  --color-bg-hover-highlight:  /* brand tint at ~20% */;
  --color-bg-active-highlight: /* brand tint at ~25-30% */;
  --color-field-bg:            /* project light input bg (form fields) */;

  /* Text — space-separated RGB triplet for primary, rgba for others */
  --color-text-primary:   /* R G B (space-separated) — project-specific dark text color */;
  --color-text-secondary: /* rgba(R, G, B, 0.8) */;
  --color-text-muted:     /* rgba(R, G, B, 0.6) */;
  --color-text-faint:     /* rgba(R, G, B, 0.4) */;

  /* Borders */
  --color-border-default: /* rgba(text-primary, 0.15) */;
  --color-border-subtle:  /* rgba(text-primary, 0.07) */;
  --color-border-strong:  /* rgba(text-primary, 0.3)  */;

  /* Shared colors — space-separated RGB triplets for Tailwind opacity support */
  --color-brand:   /* R G B — project-specific (could be purple, blue, green, etc.) */;
  --color-accent:  /* R G B */;
  --color-success: /* R G B */;
  --color-warning: /* R G B */;
  --color-danger:  /* R G B */;
  --color-info:    /* R G B */;

  /* Status subtle backgrounds */
  --color-bg-success-subtle: /* pastel green */;
  --color-bg-warning-subtle: /* pastel orange */;
  --color-bg-danger-subtle:  /* pastel red/pink */;
  --color-bg-info-subtle:    /* pastel blue */;
  --color-bg-brand-subtle:   /* pastel brand */;

  /* Shadow base color — COMMA-separated RGB, used with rgba() */
  /* This uses commas (not spaces) because the shadow scale uses rgba(var(), opacity) syntax */
  --shadow-color: /* R, G, B — derived from the project's dominant dark color */;
}

html.dark {
  /* Override all the above with dark-theme values */
  /* See Section 8 for dark theme principles */
}
```

**Format note:** Two different RGB variable formats are used intentionally:
- **Space-separated** (e.g., `64 0 27`) — for shared colors and text-primary. Used with `rgb(var() / opacity)` syntax, which is how Tailwind v3 handles opacity modifiers.
- **Comma-separated** (e.g., `64, 0, 27`) — for shadow color only. Used with `rgba(var(), opacity)` syntax in the shadow scale definitions.

### Other Config

Add the custom `xs` breakpoint:
```js
screens: {
  'xs': '480px',
}
```

Custom hover variant for pointer devices — use this to wrap hover effects that shouldn't trigger on touch devices (tooltips, hover cards, subtle color shifts):
```js
plugins: [
  function ({ addVariant }) {
    addVariant("can-hover", "@media (hover: hover) and (pointer: fine)");
  },
],
```

---

*Updated: 2026-02-22T17:30*
