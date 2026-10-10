# Base44 Dev Environment

## Overview
WorldFace is a Vite + React 18 + TypeScript frontend that connects to a **remote Supabase** instance. There is no local backend or database — all data/auth goes through the Supabase URL configured in `.env`. Schema changes therefore live in `supabase/migrations/` and must be applied to the Supabase project separately (the repo ships no local Supabase stack, and the checked-in `.env` holds only the publishable key).

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Dev server: Vite on port 8080 (mapped to host port 3000)
- Healthcheck: `GET /` via Node `fetch`
- Live reload: enabled (Vite HMR, bind-mounted source)

## Environment
The repo-root `.env` file contains the Supabase config (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`). These are public client-side values (Vite `VITE_`-prefixed env vars are embedded in the frontend bundle). No external secrets are required to boot.

Auth note: the Supabase project has `mailer_autoconfirm: false`, so email sign-ups must confirm their address before they can sign in.

## Pending database step
Two migrations are **not applied to the Supabase project yet** — each screen degrades to a
"not set up yet" notice until its migration is applied. Apply them by pasting the file into
the Supabase SQL editor (or `supabase db push`):

- `supabase/migrations/20261001120000_community_plans.sql` — **Community Planning**
  (`community_plans`, `community_plan_participants`) used by `/c/:slug/plans`.
- `supabase/migrations/20261001130000_company_profiles.sql` — **Company / Business profiles**
  (`companies`, `company_members`, `ai_connections`) used by `/profile/company` and the
  AI Tools tab in the global AI dock.

## Company / business profiles
`/profile/company` (linked from the Profile page via `CompanyProfileEntry`) is the company
workspace. A user may own **several** companies and be a member of others (roles
`owner | admin | member`); `CompanySetupWizard` is the 3-step "template" flow
(pick kind → fill template → choose tools) that creates the company and activates its tools.

The tool catalog lives in `src/lib/companyTools.ts` — a single source of truth for the
Creator / Business / Development / Enterprise categories plus `toolsForKind()` presets.
Add or re-link a tool there, not in the pages.

## AI tools connection (k-agi-core)
`src/hooks/useAiTools.ts` owns the connection to
`https://k-agi-core.lovable.app/callback/worldface`. Two paths are offered everywhere the
`AiToolsConnectPanel` renders (global AI dock "AI Tools" tab, company page, callback page):

- **Redirect + token** — `startAiToolsRedirect()` sends the browser to k-agi-core with
  `app/client/redirect_uri/state`; k-agi-core returns to `/ai-tools/callback`, which
  validates `state` against `sessionStorage` and upserts the token into `ai_connections`.
- **New tab** — `openAiToolsInNewTab()` opens the same URL; no token is returned this way.

## Verification notes
- Type-check with `npx tsc --noEmit`; the app has no local test suite beyond `vitest`.
- Because the Supabase project is remote, a broken migration shows up as an RLS/`PGRST205`
  error at runtime, not at build time — check the browser console on the affected screen.
- The preview origin gate is handled by `allowedHosts: true` in `vite.config.ts`.

## Key files
- `src/integrations/supabase/client.ts` — Supabase client (reads from `import.meta.env`)
- `src/hooks/useAuth.tsx` — Supabase auth context
- `src/integrations/lovable/index.ts` — Lovable Cloud Auth (OAuth providers)
- `vite.config.ts` — Vite config with PWA, `allowedHosts: true` for preview
- `supabase/migrations/` — SQL migrations (applied to the remote Supabase project, not run locally)
- `src/lib/offlineChat.ts` — IndexedDB message cache + outbound queue (offline chat two-way sync)
- `src/hooks/useCommunityPlans.ts` — Community planning data hooks
- `src/pages/CommunityPlans.tsx` + `src/components/community/PlanFormDialog.tsx` — planner UI
- `src/hooks/useCommunityEarnings.ts` — community earnings system (plans record earnings through `record_community_earning`)

## Offline chat behaviour
`Chat.tsx` caches each transcript in IndexedDB and queues messages sent while offline,
flushing them on the browser `online` event. `Messages.tsx` keeps an offline snapshot of the
inbox. Media (image/voice) still needs a connection because the file upload happens first.

## Notes
- The `lovable-tagger` plugin runs in dev mode (component tagger overlay). It is harmless.
- `node_modules` is stored in a Docker named volume (`app_node_modules`) to avoid host/container conflicts.
- Package manager: npm (uses `package-lock.json`).
