# Project Memory: ai-tutor-nextjs

## Project Snapshot

- Local path: `/Users/kitty/Documents/Codex/2026-06-19/files-mentioned-by-the-user-ai/outputs/ai-tutor-nextjs`.
- This directory currently has no `.git` repository. Check the real repo location before commit/push work.
- Product: iPad-first Next.js Web/PWA prototype for a 3-6 year old "幼小衔接 AI 个性化辅导" app.
- Current maturity: high-fidelity runnable prototype using demo data. It is not yet a production learning product.
- Core value loop: parent setup -> initial assessment -> AI daily plan -> child practice -> parent report -> parent plan intervention.

## Tech Stack

- Next.js App Router, Next.js `16.2.9`.
- React `19.2.4`, TypeScript strict mode.
- Tailwind CSS 4 plus custom global CSS design system in `src/app/globals.css`.
- Vitest + Testing Library for unit/component tests.
- Playwright for E2E tests.
- PWA shell via `src/app/manifest.ts`, `public/sw.js`, and `src/components/client/pwa-register.tsx`.
- Path alias: `@/*` maps to `src/*`.

## Important Docs

- `docs/PRD_V2.md`: product direction, learning system, user flows, V2 gaps.
- `docs/DESIGN.md`: engineering design, target MySQL architecture, API/data flow requirements.
- `docs/TEST_CASES.md`: intended test coverage.
- `docs/TEST_REPORT.md`: last recorded verification status and local run notes.
- `README.md` is still the default create-next-app README and is less useful than the docs above.

## Current App Surface

- `/` redirects to `/learn`.
- Child flow: `/learn`, `/learn/tasks/[taskId]`, `/learn/complete`.
- Parent flow: `/parent/gate`, `/parent/dashboard`, `/parent/knowledge`, `/parent/ai-plan`, `/parent/plan`, `/parent/reports/[date]`.
- Setup/assessment: `/login`, `/onboarding`, `/assessment`.
- Admin demo: `/admin/content`; `/admin` redirects there.
- Current API routes:
  - `POST /api/auth/register` creates a parent account and session.
  - `POST /api/auth/login` creates a session for an existing parent.
  - `POST /api/auth/logout` revokes the current session.
  - `GET /api/auth/me` returns the current parent account.
  - `POST /api/children` creates a child profile for the current parent.
  - `GET /api/plans/today` reads the current user's MySQL-backed daily plan.
  - `POST /api/learning/events` writes learning events through the MySQL repository with `clientEventId` idempotency.
  - `GET /api/reports/[date]` reads the current user's report data.
- `/api/parent/plan-overrides` is still a target architecture API and is not implemented yet.

## Core Code

- `src/lib/learning-engine.ts` contains the current algorithm surface:
  - `updateMastery`
  - `computeReviewPriority`
  - `pickReviewNodes`
  - `pickNewNodes`
  - `generateDailyPlan`
  - `generateReport`
- `src/lib/demo-data.ts` is the active data source for the prototype.
- Demo content is small and centered on:
  - literacy: `木`, `林`, `森`, `休`, `明`
  - pinyin: `l`, `m`
  - math: quantity comparison
- Shared UI primitives live in `src/components/primitives.tsx`.
- Client interaction components live in `src/components/client/*`.

## Product And Design Constraints

- The UI should stay calm, low-stimulation, and iPad-friendly for young children.
- Existing visual direction: paper background, deep navy text, sage green progress, restrained gold accents, 8px card/button radius.
- Use existing primitives and CSS patterns before introducing new abstractions.
- The first screen should remain a usable app experience, not a marketing landing page.
- Preserve the child-safe split between child learning pages and parent-only pages.
- Do not make children see complex algorithm language; AI explanations should be short and concrete in child-facing UI.
- Parent-facing UI should explain why a plan/report exists and what a change will affect.

## Data Direction

- Current implementation is MySQL-backed for auth, child profiles, plans, learning events, mastery, reports, and content packages.
- Target architecture remains server-first with MySQL 8 as the source of truth for child profiles, events, mastery, plans, reports, and content packages.
- Browser should only keep session-level UI state; learning data should be written through APIs.
- `clientEventId` is used for idempotent event writes.
- Service Worker should cache only static shell resources. Do not add offline learning or event replay unless the product direction changes.
- When replacing demo data, update API routes first and keep algorithm functions deterministic and testable.

## Validation Commands

Run from the project root:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Notes:

- `npm test` runs unit/component tests and E2E tests, but does not run lint, typecheck, or build.
- Playwright starts `npm run dev -- --hostname 127.0.0.1 --port 3000` and uses `http://127.0.0.1:3000/learn`.
- Playwright config targets an iPad-landscape-equivalent viewport of `1366x1024` and uses `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

## Common Pitfalls

- Do not add browser-side persistence for learning data; MySQL is the source of truth.
- Do not reintroduce `/api/sync/events`; learning events must go through `POST /api/learning/events`.
- If implementing V2 behavior, first decide whether the work is prototype-only or part of the server-first MySQL direction.
- Keep tests focused around the touched surface: algorithm changes need unit tests, client interactions need component tests, route/user-flow changes need E2E coverage.
- Generated folders and artifacts such as `.next`, `node_modules`, `playwright-report`, and `test-results` should not be edited manually.
