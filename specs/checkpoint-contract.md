# Checkpoint Contract — Problem Translator Frontend

*Companion to `frontend-spec.md`. Read this first.*

---

## How to use this document

This document tells Claude Code how to pace the implementation of the Problem Translator frontend. The full specification is in `frontend-spec.md`. This contract defines three stop points where Claude must pause for human review before continuing.

**For Claude Code:** implement against the spec, stopping at each checkpoint defined below. At each stop, produce the summary described and wait for explicit go-ahead before continuing. Do not skip a checkpoint, do not combine checkpoints, do not anticipate work from a future checkpoint.

**For the human reviewer:** at each stop, walk the checklist below, exercise the deliverables, and either approve continuation or request changes. The point of the checkpoints is to catch drift early; use the time.

---

## Operating principles (apply throughout)

1. **The spec is the source of truth.** When this contract is silent on a detail, defer to `frontend-spec.md`. When the two conflict, this contract wins on *what to deliver and when*; the spec wins on *how it should look and behave*.
2. **No work outside the current checkpoint.** Resist the urge to write "just one component" from the next phase. Discipline preserves the value of the review.
3. **No abstraction not specified.** No global state library, no form library, no custom hooks beyond `useTranslateQuery`, no premature component extraction, no memoisation beyond what §9.10 specifies. The spec's "What is deliberately NOT…" subsections are binding.
4. **Stop and ask when blocked.** If the spec is ambiguous or contradicts itself, stop and ask rather than guess. Spec amendments are cheap; reworking three checkpoints' worth of code is not.
5. **Surface deferred work.** At each checkpoint summary, list anything that was implemented partially, stubbed, or deliberately deferred. The reviewer needs to know.

---

## Checkpoint 1 — Foundation

**Goal:** the project compiles, types check, the API boundary is real and validated, design tokens render correctly. No application UI yet.

### Must be complete

- Vite + React 18 + TypeScript project initialised with `npm`, Node version pinned via `.nvmrc` (≥ 20)
- TypeScript configured per §10.7: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- ESLint + Prettier configured per §10.7
- Tailwind CSS configured, reading from CSS variables defined in `styles/globals.css`
- Self-hosted fonts (Inter, Source Serif 4, JetBrains Mono) loaded via `@font-face`
- Design tokens from §7.3 defined as CSS variables in `globals.css`
- Folder skeleton matching §3.5 in place — empty files are acceptable for components not yet implemented, but the structure must be correct
- `shared/config/env.ts` validating `VITE_API_BASE_URL` (required) and `VITE_CACHE_MODE` (defaulting to `"off"`, rejecting unknown values)
- `.env.development` with the localhost defaults; `.env.example` committed for reference
- `features/translation/api/schema.ts` — Zod schemas for the full response shape per §4.3, with permissive enum-like fields per §4.4
- `features/translation/api/types.ts` — types inferred via `z.infer<>`, no hand-written duplicates
- `features/translation/api/client.ts` — `translateApi` function that posts, parses, and throws typed `TranslateError` on every failure path per §9.4
- `features/translation/api/errors.ts` — discriminated `TranslateError` type per §9.4
- `features/translation/api/keys.ts` — query key helpers per §9.2
- `App.tsx` rendering only the page layout: header (region A) and footer (region D) with chrome and tokens applied; the rest of the page is a blank panel placeholder
- `main.tsx` with `QueryClientProvider` configured per §9.2 (cache mode-aware)
- One-page `README.md` covering install, dev, build commands and the env var contract

### Tests required at this checkpoint

- `api/client.ts` — mocked `fetch`, one test per `TranslateError.kind` (transport / validation / application / degenerate)
- `api/schema.ts` — round-trip test using the live response example from §4 (parse, assert key fields populate)

### Explicitly NOT required at this checkpoint

- Any of QueryPanel, ResultArea, the five panels, the example picker, the growth curve, the warnings strip
- The `useTranslateQuery` hook
- URL synchronisation
- Format utilities, growth curve derivation, warning correlation

### Deliverable summary Claude must produce

A short markdown report containing:

1. **What was built** — file list grouped by area, ~15–25 lines
2. **Spec sections covered** — list of §-references the implementation addresses
3. **Deferred or stubbed** — anything noted but not done; expected at this checkpoint to be a long list
4. **Decisions taken without spec guidance** — any micro-decisions made (e.g. eslint rule additions, prettier overrides, exact font weight numbers) so the reviewer can spot drift
5. **Open questions** — anything where the spec was unclear and a guess was made; flagged for explicit confirmation

### Reviewer checklist

- `npm install && npm run dev` runs without errors
- `npm run build` succeeds
- `npm run lint` and `npm run typecheck` pass clean
- The blank page renders with correct background, header typography, and footer treatment — visually matches the design tokens in §7.3 and the typography in §7.4
- Both env vars work: app boots with defaults, app boots with `VITE_CACHE_MODE=session`, app fails clearly when `VITE_API_BASE_URL` is missing
- Schema tests pass; client error tests pass
- Folder structure matches §3.5 exactly
- No surprise dependencies in `package.json`

### Stop condition

After producing the deliverable summary, Claude waits for explicit go-ahead ("proceed to Checkpoint 2") before continuing. Do not begin Checkpoint 2 work even if it seems trivially small.

---

## Checkpoint 2 — State and Shell

**Goal:** the full request lifecycle works end-to-end against the running backend, with placeholder content in the success state. Every behaviour from §6 (Core User Flows) is functional except the actual rendering of the five result panels.

### Must be complete (in addition to Checkpoint 1)

- `features/translation/hooks/useTranslateQuery.ts` — implements the contract from §9.3 exactly (interface signature, status derivation, submit/retry/reset behaviour)
- URL synchronisation per §9.5: `useMemo` read on mount, `useEffect` write on success via `replaceState`, guards against unnecessary writes
- `features/translation/components/QueryPanel.tsx` — textarea, character counter (only ≥ 1800 chars), "Translate" submit button, "Load example" button, Cmd/Ctrl+Enter shortcut, validation per §6.10
- `features/translation/components/ExamplePicker.tsx` — popover with the 9 curated queries grouped by persona, keyboard navigation, no auto-submit on selection per §6.3
- `features/translation/data/exampleQueries.ts` — typed module containing the 9 curated queries from §2.4 verbatim, plus draft one-line summaries per §8.4
- `features/translation/data/strings.ts` — full copy inventory from §8.13 as a typed constant
- `features/translation/components/ResultLayout.tsx` — branches on `status` and renders one of: empty state (§8.5.1), loading state (§8.5.2 — full skeleton with query echo and bottom status line), error state (§8.5.3 — full implementation including all five error message variants and both action buttons), success state (placeholder showing parsed data as raw JSON or simple field list — NOT the five panels)
- One top-level `<ErrorBoundary>` per §10.5
- Auto-scroll to result area on submit per §8.12
- Focus management per §8.12 (focus to result heading on success, return to textarea on picker close, etc.)
- `aria-busy` and `aria-live="polite"` on the result area; `role="alert"` on error state
- Both cache modes verified working: `off` re-runs every submit, `session` returns from cache on URL revisit

### Tests required at this checkpoint

- No new tests required beyond Checkpoint 1's. Manual exercise of the flows is the verification at this stage. Component tests are deferred per §9.12.

### Explicitly NOT required at this checkpoint

- Any of the five result panels (C1–C5) — the success state shows raw JSON or a simple key/value dump
- Growth curve component
- Warning correlation utility
- Step-scoped warning rendering
- Format utilities (numbers can render as raw values for now)

### Deliverable summary Claude must produce

Same five-section format as Checkpoint 1, with one addition:

6. **Flows verified** — for each of F1–F6 (§6), a one-line confirmation that it was manually exercised and works

### Reviewer checklist

The reviewer must run the app against a live backend and exercise every flow:

- **F1** — type a free-text query, submit, see loading skeleton, see success placeholder with parsed data, URL updates to `?q=...`
- **F2** — open picker, navigate with keyboard, select an example, see textarea populate, submit manually
- **F3** — open `?q=` URL directly, see auto-load and auto-execute
- **F4** — submit a second query after a first; loading state appears once, no flash through empty
- **F5** — kill the backend mid-session, submit, see correct error message, retry after restoring backend works
- **F6** — copy URL after a result, paste in new tab, recipient sees the same query auto-execute
- Cache modes: with `VITE_CACHE_MODE=off` repeat submits hit the backend; with `VITE_CACHE_MODE=session` URL revisits are instant
- Validation: empty query disables submit, > 2000 chars disables submit and shows counter
- Keyboard: Cmd/Ctrl+Enter submits, Esc closes picker, Tab order is sensible
- Each error variant displays correctly (transport, validation by killing the backend partway, application by triggering a backend error, degenerate by mocking if needed)
- Skeleton loading state matches the structure planned for the success state — no jarring layout shift expected at Checkpoint 3 because the skeleton sets the layout

### Stop condition

After producing the deliverable summary, Claude waits for explicit go-ahead ("proceed to Checkpoint 3") before continuing.

This is the most important checkpoint to actually review. The five panels in Checkpoint 3 all consume the contract proven here. Issues caught now cost minutes; issues caught at Checkpoint 3 cost hours.

---

## Checkpoint 3 — First Complete Render

**Goal:** the success state renders all five panels with real data. The full UI is visible end-to-end for at least the curated demo queries.

### Must be complete (in addition to Checkpoint 2)

- `features/translation/utils/format.ts` — every formatting rule from §4.5 implemented
- `features/translation/utils/growthCurve.ts` — derivation per §5.9, including dev-mode assertion (§9.11)
- `features/translation/utils/warnings.ts` — step correlation heuristic per §8.14
- A shared "panel chrome" component or styling pattern used by all five panels, so chrome treatment is consistent (per §7.6 — surface, border, radius, padding, header rule)
- `TranslationPanel.tsx` (C1) — full implementation per §8.6, including multi-step branch behaviour
- `StepTimeline.tsx` (C2) — full implementation per §8.7, including narrow-segment fallback, step-scoped warning indicators, `role="img"` accessibility, segment buttons for tooltip access
- `PredictionPanel.tsx` (C3) including `GrowthCurve.tsx` — full implementation per §8.8, including the simplified-visualisation caveat label
- `ProvenancePanel.tsx` (C4) — full implementation per §8.9, including the empty-provenance fallback message
- `WarningsStrip.tsx` (C5) — full implementation per §8.10, grouped by type, omitting empty groups, omitting the panel entirely if no warnings
- Confidence indicator, source badge, citation tag, key-value row patterns from §7.7 implemented as small shared components or styling primitives
- Dev-mode assertions from §9.11 wired

### Tests required at this checkpoint

- `utils/growthCurve.ts` — single-step, multi-step, inactivation (negative μ_max), zero-duration edge case, total-equals-prediction assertion
- `utils/warnings.ts` — correlation match, no-match fallback to global, multiple warnings, mixed types
- `utils/format.ts` — every rule in §4.5 covered

### Explicitly NOT required at this checkpoint

- Component tests (deferred per §9.12)
- Accessibility audit beyond what's intrinsic to the chosen primitives
- Print styles, mobile responsive tuning below 1024 px
- Deferred items from §11.1

### Deliverable summary Claude must produce

Same six-section format as Checkpoint 2, with one addition:

7. **Curated query results** — for each of the 9 queries from §2.4, a one-line confirmation: query ID, single-step or multi-step, render successful (yes/no), any visible issue (e.g. a long binomial wraps oddly, a segment label collides). This is the basis for the visual coherence review.

### Reviewer checklist

This is the visual coherence checkpoint. Run each curated query and look critically:

- Walk through all 9 curated queries (§2.4); each produces a complete, sensible-looking screen
- C2 (thermal inactivation, model_type-aware bias): negative log change renders with correct sign and colour; safety-critical scenario reads correctly
- C3 (multi-step cooling, two explicit legs): both steps visible in timeline, growth curve shows piecewise behaviour, total matches per-step sum
- A2 (multi-step transport then home storage): inferred temperatures read correctly, per-step contributions are visible
- B1 (single-step explicit values): single segment in timeline renders cleanly, no awkward layout from the one-step special case
- Typography is consistent across panels (panel headings same weight/size, key-value rows align, mono numbers tabular)
- Spacing rhythm is consistent (panel-to-panel gap, internal padding, sub-section spacing all follow §7.5)
- Confidence indicators look the same in C3 and C4
- Source badges in C4 use the same treatment everywhere
- Citation tags in C4 notes are styled, not raw text
- The curve caveat label is visible but unobtrusive
- The warnings strip is omitted entirely when there are no warnings, not rendered as an empty panel
- The "N/A" provenance value renders as an em-dash, not the literal text
- A multi-step query does NOT show first-step temperature/duration in C1's right column (the `is_multi_step` branch from §4.7 is honoured)
- Visual identity is recognisably the one described in §7.1–§7.4: scientific, calm, distinctive, not generic

If any of the above fails, request fixes before approving Checkpoint 3. After approval, the remaining work is finishing touches per the spec — accessibility pass, edge cases, dev-mode niceties, README updates — which Claude completes without a further checkpoint and presents as the final delivery.

### Stop condition

After producing the deliverable summary, Claude waits for explicit go-ahead. After approval, Claude continues to completion (no further checkpoints) and produces a final delivery summary.

---

## Final delivery (after Checkpoint 3 approval)

Claude finishes the implementation per the spec without further stop points. Items expected to land here:

- Accessibility commitments from §10.2 verified (focus rings on every interactive element, keyboard navigation complete, contrast verified on tokens, reduced motion honoured)
- Edge cases from §6 (URL `?q=` validation edge cases, character-counter behaviour at the boundary, picker close on outside click)
- Dev-mode assertions from §9.11 all wired
- Tooltip implementations for narrow timeline segments and step-scoped warnings
- README updated with the run-the-demo instructions
- Any cleanup, dead code removal, lint cleanup
- Final pass against the spec's "What is deliberately NOT…" subsections to confirm nothing crept in

### Final deliverable summary

A short report covering:

1. **Final state** — what's complete, with file count and approximate LOC
2. **Test status** — pass count by file
3. **Spec deviations** — anything implemented differently than specified, with rationale
4. **Known issues / deferred** — anything from §11.1 explicitly noted as still deferred (expected to be most of §11.1 — that's fine, list it for completeness)
5. **Pre-demo checklist** — the spec's pre-demo verification items (R1 mitigation in §12.3) restated as a runbook the user can execute against the running app

---

## Spec amendment protocol

If during any checkpoint Claude or the reviewer identifies a spec issue:

1. **Stop work on the affected area.**
2. **Amend `frontend-spec.md` directly** with the correction. The spec is in version control; amendments are commits.
3. **Note the amendment in the next deliverable summary** under a new section "Spec amendments since last checkpoint".
4. **Resume work** against the amended spec.

Do not work around spec issues silently. Do not let the implementation diverge from the spec. The spec must match what ships at all times.

---

## Things this contract deliberately does not specify

- Exact session structure (one continuous session vs three sessions). Claude and reviewer can use whichever fits the day.
- Which specific shadcn primitives to install at Checkpoint 1 vs later. Install as needed; the spec is the constraint.
- Test framework setup details — Vitest is named in §3.1; configuration follows project convention.
- Git workflow — branches, commits, PRs are the reviewer's choice.

These are implementation details that don't affect the checkpoint structure.
