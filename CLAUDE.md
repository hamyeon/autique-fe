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
- Routing: `src/app/router.tsx` uses `createBrowserRouter` from `react-router` (v8, data-router style — not `react-router-dom`). All routes are children of `MobileLayout`, which centers content at phone width (`max-w-md`). Add new pages in `src/pages/` and register them as children there.
- Every page is wrapped in `Screen` (`src/layouts/screen.tsx`: sticky `header`, body with DS screen spacing, sticky `bottom` for BottomButtonBar/TabBar; it owns safe-area padding). Never put `overflow-hidden`/`overflow-auto` on its ancestors — it breaks sticky.
- Server state: TanStack Query with a shared client in `src/lib/query-client.ts` (1 min `staleTime`, `retry: 1`, `refetchOnWindowFocus: false` to avoid refetching on mobile app switches). API functions and query hooks go in `src/api/`.
- Client state: Zustand stores in `src/stores/`. Forms: React Hook Form + Zod (`@hookform/resolvers`).
- UI: Tailwind CSS v4 configured CSS-first in `src/index.css` (no `tailwind.config`). Design-system tokens are defined in `@theme`; Tailwind's default colors, font sizes and radii are removed. DS components in `src/components/ds/`; shadcn/ui (Radix) is used only as behavior underneath them.

## Conventions

- Import via the `@/` alias (→ `src/`). Files are kebab-case (`home-page.tsx`); components are named exports (`export function HomePage`).
- ESLint enforces `consistent-type-imports` (use `import type`); unused vars prefixed with `_` are allowed. `react-refresh/only-export-components` is disabled for `src/components/ui/` and `src/components/ds/`.
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
- Ask before adding new dependencies. Prefer what's already installed (Radix via shadcn/ui, TanStack Query, Zustand, RHF + Zod). Use the DS `Icon` component, not lucide.
- Do not commit or push unless asked. Commit messages follow Conventional Commits in Korean (e.g. `feat: 홈 화면 탭바 추가`).
- Respond to the user in Korean.

## Design system

- Source of truth: `design-system/` (read-only, exported from claude.ai). Start with `design-system/HOW-TO-USE.md`, then `README.md`, `tokens.md`, and the component's `README.md`, `preview.html`.
- Use tokens only (Tailwind classes backed by `src/index.css` @theme). No raw hex/px or arbitrary values like `text-[13px]`.
- DS components live in `src/components/ds/` and are exported from `src/components/ds/index.ts`. Props match `design-system/reference/index.d.ts`. Build screens from them; don't restyle per page.
- `design-system/reference/*` is for reading dimensions only — never import it.
- When adding shadcn components, use them only for behavior (Radix) and replace their default classes with DS tokens.
- For spacing, prefer semantic tokens (`px-layout-gutter`, `gap-form-field`, `p-card-padding`) and fall back to numeric spacing only when no semantic token fits.
- Light theme only, flat (no shadows/gradients).
- Every new or changed DS component gets a section on the `/design-system` page showing all variants and states, with interactive demos. Finish with a short Korean checklist of what the user should check by eye and by tapping.

## Components

- Page-specific components go in `src/pages/<page>/` or next to the page; move to `src/components/` only when reused.
- Every screen needs loading, empty, and error states.
- Screen states are handled with the shared components in `src/components/feedback/` (`ProductGridSkeleton`/`Skeleton`, `EmptyState`, `ErrorState`); don't build one-off loading/empty/error UIs per screen. Record any state or layout not in Figma in `DESIGN-CHANGES.md`.

## Data & API

- Read env vars only through `import.meta.env.VITE_*`; never hardcode API URLs.
- Source of truth for the API: the Notion spec "API 명세서 - GROWTH" (https://app.notion.com/p/mmaybei/API-GROWTH-3c2dbc84169a80588fa4eed4ce37110c, read via Notion MCP). Use its endpoints, request/response shapes and field names exactly as written — don't rename, re-case or reshape them.
- API types are defined only in `src/api/schemas/` as Zod schemas. Everywhere else, use the types derived there with `z.infer`; never redeclare a response type in screen code. Reuse the same schema for forms and response parsing.
- Anything not in the spec (endpoint, field, query param, enum value, error-code name) must carry a `// [ASSUMED] 이유` comment where it is defined. Mock handlers for assumed endpoints go in `src/mocks/handlers/assumed/`.
- Where the real server behaves differently from the spec (checked with real calls), follow the real server and mark it with `// [MISMATCH] 명세는 xxx` where the schema field is defined; ask the backend to fix the spec (Notion comment).
- Every endpoint is registered once in `src/api/endpoints.ts` (method, spec path with `{param}`, request/response schema, auth, idempotency). API functions, mocks and passthrough all use this registry.
- Call the server only through `request()` in `src/api/client.ts`: it uses `VITE_API_BASE_URL`, sends `Authorization: Bearer` from the auth store (refreshes once on 401), adds `Idempotency-Key` where the spec requires it, times out, unwraps `{ success, data, error }` to `data`, parses it with the schema (logging endpoint + field path on mismatch) and throws `ApiError` (`kind`, `status`, spec `code`) on any failure.
- Put API functions in `src/api/<domain>.ts`, with query hooks next to them (`useAuctionDetailQuery`). Keep query keys in one factory per domain (e.g. `auctionKeys.all`, `auctionKeys.detail(id)`).
- Server data lives in TanStack Query only — don't copy it into Zustand. Zustand is for UI/client state (e.g. auth token in `src/stores/auth-store.ts`, bottom-sheet open state).

### Mocks (MSW, dev only)

- Handlers in `src/mocks/handlers/` (one file per domain, built with `mockEndpoint()`), data in `src/mocks/data/`. Mock responses pass through the same response schema as the real API.
- On/off per "method + path": `src/mocks/config.ts` `passthrough` lists endpoints sent to the real server (e.g. `'POST /api/products'`). **When switching an endpoint to the real API, add it to `passthrough`** — don't delete its mock.
- `VITE_MOCK=off` in `.env.local` turns MSW off entirely. Append `?mock=empty` or `?mock=error` to the page URL to get empty lists or each endpoint's spec error.
- Registration flow scenarios: `?mock=slow` (AI analysis takes 30s), `?mock=analysis-fail` (VISION_FAILED), `?mock=submit-fail` (POST /api/products 500). Only in these scenarios are those passthrough endpoints mocked (`mockIn` in the handler); they stick for the tab until `?mock=off`.
- Whenever any endpoint uses the real server, keep `POST /api/auth/refresh` and `POST /api/auth/logout` in `passthrough` too (the mock only accepts mock tokens).
- The browser can terminate the idle MSW service worker (e.g. while the phone is in the camera app), and the restarted worker forgets which pages to mock and passes everything to the real server. `src/mocks/keep-active.ts` re-registers the page before requests and on app foreground (hooked into `request()` via `setBeforeRequest` in `src/main.tsx`); keep it when changing the MSW setup.

### Real server in development

- The server has no CORS allowance (any request with an `Origin` header gets 403), so dev uses the Vite proxy in `vite.config.ts`: set `API_PROXY_TARGET` in `.env.local` and leave `VITE_API_BASE_URL` empty so requests go to `/api` on the dev server; the proxy strips `Origin`. Deploy and Capacitor builds need backend CORS instead.
- Dev login: `VITE_DEV_ACCESS_TOKEN` / `VITE_DEV_REFRESH_TOKEN` in `.env.local` seed the auth store in dev only (`src/app/dev-auth.ts`, dynamically imported so it never reaches the build); expired access tokens refresh automatically on 401. Never put tokens anywhere except `.env.local` (git-ignored), and don't print them.

## Capacitor compatibility

- Keep it a pure client-side SPA: no SSR-only APIs, no server-dependent features.
- Navigate with React Router (`<Link>`, `useNavigate`), never with `window.location` full reloads.
- Wrap browser-only APIs (clipboard, share, geolocation, storage) in small utilities in `src/lib/` so they can later be swapped for Capacitor plugins.
