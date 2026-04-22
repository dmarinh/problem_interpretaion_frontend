# Problem Translator — Frontend

Project guide for Claude Code. Read this on every session start.

---

## What this project is

A single-page React application that demonstrates the Problem Translation Module: natural-language food safety queries translated into auditable, scientifically grounded predictions from ComBase predictive microbiology models.

Two purposes simultaneously: an internal demo, and the architecFtural foundation for a future production app. Decisions favour the long-term goal where the two conflict.

The backend is a separate FastAPI project running locally on `http://localhost:8000`. This repo is **frontend only**.

## Authoritative documents

Two documents define this project. Read them before starting work.

- **`specs/frontend-spec.md`** — the full specification. ~2,750 lines, 12 sections. The source of truth for what to build and how it should look and behave.
- **`specs/checkpoint-contract.md`** — the implementation pacing contract. Defines three checkpoints where work must stop for human review.

If anything in `CLAUDE.md` conflicts with the spec, the spec wins. If the spec is silent on something the contract addresses, the contract wins.

Reference both with `@specs/frontend-spec.md` and `@specs/checkpoint-contract.md` when starting a session.

## Lessons learned — read every session

A third file, **`specs/lessons.md`**, accumulates concrete lessons from past sessions: mistakes made, dead-ends explored, surprises discovered, patterns that worked or failed. **Read it at the start of every session** to avoid repeating work or repeating mistakes. **Append to it whenever a lesson is learned** — see "Maintaining `lessons.md`" below.

Reference it with `@specs/lessons.md` alongside the spec and contract.

## Working principles

These apply on every task in this project.

1. **The spec is the source of truth.** When the spec is clear, follow it exactly. When it is ambiguous, stop and ask rather than guess.
2. **Stop at every checkpoint.** Three explicit checkpoints in `specs/checkpoint-contract.md`. Do not skip, combine, or anticipate work from the next one.
3. **No abstraction not specified.** No global state library, no form library (textarea + `useState` is sufficient), no custom hooks beyond `useTranslateQuery`, no premature component extraction, no memoisation outside what §9.10 specifies.
4. **No dependency not specified.** §3.1 lists the full stack. Adding anything else (date library, animation library, alternative chart library, alternative icon library) requires explicit approval.
5. **Spec drift is a process, not a workaround.** If implementation reveals the spec is wrong, amend `specs/frontend-spec.md` directly, note the amendment in the next checkpoint summary, then continue. Do not work around the spec silently.
6. **Surface deferred or stubbed work.** Every checkpoint summary lists what was implemented partially or skipped — even if it seems obvious.

## Tech stack — non-negotiable

- **Vite + React 18 + TypeScript** (strict mode: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Tailwind CSS** with design tokens from CSS variables (see §7.3 of the spec)
- **shadcn/ui** primitives (copy-into-repo, not a library import)
- **TanStack Query v5** for server state
- **Zod** for runtime validation at the API boundary
- **Recharts** for the growth curve only
- **lucide-react** for icons
- **pnpm** as the package manager
- **Node ≥ 20 LTS** (pinned via `.nvmrc`)
- **Vitest** for unit tests

Things deliberately NOT in the stack: Redux/Zustand/Jotai, Next.js, Axios, React Hook Form (v1), date-fns/dayjs, Framer Motion, Storybook, any CSS-in-JS runtime.

## Folder structure

Feature-first, not type-first. See §3.5 of the spec for the full layout. Key conventions:

- `features/translation/` — all translation feature code, self-contained
- `shared/` — only genuinely cross-feature code (shadcn primitives, env config, `cn` helper)
- No top-level `components/`, `hooks/`, or `utils/` folders — type-first grouping is rejected
- `data/exampleQueries.ts` is a typed module containing the 9 curated demo queries verbatim from §2.4
- `data/strings.ts` is the centralised copy inventory from §8.13

## Commands

```
pnpm install          # install dependencies
pnpm dev              # dev server (default: http://localhost:5173)
pnpm build            # production build to dist/
pnpm preview          # serve the production build
pnpm test             # run unit tests with Vitest
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
```

Before considering any checkpoint complete: `pnpm typecheck && pnpm lint && pnpm test` must all pass clean.

## Environment variables

Two variables, both validated at startup in `shared/config/env.ts`:

- `VITE_API_BASE_URL` — required. Defaults to `http://localhost:8000` in `.env.development`.
- `VITE_CACHE_MODE` — optional. `"off"` (default) or `"session"`. Controls TanStack Query cache behaviour.
  - `off` — every submit re-runs the backend; every URL visit re-fetches. Use for evaluating models and configurations.
  - `session` — `staleTime: Infinity`; mutation responses written to cache; URL revisits replay from cache. Use for snappy demo replay.

Commit `.env.example`, never commit real `.env` values.

## Backend notes

The backend is **not in this repo**. It runs separately as a FastAPI process on `localhost:8000`. The endpoint this app uses is `POST /api/v1/translate`.

If a session needs the backend running and it isn't, surface this — don't try to mock around it. The demo and most testing requires the live backend.

## Code conventions

- Function components only; no class components
- Named exports; default exports only for `App.tsx` and Vite entry points
- `type Props = { ... }` colocated with the component (not `interface`)
- Absolute imports from `@/` for cross-feature; relative paths within a feature
- Prettier with `singleQuote: true`; ESLint with `@typescript-eslint/recommended` + `react-hooks/recommended`
- Tailwind utility classes; no inline `style={}` except for dynamic values (e.g. timeline segment widths)
- Comments explain *why*, never *what*
- No commented-out code in commits, no dead code at merge time
- No `any`. If a third-party type is missing, wrap it in a typed module.

## Testing scope (v1)

Only unit tests on pure-function modules per §9.12:

- `utils/growthCurve.ts`
- `utils/warnings.ts`
- `utils/format.ts`
- `api/schema.ts` (round-trip with the live response example)
- `api/client.ts` (mocked fetch, one test per `TranslateError.kind`)

Component tests, hook tests, and Playwright e2e tests are explicitly deferred from v1. Do not add them without approval.

## What this project is NOT

Listed here to prevent scope creep:

- Not a chat interface. No chat bubbles, no AI-assistant tropes, no "ask me anything" framing.
- Not a generic LLM frontend. The visual identity is scientific/auditable — see §7 of the spec for the design direction and anti-patterns.
- Not mobile-first. Desktop primary target (1280 px+); responsive degradation to 1024 px is welcome but not specified.
- Not internationalised in v1. English only; copy is centralised in `data/strings.ts` for future i18n.
- Not authenticated. No login, no user accounts, no per-user state.
- Not persistent. No localStorage, no sessionStorage, no cookies. Only the URL `?q=` parameter persists state across reloads.

## Common failure modes to avoid

1. **Adding state libraries.** TanStack Query + `useState` is the entire state story. See §9.
2. **Premature memoisation.** §9.10 lists the only places `useMemo` should appear. Anywhere else is wrong by default.
3. **Drifting visual treatment across panels.** Build a shared "panel chrome" pattern at Checkpoint 3 and have all five panels use it. Do not let each panel grow its own border/padding/heading style.
4. **Skipping the dev-mode assertions.** §9.11 lists four assertions that catch schema and derivation drift. They are cheap and prevent demo-day surprises.
5. **Hand-writing TypeScript types alongside Zod schemas.** Always `z.infer<>` from the schema. Never duplicate.
6. **Treating warnings as a nice-to-have.** They are core content for the auditability story. Render them carefully per §8.10 and correlate to steps where possible per §8.14.
7. **Forgetting the multi-step branch in C1.** Multi-step scenarios must NOT show first-step temperature/duration in the C1 right column. See §4.7 quirk and §8.6.

## Maintaining `specs/lessons.md`

`specs/lessons.md` is the project's running record of what's been learned the hard way. It exists so future sessions (and future agents) don't repeat the same mistakes or rediscover the same dead-ends.

**When to append a lesson:**

- A spec ambiguity was clarified during work — record the resolution
- An implementation choice was tried and abandoned — record what failed and why
- A backend response surprise appeared (a quirk beyond the four in §4.7) — record the shape and the workaround
- A library, tool, or pattern behaved differently than expected — record the actual behaviour
- A "common failure mode" from `CLAUDE.md` was almost (or actually) hit — record the trigger and the recovery
- A code smell or anti-pattern was caught during a checkpoint review — record the rule that prevents it next time
- A debugging session took more than ~15 minutes — record the symptom, root cause, and fix

**When NOT to append:**

- Information already in the spec (don't duplicate; amend the spec instead)
- Routine implementation steps that went smoothly
- Personal preferences without a concrete failure behind them
- Speculation about future issues (`specs/lessons.md` records the past, not predictions)

**Format for each entry:**

```
## YYYY-MM-DD — Short title

**Context:** one sentence on what was being worked on.
**Lesson:** one to three sentences on what was learned.
**Action:** the rule or check to apply going forward.
**Reference:** related spec section, file, or commit if relevant.
```

Append to the end of `specs/lessons.md`; do not edit or remove past entries (they are the record). If a lesson supersedes an older one, add a new entry that references and corrects the old one.

Keep entries concrete and actionable. "Be careful with X" is not a lesson; "X has behaviour Y; do Z to handle it" is.

## When to stop and ask- The spec contradicts itself or is ambiguous on a decision that affects more than the immediate file
- An implementation choice would add a dependency not in §3.1
- A test reveals the backend response shape differs from `specs/frontend-spec.md` §4.3
- A checkpoint deliverable cannot be completed without anticipating next-checkpoint work
- Visual coherence concerns surface (e.g. a chosen treatment looks wrong against the design tokens)

Stopping is cheap. Reworking three checkpoints' worth of code is not.
