# Page Background Gradient Blobs (Preserved for Reuse)

Removed from `src/components/PageLayout.tsx` on 2026-02-23.
These were fixed-position, full-viewport blurred blobs that gave the page a soft ambient glow.

## JSX (from PageLayout.tsx and ShardDetail.tsx)

```tsx
<div className="pointer-events-none fixed inset-0 overflow-hidden">
  {/* Light blobs */}
  <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-light-purple/80 blur-3xl dark:hidden" />
  <div className="absolute -right-10 bottom-24 h-72 w-72 rounded-full bg-light-blue/80 blur-3xl dark:hidden" />
  <div className="absolute left-1/3 top-[240px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green blur-[120px] dark:hidden" />
  {/* Dark blobs */}
  <div className="absolute -left-24 top-10 h-64 w-64 rounded-full blur-3xl hidden dark:block bg-[rgba(120,60,200,0.30)]" />
  <div className="absolute -right-32 top-[300px] h-96 w-96 rounded-full blur-[140px] hidden dark:block bg-[rgba(255,96,0,0.25)]" />
  <div className="absolute left-1/3 top-[240px] h-80 w-80 -translate-x-1/2 rounded-full blur-[120px] hidden dark:block bg-[rgba(255,5,109,0.20)]" />
</div>
```


## Description

- **Light mode**: purple, blue, and green soft blobs
- **Dark mode**: purple, orange, and pink soft blobs
- All use large `blur-3xl` / `blur-[120px]` / `blur-[140px]` for a diffused effect
- PageLayout variant used `fixed inset-0`; ShardDetail used `absolute` positioning

---
*Updated: 2026-02-23*
