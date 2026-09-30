# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Autique mobile-web frontend: a Vite + React 19 + TypeScript SPA, intentionally kept as a plain SPA so it can later be wrapped as a native app with Capacitor. Deployed on Vercel (`vercel.json` rewrites all paths to `index.html` for client-side routing). Code comments and UI copy are in Korean.

## Commands

Package manager is **pnpm** (`packageManager: pnpm@10.28.0`).

```bash
pnpm install
cp .env.example .env.local   # VITE_API_BASE_URL
pnpm dev                     # dev server on :5173 with host: true (reachable from phones on the same Wi-Fi)
pnpm build                   # tsc -b && vite build
pnpm typecheck               # tsc -b only
pnpm lint / pnpm lint:fix
pnpm format / pnpm format:check
pnpm dlx shadcn@latest add <component>   # generates into src/components/ui/
```

There is no test runner configured yet.

## Architecture

- Entry: `src/main.tsx` → `AppProviders` (`src/app/providers.tsx`) wraps `QueryClientProvider` + `RouterProvider`; React Query Devtools render only in dev.
- Routing: `src/app/router.tsx` uses `createBrowserRouter` from `react-router` (v8, data-router style — not `react-router-dom`). All routes are children of `MobileLayout`, which centers content at phone width (`max-w-md`) and applies safe-area padding. Add new pages in `src/pages/` and register them as children there.
- Server state: TanStack Query with a shared client in `src/lib/query-client.ts` (1 min `staleTime`, `retry: 1`, `refetchOnWindowFocus: false` to avoid refetching on mobile app switches). API functions and query hooks go in `src/api/`.
- Client state: Zustand stores in `src/stores/`. Forms: React Hook Form + Zod (`@hookform/resolvers`).
- UI: shadcn/ui (new-york style, Radix via the `radix-ui` package, lucide icons) with Tailwind CSS v4 configured CSS-first in `src/index.css` (no `tailwind.config`). Theme colors are CSS variables on `:root`; dark mode via `.dark` class custom variant.

## Conventions

- Import via the `@/` alias (→ `src/`). Files are kebab-case (`home-page.tsx`); components are named exports (`export function HomePage`).
- ESLint enforces `consistent-type-imports` (use `import type`); unused vars prefixed with `_` are allowed. `react-refresh/only-export-components` is disabled only for `src/components/ui/`.
- Prettier: no semicolons, single quotes, trailing commas, width 100; `prettier-plugin-tailwindcss` sorts classes, including inside `cn()` and `cva()`.
- Use `cn()` from `@/lib/utils` to merge class names.

## Mobile-specific rules

- Use `min-h-dvh` / `h-dvh`, not `h-screen` (iOS address bar).
- Use the custom `pt-safe` / `pb-safe` / `pl-safe` / `pr-safe` utilities (defined in `src/index.css`) for notch/home-indicator insets.
- Inputs are forced to ≥16px font size globally to prevent iOS auto-zoom; don't override below that.
- Touch targets should be at least 44px (`h-11`).

## Workflow

- After making changes, run `pnpm lint && pnpm typecheck && pnpm build` and fix any errors before reporting done.
- Do not start `pnpm dev` yourself; the user keeps the dev server running and checks the result in the browser.
- Ask before adding new dependencies. Prefer what's already installed (shadcn/ui, lucide, TanStack Query, Zustand, RHF + Zod).
- Do not commit or push unless asked. Commit messages follow Conventional Commits in Korean (e.g. `feat: 홈 화면 탭바 추가`).
- Respond to the user in Korean.

## Design system

- Source of truth: `design-system/` (read-only, exported from claude.ai). Start with `design-system/HOW-TO-USE.md`, then `README.md`, `tokens.md`, and the component's `README.md`.
- Use tokens only (Tailwind classes backed by `src/index.css` @theme). No raw hex/px or arbitrary values like `text-[13px]`.
- DS components live in `src/components/ds/`, with props matching `design-system/reference/index.d.ts`. Build screens from them; don't restyle per page.
- `design-system/reference/*` is for reading dimensions only — never import it.
- Light theme only, flat (no shadows/gradients).

## Components

- Customize shadcn/ui components by adding `cva` variants rather than overriding classes at every call site.
- Page-specific components go in `src/pages/<page>/` or next to the page; move to `src/components/` only when reused.
- Every screen needs loading, empty, and error states.

## Data & API

- Read env vars only through `import.meta.env.VITE_*`; never hardcode API URLs.
- Put API calls in `src/api/<domain>.ts`, with query hooks next to them (`useProductsQuery`). Keep query keys in one factory per domain (e.g. `productKeys.all`, `productKeys.detail(id)`).
- Define Zod schemas once and derive types with `z.infer`; reuse the same schema for forms and API response parsing.
- Server data lives in TanStack Query only — don't copy it into Zustand. Zustand is for UI/client state (e.g. auth token, bottom-sheet open state).

## Capacitor compatibility

- Keep it a pure client-side SPA: no SSR-only APIs, no server-dependent features.
- Navigate with React Router (`<Link>`, `useNavigate`), never with `window.location` full reloads.
- Wrap browser-only APIs (clipboard, share, geolocation, storage) in small utilities in `src/lib/` so they can later be swapped for Capacitor plugins.
