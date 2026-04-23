# Frontend Specification — Problem Translator

*Demo and Production Foundation for the Problem Translation Module*

---

**Status:** v1 — ready for implementation
**Target:** single-page React application serving both as the demo surface for an internal presentation and as the architectural foundation for the future production application.
**Audience for this document:** implementation agent (Claude Code) and project stakeholders.

---

## Table of Contents

1. Goals & Non-Goals
2. Users & Scenarios
3. Tech Stack & High-Level Architecture
4. Backend Integration & API Contract
5. Information Architecture
6. Core User Flows
7. Visual Design System & UI Patterns
8. Screen-by-Screen Specifications
9. State Management & Data Flow
10. Non-Functional Requirements
11. Out-of-Scope and Future Extensions
12. Open Questions and Risks

---

## 1. Goals & Non-Goals

### 1.1 Strategic context

This frontend serves two purposes simultaneously:

- **Short-term**: a live demo for an internal team presentation showcasing the Problem Translation Module's capabilities. Run from a local machine against a locally running FastAPI backend.
- **Long-term**: the architectural foundation for a production application. The demo surface may change; the core architecture, data layer, and integration patterns should not.

Decisions throughout this spec favour the long-term goal where the two conflict, and avoid demo-only shortcuts that would create refactor liabilities: no scripted moments, no mocked data, no hardcoded results. Everything the UI shows is a direct rendering of a real backend response.

### 1.2 Goals (priority order)

1. **Faithfully surface the core value of the system**: that natural-language food safety queries are translated into auditable, scientifically grounded model parameters with explicit provenance and confidence. Auditability is the differentiator and is treated as first-class content, not a hidden detail.
2. **Visually distinctive and professional**, in the lineage of scientific and auditable interfaces (Linear, Observable, Bloomberg Terminal, regulatory dashboards) — not generic chat-LLM aesthetics. Distinctiveness comes from information architecture and visual identity, not from inventing new interaction patterns.
3. **Production-ready foundation**: modern stack, typed end-to-end, modular, scalable. Architecture accommodates future additions — a result-interpretation layer, clarification loops for low-confidence extractions, authentication and user history, multi-pathogen analysis, comparative "what-if" queries — without requiring a rewrite.
4. **Single-screen, frictionless demo flow**: query in, result out, no navigation, no setup, no login. Reusable for external audiences (advisory board, conference, external collaborators) without changes.
5. **Honest representation of uncertainty**: confidence scores, provenance sources, transformations, defaults, warnings, and bias corrections are visible without overwhelming the primary answer.
6. **First-class multi-step support**: the backend extracts and predicts multi-step time-temperature profiles from a single natural-language query. The UI must render these faithfully — showing each leg of the scenario, its per-step growth contribution, and the total outcome. Single-step queries are treated as the trivial case of the same display (one step).

### 1.3 Non-goals (v1)

- **No natural-language interpretation of model results.** Raw values with unit labels only. The backend's `growth_description` field is not surfaced to the user.
- **No `model_type` override control.** The backend infers it; v1 does not expose the override even though the API accepts it.
- **No persistence, accounts, history, or saved queries.** The application is fully stateless between requests. URL-shareable results are supported through URL query parameters, not server-side storage.
- **No backend changes for v1 unless surfaced explicitly.** Visualisations are computed from data the API already returns.
- **No multi-pathogen comparison.** One organism per query, as the backend returns.
- **No manual step editor for multi-step scenarios.** The user writes a natural-language query; the backend decomposes it. v1 does not allow users to manually add, remove, or edit individual steps.
- **No mobile-first design.** Desktop-first (1280px+ primary target). Responsive degradation is welcome but not specified for v1.
- **No internationalisation.** English only.

### 1.4 Deferred

Items intentionally out of scope for v1 that the architecture must accommodate:

- Natural-language interpretation layer translating model outputs into risk communication appropriate to the audience.
- Interactive clarification loop when extraction confidence is low.
- Query history and saved sessions (requires a persistence layer).
- Authentication and per-user context.
- Multi-pathogen parallel analysis.
- Comparative analysis ("what if the temperature were 5°C lower?").
- Manual step editing for power users who want to override the extracted profile.

---

## 2. Users & Scenarios

### 2.1 Demo audience

**Primary:** internal team members at the research centre. Technical context is shared; a narrator will walk through the demo live. The UI must support narration without distracting from it.

**Secondary (no UI changes required):** advisory board members, conference attendees, and external collaborators who may encounter the UI without narration. Copy and labelling must therefore be self-explanatory at a surface level, even where full interpretation of the model outputs requires food-safety expertise.

### 2.2 End-user personas

The Problem Translation Module targets three end-user categories (per the project's sensitivity analysis study). The demo UI does **not** ask the user to identify their persona, and persona selection does **not** change any behaviour. The example query picker is organised by persona purely because the queries themselves come from different operational contexts and the grouping helps communicate the system's breadth of applicability.

**Risk Assessor / Researcher** — formal QMRA practitioner in a government agency, university, or contract research organisation. Technical vocabulary, low time pressure, queries are scenario-definition tasks with defensible assumptions.

**Regulatory Inspector** — field officer making rapid assessments during inspections with incomplete information. Time-pressured, less technical, queries framed around specific incidents.

**Industry HACCP / QA** — food safety manager dealing with real production deviations. Operational language, ambiguous scenarios, often subject to optimistic bias due to commercial pressure.

### 2.3 Primary use scenarios

**Scenario 1 — live demo (primary):** the presenter opens the app, picks an example query from a persona group (or types one), submits, and walks the audience through the result panel — pointing out the original-query-to-grounded-parameters mapping, the per-field provenance and confidence, the warnings and bias corrections, and the final ComBase prediction.

**Scenario 2 — independent exploration:** a team member or viewer without narration types or picks a query, reads the result, and examines provenance to understand how each value was determined.

**Scenario 3 — shared link (URL-shareable result):** a viewer receives a URL containing an encoded query, opens it, sees the query auto-populated and re-executed against the backend. Implementation: query encoded as a URL query parameter (`?q=...`), executed on page load if present.

### 2.4 Example queries — curated demo set

Three queries per persona, selected from the project's sensitivity analysis library to exercise different system behaviours. Selection criteria: demo robustness (scenarios likely to produce a clean, interpretable result), behavioural variety (explicit-value queries, inference-heavy queries, single-step, multi-step), and inclusion of at least one safety-critical case (the C2 thermal inactivation query, which exercises the model-type-aware conservative bias).

Queries are quoted verbatim from `sensitivity_analysis_queries.md`.

| ID | Persona | Query | What it demonstrates |
|----|---------|-------|----------------------|
| A1 | Risk Assessor | *"We need to model L. monocytogenes growth in vacuum-packed sliced turkey deli meat during retail display. Assume typical retail refrigeration. The product has a 35-day shelf life. What growth can we expect?"* | Explicit pathogen, vague temperature (interpretation rule), long duration, RAG for food properties. Single-step. |
| **A2** | Risk Assessor | *"For the exposure assessment, we need to estimate Salmonella growth on ground beef from purchase to cooking. The consumer picks it up at the supermarket, drives home — assume a typical shopping trip — and stores it in the home refrigerator. Model the growth during the transport and home storage segments separately."* | **Multi-step** (transport → home storage). Explicit pathogen, inferred temperatures and durations from lay language. Primary multi-step demo in the Risk Assessor group. |
| A7 | Risk Assessor | *"Cooked rice is held at a buffet for service. The rice was cooked to above 95°C, cooled to serving temperature, and placed on a heated display. We need to assess B. cereus risk assuming the rice is held for the service period."* | Pathogen mentioned, vague temperature ("warm display"), vague duration, food-properties RAG for rice. |
| B1 | Inspector | *"During a routine inspection of a poultry distribution truck, I found the refrigeration unit had failed. The driver says it broke down about two hours ago. The truck thermometer reads 12°C now. The load is fresh chicken portions."* | Explicit temperature and duration, no pathogen mentioned (RAG inference for chicken → Salmonella). |
| B2 | Inspector | *"At a restaurant inspection, the chicken soup on the hot-holding line measured 48°C. The cook says it's been on the line since the start of lunch service, roughly two and a half hours. The soup was boiled before service."* | Explicit temperature in danger zone, vague duration ("roughly"), no pathogen. Demonstrates conservative duration margin. |
| B7 | Inspector | *"I found several large frozen turkey breasts thawing on the counter. The kitchen staff said they were taken out of the freezer 'first thing this morning' — it's now mid-afternoon. The surface temperature reads 18°C but the core is still frozen."* | Explicit temperature, fully inferred duration. Demonstrates duration interpretation rule and confidence calibration. |
| C1 | Industry QA | *"The refrigeration chamber for our turkey storage broke down overnight. When we came in this morning, the temperature was reading 13°C. We think it failed sometime during the night — maybe around 2 AM. The turkey portions have been there since yesterday afternoon. Can we still use them?"* | Conflicting temporal cues, optimistic-bias scenario. Demonstrates conservative bias correction. |
| **C2** | Industry QA | *"One of our oven lines had a temperature drop during a production run of breaded chicken nuggets. The oven thermocouples show the product core temp only reached 68°C instead of our target 74°C. The nuggets were in the oven for the normal time of 8 minutes. Do we need to discard the batch?"* | **Thermal inactivation scenario** — exercises the model-type-aware bias direction. Safety-critical: shows the system recognises an inactivation problem and applies bias *downward* (conservative for kill, not growth). |
| **C3** | Industry QA | *"We need to validate our cooling process for cooked bone-in hams. After the smokehouse, the hams are shower-cooled then placed in the blast chiller. It takes about 4 hours to go from 54°C to 27°C, and then another 8 hours to go from 27°C to 4°C. Does this meet the FSIS cooling requirements?"* | **Multi-step cooling** (two explicit legs with explicit temperatures and durations). Clearest multi-step demo in the library. Regulatory context makes the "why this matters" obvious to non-experts. |

Free-text input is always available alongside the example picker. The picker is a convenience, not a constraint.

**Pre-demo verification:** each of these queries should be executed end-to-end against the running backend before the demo to confirm successful translation. Any query that fails or produces a misleading result should be replaced from the broader library in `sensitivity_analysis_queries.md`. C2 is the highest-impact pick (it exercises the safety-critical model-type-aware bias fix) and C3 is the clearest multi-step showcase — both should be confirmed working before the demo.

### 2.5 Multi-step support

The backend's LLM extracts multi-step time-temperature profiles from a single natural-language query. From the user's perspective, there is no difference between submitting a single-step query and a multi-step query: both are free text in the same input. The backend response then indicates whether the scenario was decomposed into multiple steps (`prediction.is_multi_step`) and returns the full step list (`prediction.steps[]`) and per-step predictions (`prediction.step_predictions[]`) alongside the scalar summary fields.

The UI must:

- Render the full step sequence when `is_multi_step` is true, showing each step's temperature, duration, and per-step Δlog contribution. Single-step scenarios use the same rendering with one step — no special case.
- Make per-step contributions visible, not just the total. The value of multi-step lies precisely in showing where growth happens (warm car) and where it doesn't (fridge). An aggregate-only view would hide the most interesting information.
- Attach step-scoped warnings to the step they concern where possible (e.g., a "temperature outside valid range" warning on a specific step, rather than as a disembodied global warning). This requires the UI to inspect warning messages and correlate them with steps where feasible; if correlation isn't possible, the warning stays global.

The detailed visual approach (piecewise growth curve, step timeline, how warnings correlate) is specified in Section 8 (Screen-by-screen specifications).

---

## 3. Tech Stack & High-Level Architecture

### 3.1 Stack summary

| Concern | Choice | Rationale |
|---|---|---|
| Build tool & dev server | **Vite** | Fast, simple, zero-config. No SSR/RSC complexity that a local FastAPI integration doesn't need. Static output deploys anywhere later. |
| UI library | **React 18** | Mature, deep Claude Code support, straightforward concurrency primitives where needed. |
| Language | **TypeScript** (strict mode) | Non-negotiable for a typed end-to-end contract with the FastAPI backend. |
| Styling | **Tailwind CSS** | Pairs cleanly with the frontend-design skill; utility-first keeps styles local to components. |
| Component primitives | **shadcn/ui** | Unstyled, copy-into-repo primitives built on Radix. Accessible by default, fully customisable — essential for achieving a distinctive look without inheriting a library's aesthetic. |
| Icons | **lucide-react** | Clean, consistent, wide coverage, matches the visual lineage we're targeting. |
| Server state | **TanStack Query (React Query) v5** | Correct loading/error/cache semantics for API calls from day one. One small dependency, pays off immediately. |
| Client state | **React state + React Context** (for minimal cross-component state) | No global state library. Redux / Zustand not justified at this scope. |
| Routing | **None in v1** (single screen) | URL state read/written directly via `URLSearchParams` and `history.replaceState`. Adding React Router later is trivial; adding it now is premature. |
| Runtime validation | **Zod** | Validates API responses at the trust boundary; schemas also serve as the TypeScript type source. |
| Forms | **React Hook Form** (only if needed) | Current scope is a single textarea — likely not required for v1. Added only when a second form control appears. |
| Charts | **Recharts** | Declarative React charting, good defaults, well-supported. Used for the growth-curve visualisation. |
| Date/time | Native `Intl` + small utilities | No `date-fns` / `dayjs` needed for v1. |
| Testing | **Vitest** + **React Testing Library** (unit), **Playwright** (e2e, deferred) | Vitest integrates natively with Vite. Playwright optional until a CI need exists. |
| Linting / formatting | **ESLint** + **Prettier** | Standard config; no custom rules unless required. |
| Package manager | **npm** | Standard Node package manager. pnpm is acceptable if preferred — the spec originally noted npm as an acceptable alternative, and the project switched to npm at Checkpoint 1. |
| Node version | **≥ 20 LTS** | Pinned via `.nvmrc`. |

Things deliberately **not** included: Redux / Zustand / Jotai, Storybook, Axios (native `fetch` suffices), Styled Components / Emotion, Framer Motion (Tailwind transitions are enough for v1; revisit if a specific motion need appears), any CSS-in-JS runtime, Next.js, Remix.

### 3.2 Architectural principles

These apply throughout the rest of the spec and are non-negotiable for v1.

1. **The API response is the source of truth.** No derived values are computed client-side unless explicitly specified (the growth curve is the only such derivation). Every number shown comes from a named response field.
2. **The API boundary is typed and validated.** All responses pass through a Zod schema before reaching any component. TypeScript types are generated from the Zod schemas. Components never see raw `any` or unvalidated JSON.
3. **Components are presentational; data-fetching lives in hooks.** A screen composes presentational components and one or more hooks wrapping TanStack Query. Components receive typed props and render; they do not call the API directly.
4. **Feature-first folder structure, not type-first.** Files are grouped by feature (`features/translation/`), not by kind (`components/`, `hooks/`, `utils/` at the top level). Shared primitives live in `shared/`. This scales; the alternative does not.
5. **No premature abstraction.** One feature exists today (translation). The folder structure supports adding more, but components are not generalised in advance of a second use case.
6. **Strict TypeScript.** `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any`. Imports from JS libraries without types get wrapped in a typed module.
7. **Accessibility is a correctness concern.** Keyboard navigation works, focus states are visible, ARIA attributes on interactive components, colour contrast meets WCAG AA. This comes from shadcn/ui primitives by default; we don't undo it.
8. **Errors are first-class UI states.** Every hook distinguishes loading / error / empty / success. No component renders optimistically assuming data exists.

### 3.3 High-level architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         BROWSER (SPA)                              │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                      App Shell                              │  │
│  │  (header, layout, URL-param bootstrap, error boundary)      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │            features/translation (single feature)            │  │
│  │                                                             │  │
│  │   ┌─────────────┐   ┌──────────────────┐                   │  │
│  │   │ Query panel │   │ Example picker   │                   │  │
│  │   │ (textarea + │   │ (grouped by      │                   │  │
│  │   │  submit)    │   │  persona)        │                   │  │
│  │   └──────┬──────┘   └─────────┬────────┘                   │  │
│  │          └──────────┬─────────┘                            │  │
│  │                     ▼                                       │  │
│  │          ┌─────────────────────┐                            │  │
│  │          │ useTranslateQuery() │  ──── React Query          │  │
│  │          │   (hook)            │       cache                │  │
│  │          └──────────┬──────────┘                            │  │
│  │                     │                                       │  │
│  │                     ▼                                       │  │
│  │          ┌─────────────────────┐                            │  │
│  │          │   api/translate     │  ──── fetch + Zod          │  │
│  │          │   (typed client)    │                            │  │
│  │          └──────────┬──────────┘                            │  │
│  │                     │                                       │  │
│  │          ┌──────────┴──────────┐                            │  │
│  │          ▼                     ▼                            │  │
│  │  ┌────────────────┐   ┌─────────────────┐                  │  │
│  │  │ Result panels  │   │ Warnings strip  │                  │  │
│  │  │ - Translation  │   │                 │                  │  │
│  │  │ - Steps        │   │                 │                  │  │
│  │  │ - Prediction   │   │                 │                  │  │
│  │  │ - Curve        │   │                 │                  │  │
│  │  │ - Provenance   │   │                 │                  │  │
│  │  └────────────────┘   └─────────────────┘                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                              │ HTTP (JSON)
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                 FastAPI Backend (localhost:8000)                   │
│             POST /api/v1/translate  (existing endpoint)            │
└────────────────────────────────────────────────────────────────────┘
```

Key properties of this architecture:

- **One network boundary, one schema.** All frontend code sits behind the `api/translate` module. The rest of the app sees validated, typed data.
- **One stateful hook.** `useTranslateQuery()` is the only place that owns server state. It handles the submit mutation, exposes loading/error/success, and caches by query string.
- **Presentational components are pure.** Given the same props, they render the same output. They are straightforward to test and reason about.
- **URL ↔ state is handled at the shell.** The app shell reads `?q=` on mount, populates the query input, and triggers a submit if present. On submit, it writes `?q=` back. No component below the shell thinks about the URL.

### 3.4 Data flow

**On initial load:**

1. App shell mounts. Reads `?q=` from `URLSearchParams`.
2. If `?q=` is present: input is pre-filled with the decoded query; `useTranslateQuery` is triggered with that query as the argument.
3. If `?q=` is absent: input is empty; the result area shows an empty/onboarding state.

**On user submit (from textarea or example picker):**

1. The input component calls `translate(query)` — a function exposed by the translation feature.
2. `useTranslateQuery` invokes the mutation. Loading state appears in the result area.
3. `api/translate` POSTs to `http://localhost:8000/api/v1/translate` with body `{ query }`.
4. Response JSON is parsed and validated against the Zod schema. Validation failure raises a typed error.
5. On success: the parsed response lands in React Query's cache, keyed by query string. Components re-render with the typed response.
6. The shell updates `?q=` in the URL via `history.replaceState` so the current result is shareable.
7. On error (network, validation, or `success: false`): the result area switches to the error state with the original query preserved and a retry action.

**Caching — configurable via environment variable:**

The app supports two cache modes, selected at build time:

- **`VITE_CACHE_MODE=off` (default)** — every submit re-runs the backend. Re-submitting the same query returns a fresh response. This is the default because the intended development use case includes evaluating different model configurations through the UI; caching would hide variation.
- **`VITE_CACHE_MODE=session`** — responses are cached by query string for the life of the browser session (`staleTime: Infinity`). Re-submitting the same query returns the cached result instantly. Use for a demo when the presenter wants snappy replay of previously-run examples.

The default (`off`) is safer for evaluation. The session-cache mode is a deliberate, visible choice to be flipped immediately before the demo if desired. Switching requires a rebuild or a dev-server restart with the updated environment.

`retry: 0` in both modes. Retries are a user action, not automatic.

### 3.5 Folder structure

```
src/
├── main.tsx                          # Entry, providers (QueryClient)
├── App.tsx                           # App shell, URL bootstrap
│
├── features/
│   └── translation/
│       ├── api/
│       │   ├── schema.ts             # Zod schemas for request/response
│       │   ├── types.ts              # Inferred TS types
│       │   └── client.ts             # fetch wrapper, endpoint function
│       ├── hooks/
│       │   └── useTranslateQuery.ts  # React Query wrapper
│       ├── components/
│       │   ├── QueryPanel.tsx        # Textarea + submit + picker entry
│       │   ├── ExamplePicker.tsx     # Grouped example queries
│       │   ├── ResultLayout.tsx      # Orchestrates result panels
│       │   ├── TranslationPanel.tsx  # "Your words ↔ system's parameters"
│       │   ├── StepTimeline.tsx      # Multi-step visualisation
│       │   ├── GrowthCurve.tsx       # Recharts chart
│       │   ├── PredictionPanel.tsx   # Headline numbers
│       │   ├── ProvenancePanel.tsx   # Per-field provenance list
│       │   ├── WarningsStrip.tsx     # Warnings and corrections
│       │   └── ErrorState.tsx
│       ├── data/
│       │   ├── exampleQueries.ts     # The 9 curated queries, typed
│       │   └── strings.ts            # Copy inventory (§8.13)
│       └── utils/
│           ├── growthCurve.ts        # Frontend derivation of curve points
│           ├── warnings.ts           # Step-scoped warning correlation
│           └── format.ts             # Display formatting rules
│
├── shared/
│   ├── components/
│   │   └── ui/                       # shadcn/ui primitives
│   ├── lib/
│   │   └── cn.ts                     # Tailwind class merger (from shadcn)
│   └── config/
│       └── env.ts                    # Typed env vars
│
├── styles/
│   └── globals.css                   # Tailwind directives, design tokens
│
└── vite-env.d.ts
```

Notes:

- `features/translation/` is self-contained. Adding a second feature later means adding a sibling directory; nothing in `translation/` needs to change.
- `shared/` is only for genuinely cross-feature code. shadcn primitives live here because they're cross-cutting by definition.
- No top-level `components/`, `hooks/`, or `utils/` folders. Type-first grouping does not scale.
- `data/exampleQueries.ts` is a plain typed module — not a JSON file, not an env var. Editing the demo set is a code change, which is appropriate for content the demo depends on.

### 3.6 Environment configuration

Two environment variables:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_CACHE_MODE=off                 # "off" (default) or "session"
```

Accessed through a typed `shared/config/env.ts` module that:

- Validates presence and values at startup
- Throws a clear error if `VITE_API_BASE_URL` is missing
- Defaults `VITE_CACHE_MODE` to `"off"` if unset
- Rejects any other value for `VITE_CACHE_MODE` with a startup error

Default in `.env.development` is the localhost URL and cache mode off. Production deployment overrides as needed.

No `.env` secrets. The frontend holds no credentials — the backend is the one talking to LLM providers.

### 3.7 Risks and mitigations specific to this stack

| Risk | Mitigation |
|---|---|
| Backend CORS blocks the frontend when served from a different port | The current `main.py` already has `allow_origins=["*"]`. Confirmed OK for dev; tighten for production later. |
| LLM extraction latency makes the UI feel broken | Loading state is specified as a first-class design element (Section 8), not an afterthought. Skeleton layout mirrors the real result layout so the page structure is visible during the wait. |
| Zod schema drift from the Pydantic schema | The frontend schema is maintained manually for v1. Low risk at this scope (one endpoint, schema changes go through a conscious edit). If the API surface grows, consider generating TS types from the FastAPI OpenAPI spec. Noted as a future concern, not a v1 action. |
| `allow_origins=["*"]` in production | Out of scope for v1 (v1 runs locally). Flagged as a hardening task for production deployment. |
| Shadcn + Tailwind + custom design tokens risk visual inconsistency | Design tokens defined once in `globals.css`, referenced by Tailwind config. Shadcn components use these tokens via CSS variables. Spec'd in Section 7. |

---

## 4. Backend Integration & API Contract

This section specifies how the frontend talks to the backend: the endpoint, the exact request/response shape, how it's validated at the boundary, and how edge cases are handled.

### 4.1 Endpoint

| Property | Value |
|---|---|
| Method | `POST` |
| URL | `${VITE_API_BASE_URL}/api/v1/translate` |
| Default base URL (dev) | `http://localhost:8000` |
| Content-Type | `application/json` |
| Auth | None (v1) |
| Idempotent | No (LLM extraction is non-deterministic in principle; in practice stable enough for caching when `VITE_CACHE_MODE=session`) |
| Typical latency | 2–10 seconds (dominated by LLM extraction + RAG retrieval) |

### 4.2 Request

```ts
{
  query: string          // 1–2000 characters, required
  // model_type: omitted in v1 (see §1.3 non-goals)
}
```

- Validation at the input component: reject empty or whitespace-only queries before submit. Show `2000 − current.length` counter when the user is within 200 characters of the limit, not before.
- No trimming or normalisation of the query string beyond removing leading/trailing whitespace. The user's words are sent to the backend verbatim (and echoed back in `original_query`).

### 4.3 Response — canonical shape

Flattened to show what the frontend consumes. Sourced directly from the Pydantic `TranslationResponse` and nested schemas.

```ts
{
  success: boolean
  session_id: string
  status: "pending" | "in_progress" | "completed" | "failed"   // enum: SessionStatus
  created_at: string           // ISO 8601
  completed_at: string         // ISO 8601
  original_query: string

  prediction: {
    organism: string           // e.g. "SALMONELLA", "STAPHYLOCOCCUS_AUREUS"
    model_type: string         // e.g. "growth", "thermal_inactivation"
    engine: string             // e.g. "combase_local"

    // Scalar summary (first-step values for multi-step; totals where indicated)
    temperature_celsius: number      // first-step temp
    duration_minutes: number         // TOTAL duration across all steps
    ph: number
    water_activity: number
    mu_max: number                   // first-step μ_max (1/h)
    doubling_time_hours: number | null
    total_log_increase: number       // total across all steps

    // Multi-step (always populated; length 1 for single-step scenarios)
    is_multi_step: boolean
    steps: Array<{
      step_order: number             // 1-indexed
      temperature_celsius: number
      duration_minutes: number
    }>
    step_predictions: Array<{
      step_order: number
      temperature_celsius: number
      duration_minutes: number
      mu_max: number
      log_increase: number
    }>

    growth_description: string       // NOT rendered in v1 (raw values only)
  } | null

  provenance: Array<{
    field: string                    // e.g. "ph", "organism", "temperature_celsius"
    value: string                    // note: stringified; may be "N/A" (see §4.7)
    source: string                   // ValueSource enum as string
    confidence: number               // 0..1
    notes: string | null
  }>

  warnings: Array<{
    type: string                     // "bias_correction" | "range_clamp" | "warning"
    message: string
    field: string | null             // may be populated for field-scoped warnings
  }>

  overall_confidence: number | null  // 0..1

  error: string | null               // populated when success=false
}
```

**Authoritative response examples:** three real backend responses are committed as JSON fixtures under `src/features/translation/api/__fixtures__/`. These are the ground truth for schema tests — do not reconstruct fixtures from the type definition above, as that is circular. The fixture files are:

| File | Scenario | Notes |
|---|---|---|
| `single-step-growth.json` | Ground beef patty, 15 °C, 45 min (B1-style) | `is_multi_step: false`, `doubling_time_hours` populated, provenance entries with `value: "N/A"` |
| `multi-step-growth.json` | Chicken counter (22 °C, 2 h) → fridge (5 °C, 6 h) | `is_multi_step: true`, `temperature_celsius` is first-step only, `duration_minutes` is total, warning with `field: null` |
| `thermal-inactivation.json` | Chicken nuggets, 68 °C, 8 min (C2) | `model_type: "thermal_inactivation"`, negative `mu_max` and `total_log_increase`, `doubling_time_hours: null`, multiple global warnings |

When the backend schema changes, update these fixture files with new real responses and re-run `npm test`.

### 4.4 Validation — single source of truth

All responses pass through a Zod schema before reaching components. The schema lives in `features/translation/api/schema.ts` and all TypeScript types are inferred from it via `z.infer<>`. No hand-written TS types that could drift from the Zod schema.

Design principles for the schema:

- **Permissive on enum-like string fields.** `status`, `organism`, `model_type`, `source`, and `warning.type` are typed as `z.string()` rather than `z.enum([...])`. Reason: the backend controls the canonical values, and an unknown `organism` string (e.g. a newly added pathogen) must not cause the UI to blow up at parse time. Components that *display* these values render them as-is (with light formatting — see §4.5); components that *branch* on them (e.g. warnings grouping) handle unknown values by falling through to a default bucket.
- **Strict on structural fields.** Numbers are `z.number()`, booleans are `z.boolean()`, arrays have typed elements. Nulls are explicit (`z.number().nullable()`), not optional (`z.number().optional()`), because the backend reliably populates these fields with `null` rather than omitting them.
- **Confidence ranges not clamped.** The schema accepts any finite number; downstream display logic clamps to `[0, 1]` for rendering. We do not reject a technically-out-of-range confidence at the parse layer.
- **Datetimes as strings.** `created_at` and `completed_at` are `z.string()`, not coerced to `Date`. The frontend does not currently display timestamps, and coercing now adds complexity for no benefit.

### 4.5 Display-layer formatting rules

The API returns several fields in machine form. Humanising them is a presentation concern, not a schema concern. Rules applied at the component level:

| Field | Raw value | Display value | Notes |
|---|---|---|---|
| `prediction.organism` | `"STAPHYLOCOCCUS_AUREUS"` | `"Staphylococcus aureus"` | Lowercase + title-case first word + italicise the full binomial (scientific convention). Unknown → render as-is. |
| `prediction.model_type` | `"growth"` / `"thermal_inactivation"` | `"Growth"` / `"Thermal inactivation"` | Sentence case, underscores → spaces. |
| `prediction.engine` | `"combase_local"` | `"ComBase (local)"` | Hardcoded mapping for the small known set; unknown → as-is. |
| `source` (provenance) | `"rag_retrieval"` / `"user_explicit"` / `"user_inferred"` / `"default"` | `"Retrieved (RAG)"` / `"From your query"` / `"Inferred"` / `"Default"` | User-facing labels chosen for clarity, not strict fidelity to backend enum. |
| `warning.type` | `"bias_correction"` / `"range_clamp"` / `"warning"` | Icon + label: `"Correction applied"` / `"Value clamped"` / `"Note"` | Affects visual treatment — see §8. |
| `confidence` | `0.6551502585...` | `"66%"` | Single integer percentage. |
| `mu_max` | `1.2344246610...` | `"1.23 /h"` | 2 decimal places, unit suffix. |
| `doubling_time_hours` | `0.5615143657...` | `"34 min"` or `"1.2 h"` | < 1 h → minutes; ≥ 1 h → hours with 1 decimal. |
| `total_log_increase` | `0.6907397610...` | `"+0.69 log₁₀"` | Signed (thermal inactivation can be negative). 2 decimal places. |
| `step.duration_minutes` | `225` | `"3 h 45 min"` or `"45 min"` | < 60 → minutes only; ≥ 60 → h + min. |
| `temperature_celsius` | `28` | `"28 °C"` | No decimals unless the raw value is non-integer. |

All formatters live in a single module (`features/translation/utils/format.ts`) so the rules are auditable in one place.

### 4.6 Success vs. failure semantics

Three distinct failure modes the UI distinguishes:

1. **Transport failure** — network error, timeout, non-2xx response. Handled by React Query's `error` state. UI shows generic "Could not reach the server" with retry.
2. **Validation failure** — response arrives with status 200 but fails Zod parsing. This is a bug (frontend and backend have drifted). UI shows "Unexpected response format" with retry; the raw error is logged to the console in dev.
3. **Application failure** — response arrives, parses, but `success === false`. UI shows `error` field verbatim, original query preserved, retry action available.

The fourth case — `success: true` with `prediction: null` — is treated as an application failure even though `success` says true. This protects the UI from a degenerate response shape. If encountered, the UI shows a generic "Translation completed but no prediction was produced" with the original query and retry.

### 4.7 Known response quirks documented here so they are not rediscovered later

From the live response provided:

- **`provenance[].value` can be the literal string `"N/A"`.** This is not an error — it reflects that `ValueProvenance.original_value` was not set upstream. The UI must handle `"N/A"` as a valid value string (render it as a dash, not as the text "N/A", to distinguish it from a real extracted token). This applies to both `ph` (range resolved to a single number) and `organism` (inferred from RAG text) in the example response.
- **Warnings may have `field: null`** even when they are semantically field-scoped. Example from the live response: `"Temperature 4.0°C outside valid range [7.5, 30.0]"` arrives with `field: null` but is clearly about a specific step's temperature. The UI attempts to correlate such warnings with a step when possible (see §8 screen spec) and falls back to a global warning when not.
- **`provenance` is not exhaustive.** The live response has only `ph` and `organism` entries even though the final prediction used `temperature_celsius`, `duration_minutes`, and `water_activity`. This is by design: the backend only emits provenance for values that went through grounding/RAG. User-explicit values may or may not appear. The UI does not assume one provenance entry per prediction field.
- **`prediction.temperature_celsius` and `prediction.mu_max` are first-step values, not aggregates.** The Pydantic schema documents this. In the UI, the top-level "Temperature" figure is only shown for single-step scenarios; multi-step scenarios show the step timeline instead, not a misleading scalar.
- **`prediction.duration_minutes` is the total across all steps.** Inconsistent with `temperature_celsius` and `mu_max` — this one *is* an aggregate. The UI uses it only for the "total duration" label and never pairs it with `temperature_celsius` as a "what we ran" summary.

### 4.8 React Query configuration

```ts
// features/translation/hooks/useTranslateQuery.ts (sketch)

const cacheMode = env.VITE_CACHE_MODE  // "off" | "session"

const mutation = useMutation({
  mutationFn: (query: string) => translateApi(query),
  // No automatic retry — retries are a user action.
  retry: 0,
})

// Separate query for URL-bootstrapped queries, keyed by query string,
// so the same ?q= doesn't re-run unnecessarily within a session
// (when cacheMode === "session").
const query = useQuery({
  queryKey: ['translate', queryString],
  queryFn: () => translateApi(queryString),
  enabled: !!queryString,
  staleTime: cacheMode === 'session' ? Infinity : 0,
  gcTime: 1000 * 60 * 30,  // 30 min
  retry: 0,
})
```

Two concurrent concerns:

- **Mutation** (`useMutation`) — fired when the user clicks submit. Always runs. Updates the URL on success.
- **Query** (`useQuery`) — fired on mount if `?q=` is present. Respects the cache policy selected by `VITE_CACHE_MODE`.

**Cache policy behaviour:**

- **`VITE_CACHE_MODE=off`:** `staleTime: 0`, so the bootstrap query always fetches fresh. The mutation always fetches fresh (mutations never check cache). Re-submitting identical queries always re-hits the backend.
- **`VITE_CACHE_MODE=session`:** `staleTime: Infinity` for bootstrap queries; additionally, on a successful mutation the result is written into the query cache via `queryClient.setQueryData(['translate', query], response)`, so subsequent URL visits to the same `?q=` return cached data instantly. Re-submitting an identical query via the mutation still re-hits the backend (mutations don't check cache by default), but navigating back to the same `?q=` URL uses cache.

### 4.9 Request lifecycle expectations

| Phase | Typical duration | UI state |
|---|---|---|
| Network round-trip | < 100 ms | — |
| Backend extraction + grounding + execution | 2–10 s | Loading skeleton matching final layout |
| Total perceived latency | 2–10 s | Same |

No streaming, no SSE. The frontend waits for the full response and renders atomically. Loading state design (§8) is responsible for making the wait feel intentional rather than broken.

### 4.10 CORS and local development

The backend sets `allow_origins=["*"]` for development. This is acceptable for v1 (local only). Production deployment must restrict this; flagged as a hardening task outside v1 scope.

If the frontend is served from `localhost:5173` (Vite default) and the backend from `localhost:8000`, CORS works out of the box. No proxy configuration needed. Documented in the README as part of the "run the demo" instructions.

### 4.11 What is explicitly not a frontend concern

- **Backend health checks.** The `/health` endpoint exists but the frontend does not poll it. A failed translation request is the signal that the backend is unavailable; that is sufficient.
- **Session management.** `session_id` is returned in responses but the frontend treats it as an opaque string for logging only. No session reuse, no session lookups.
- **Error telemetry.** No analytics, no error reporting service in v1. Console logging in development; production hardening concern.

---

## 5. Information Architecture

This section specifies the structure of what's on screen, independent of visual style (which comes in Section 7). It answers: what areas exist, what does each contain, and how are they related.

### 5.1 Routes

One route. Everything happens at `/`.

URL parameters:

- `?q=<encoded-query>` — optional. If present on load, the query is pre-filled and auto-submitted. Written back on every successful submit to make the current result shareable.

No other routes, no modals that take over the URL, no hash-based state.

### 5.2 Page regions

One screen, four stacked regions. Nothing is hidden behind tabs or accordions by default — the demo audience sees the complete picture without interaction.

```
┌──────────────────────────────────────────────────────────────┐
│  A │ HEADER                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  B │ QUERY PANEL                                             │
│       Textarea + submit · example picker                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  C │ RESULT AREA  (empty / loading / error / success)        │
│       Contains, when success:                                │
│         C1. Translation Panel  (your words ↔ parameters)     │
│         C2. Step Timeline      (always; 1 step if single)    │
│         C3. Prediction Panel   (headline numbers + curve)    │
│         C4. Provenance Panel   (per-field breakdown)         │
│         C5. Warnings Strip     (corrections, notes)          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  D │ FOOTER  (minimal — version, repo link, nothing else)    │
└──────────────────────────────────────────────────────────────┘
```

Regions A, B, D are persistent. Region C changes state based on the request lifecycle.

### 5.3 Region A — Header

Contents:

- Product name: **"Problem Translator"**
- One-line descriptor: *"Natural-language food safety queries, grounded in predictive microbiology"*
- No navigation, no user menu, no theme toggle in v1

Purpose: establishes identity and context for unfamiliar viewers (advisory board, conference). The presenter can point to it once and move on.

### 5.4 Region B — Query Panel

Contents:

- **Textarea** — full-width, auto-growing (min 3 rows, max 8 rows with scroll), generous padding, distinctive typography
- **Submit control** — primary action, Cmd/Ctrl + Enter also submits
- **Example picker** — triggered from a secondary control ("Load example") or visible inline (design decision deferred to Section 8; information architecture just records that it exists here)
- **Character counter** — appears only when approaching the 2000-char limit (see §4.2)

The example picker exposes the 9 curated queries grouped under three persona headings. Selecting an example populates the textarea and does **not** auto-submit — the user (or presenter) reviews the query, then submits. This matters for the demo: the presenter wants to read the query aloud before execution.

### 5.5 Region C — Result Area

Four display states, mutually exclusive:

| State | When | Contents |
|---|---|---|
| **Empty** | On first load with no `?q=`, no submit yet | Onboarding message: what the system does in one sentence, prompt to pick an example or type a query. Not decorative — serves the unfamiliar viewer. |
| **Loading** | Request in flight | Skeleton layout matching the success layout exactly (see §5.6). Active status indicator. Original query echoed for context. |
| **Error** | Transport, validation, or application failure | Original query preserved. Error message (§4.6). Retry action. |
| **Success** | Response parsed, `prediction` is populated | Five panels (C1–C5) rendered in order. |

On resubmit from a success state, the result area transitions to loading (does not flash to empty).

### 5.6 Success state — the five panels

The sequence and purpose of each panel. Visual detail comes in Section 8.

**C1. Translation Panel** — *"your words ↔ system's parameters"*

Two columns or two stacked blocks (layout decision in §8).

- **Left**: the original query, verbatim. Highlighting of the tokens that were extracted as specific parameters (food description, explicit temperatures, durations, pathogens) is a stretch goal — requires either backend support or frontend heuristic matching. For v1: display the original query as plain text without highlighting, and add token highlighting only if implementation is straightforward.
- **Right**: a compact list of the parameters the system ended up using:
  - Organism
  - Model type
  - pH
  - Water activity
  - For **single-step**: temperature and duration
  - For **multi-step**: a note "3 steps — see timeline below" with no temperature/duration here (those belong in C2 to avoid misleading scalars)

This panel answers the question *"what did you understand from what I said?"* It is the bridge between human language and model inputs.

**C2. Step Timeline** — always present

Horizontal timeline showing each step as a segment, with:

- Segment length proportional to duration
- Segment label: temperature and duration
- Per-step Δlog contribution as a secondary annotation
- Visual indication of the dominant step (where most of the growth/inactivation happened)

For single-step scenarios, this renders as one long segment. Same component, same data shape — no special case.

This panel answers: *"where in the scenario did the interesting thing happen?"*

Step-scoped warnings (where correlation is possible — see §4.7) are shown inline on the relevant segment.

**C3. Prediction Panel** — headline numbers + growth curve

Headline figures (large, readable at a glance during a demo from across the room):

- Total log increase (signed — negative for inactivation)
- Organism (with italicised binomial per §4.5)
- Overall confidence (as a percentage, with a small visual indicator)

Supporting figures (smaller):

- μ_max (1/h)
- Doubling time (min or h, per §4.5)
- pH, water activity
- Total duration

**Growth curve** — a plot of bacterial population over time, derived frontend-side. For multi-step scenarios, the curve is piecewise with visible kinks at step boundaries. X-axis: time (minutes, 0 to total duration). Y-axis: log₁₀ CFU change relative to t=0 (not absolute CFU, since we don't know the starting inoculum). Curve computation spec in §5.9.

This panel answers: *"what does the model predict?"*

**C4. Provenance Panel** — per-field breakdown

A table or list (§8 decides) showing every entry from `response.provenance`:

- Field name (humanised)
- Value used
- Source (humanised per §4.5)
- Confidence (as percentage + small visual)
- Notes (raw from API; often contains the citation tag e.g. `[CDC-2011-T3]` or a transformation description)

This panel answers: *"where did each number come from, and how sure are we?"*

It's the auditability story. For the demo audience, this is where the presenter will spend most of their narration time.

**C5. Warnings Strip** — corrections, clamps, notes

Compact list of every entry from `response.warnings`, grouped by type:

- **Corrections applied** (`type: "bias_correction"`) — conservative bias adjustments, field-scoped
- **Values clamped** (`type: "range_clamp"`) — out-of-range values pulled into the model's valid range
- **Notes** (`type: "warning"`) — general warnings, may be unscoped

Field-scoped warnings that can be correlated with a step (§4.7) are *not* duplicated here — they appear on the step in C2. Only genuinely global or non-correlatable warnings appear in C5.

This panel answers: *"what did the system change or flag?"*

### 5.7 Panel ordering rationale

C1 → C2 → C3 → C4 → C5 is a deliberate narrative arc:

1. **C1: Comprehension** — "Here's what I understood"
2. **C2: Decomposition** — "Here's how the scenario unfolds"
3. **C3: Prediction** — "Here's what will happen"
4. **C4: Accountability** — "Here's why each value was chosen"
5. **C5: Corrections** — "Here's what I adjusted along the way"

This order matches how the presenter will narrate: set up the problem, unfold the scenario, deliver the prediction, back up the prediction with sources, acknowledge caveats. Alternative orderings (e.g. prediction first) were considered and rejected — putting the prediction above the translation would invert the value proposition, which is *how* we got to the prediction.

### 5.8 Relationships between panels

The panels are visually independent but conceptually cross-referenced:

- **C1 ↔ C4**: a value mentioned in C1 (e.g. pH 6.7) has a corresponding row in C4 explaining where 6.7 came from. On hover or focus of a C1 value, the matching C4 row is visually emphasised (deferred to §8 if implementation is straightforward; not a correctness concern).
- **C2 ↔ C5**: step-scoped warnings appear inline in C2. C5 contains only the non-step-scoped remainder.
- **C2 ↔ C3**: the growth curve in C3 is synchronised with the timeline in C2. Step boundaries in C2 align horizontally with kinks in the curve in C3 when both are rendered in a column layout.

These relationships are **informational** — they guide the presenter's narration — but not **interactive** in v1 beyond the hover-highlight described above.

### 5.9 Growth curve — computation spec

The only frontend-derived visualisation. Computed from response data:

**For each step** with `mu_max` (1/h) and `duration_minutes`:

- log₁₀ CFU change at time *t* within the step = `mu_max × t / ln(10) / 60`
  - where *t* is minutes elapsed within the step
  - divide by `ln(10)` to convert from natural-log growth rate to log₁₀
  - divide by 60 to convert hours to minutes

**Assembly:**

- Curve starts at `(t=0, log_change=0)`
- At each step boundary, the curve continues from where the previous step ended (no reset)
- Sample resolution: 50 points per step (enough for smooth rendering at demo sizes, cheap to compute)

**Sanity check:** the total `log_change` at the end of the curve must equal `prediction.total_log_increase` (within floating-point tolerance). If it doesn't, the displayed curve is wrong — add a dev-mode assertion to catch schema drift.

**For thermal inactivation:** the same math gives a negative slope when the engine returns negative `mu_max`. The curve descends. No special-case code.

**Caveat:** this is a first-order approximation (constant μ_max within a step, instantaneous transitions between steps). The real ComBase primary model is Baranyi with lag phase, which the frontend does not reimplement. This is documented in the UI via a small label near the curve: *"Simplified visualisation. Exact values: see table."* The total is always consistent with the backend's authoritative total; only the intra-step shape is approximated.

### 5.10 Region D — Footer

Contents:

- Version identifier (from `package.json`)
- Link to project repo / documentation — **rendered inert** (non-hyperlinked text) in v1, since real URLs are not yet defined
- No social links, no legal boilerplate

Purpose: establish professionalism without adding clutter. Approximately 32–48 px tall.

### 5.11 What the information architecture deliberately does not include

Noted here to prevent scope creep during implementation:

- **Tabs or accordions inside panels.** All information is flat and visible. A panel can be long; scrolling is fine.
- **"Advanced" toggle.** No hidden advanced mode in v1.
- **Comparison view.** One query, one result. Comparisons are deferred.
- **Export / share / save actions.** The URL is the share mechanism; no download button, no "copy as markdown" in v1.
- **Settings / preferences.** No dark/light toggle, no density control, no persona filter persistence. All deferred.
- **Landing page / marketing copy.** The header's one-line descriptor is the entirety of the product narrative on-screen.
- **Docs links inside the UI.** Pointers to backend docs, the RAG system, etc., do not appear in v1.

---

## 6. Core User Flows

This section traces each user path through the application, end to end. It supplements §4 (API) and §5 (information architecture) by specifying *behaviour over time*: what happens, in what order, and what the user sees at each moment.

Every flow is specified as a sequence with explicit triggers and outcomes. No screen layout detail (that's §8); no styling (that's §7).

### 6.1 Flow inventory

| ID | Flow | Trigger | Primary audience |
|---|---|---|---|
| F1 | Cold start, then free-text query | User lands on `/` with no `?q=` | Presenter (live demo), independent viewer |
| F2 | Cold start, then pick example, then submit | User lands on `/`, opens picker | Presenter (primary demo path) |
| F3 | Open a shared URL | User lands on `/?q=...` | Demo viewer following a link |
| F4 | Resubmit / re-query after a result | User edits or picks a new query after seeing one | Presenter (walking through multiple examples) |
| F5 | Retry after error | User hits retry on an error state | Any |
| F6 | Share the current result | Presenter copies the URL of a loaded result | Presenter |

Flows not covered (out of scope, noted for completeness): cancelling an in-flight request, offline handling, deep-linking to a specific panel.

### 6.2 F1 — Cold start, free-text query

**Trigger:** User navigates to `/` with no query parameters.

**Steps:**

1. App shell mounts. Reads `URLSearchParams` — finds nothing. Result area shows the **empty state** (§5.5).
2. User types into the textarea. Each keystroke is local state only; no network call.
3. User submits (click or Cmd/Ctrl + Enter). Input is validated: non-empty after trim, ≤ 2000 chars. Submit disabled if invalid.
4. Result area transitions to **loading state**. The user's query is echoed in the loading state so the user sees what they asked while waiting.
5. `useTranslateQuery` fires the mutation. POST to `/api/v1/translate`.
6. On response: Zod validates. On success, result area transitions to **success state** rendering the five panels (§5.6). URL is updated via `history.replaceState` to include `?q=<encoded query>`.
7. Textarea retains the submitted query. Submit is re-enabled (the user could resubmit or edit).

**Failure branches:**

- Transport failure → error state with "Could not reach the server" + retry (§4.6).
- Validation failure (Zod parse error on the response) → error state with "Unexpected response format" + retry.
- Application failure (`success: false`) → error state with the `error` field verbatim + retry.
- Degenerate success (`success: true`, `prediction: null`) → treated as application failure (§4.6).

**Expected duration:** 2–10 s dominated by backend LLM latency.

### 6.3 F2 — Cold start, pick example, submit

**Trigger:** User opens the example picker from the query panel.

**Steps:**

1. Same as F1 step 1.
2. User activates the example picker control. Picker opens, showing the 9 curated queries grouped under three persona headings (§2.4).
3. User selects a query. Picker closes. Textarea is populated with the selected query's verbatim text. **No auto-submit.**
4. User reads the query, then submits. Remainder identical to F1 steps 4–7.

**Why no auto-submit:** the presenter wants to read the query aloud to the audience before executing. Auto-submit would skip the narrative beat.

**Keyboard:** picker entries are keyboard-navigable (arrow keys + Enter to select, Esc to close). Focus returns to the textarea after selection.

### 6.4 F3 — Open a shared URL

**Trigger:** User navigates to `/?q=<encoded-query>`.

**Steps:**

1. App shell mounts. `URLSearchParams` yields `q`. Query is decoded and written into textarea state.
2. Result area transitions directly to **loading state** — the query is already in flight on mount. The user sees the echoed query and the loading skeleton immediately.
3. `useTranslateQuery` fires on mount with the bootstrapped query. Because this is a `useQuery` (not a mutation) keyed by the query string, behaviour depends on cache mode: with `VITE_CACHE_MODE=session`, navigating to the same URL later in the session uses the cache; with `VITE_CACHE_MODE=off` (the default), the backend is always hit.
4. On response: same as F1 steps 6–7. The URL is not rewritten (it's already correct).

**Edge cases:**

- **`q` is empty string** (`?q=`) → treated as no `q`. Empty state.
- **`q` exceeds 2000 chars** → show error state with "Shared query is too long" and let the user edit down.
- **`q` contains only whitespace after decode** → treated as no `q`. Empty state.
- **Malformed URL encoding** → error state with "Could not parse shared query" + a populated textarea with the best-effort decoded string so the user can fix it.

### 6.5 F4 — Resubmit / re-query after a result

**Trigger:** User has a loaded success (or error) state and wants to run a different query.

**Steps:**

1. User edits the textarea, or opens the picker and selects a different example.
2. User submits.
3. Result area transitions from success (or error) to **loading state**. It does *not* flash through the empty state — the transition is direct. Keeps the perceived flow smooth during a live demo.
4. Remainder identical to F1 steps 5–7. The URL is updated to the new query on success.

**Cache behaviour:**

- With `VITE_CACHE_MODE=off` (default): every submit hits the backend. Useful for evaluating different model configurations.
- With `VITE_CACHE_MODE=session`: URL-bootstrapped re-visits of a previously-seen query return from cache instantly; explicit mutation submits still hit the backend (React Query mutations do not check the query cache). During a demo with session caching on, flipping between examples via the picker re-runs the backend; opening a previously-visited shared URL replays from cache.

In both modes the cache is keyed strictly on the query string; minor edits (e.g. trailing whitespace) invalidate the cache.

### 6.6 F5 — Retry after error

**Trigger:** User is in an error state and activates the retry action.

**Steps:**

1. The original query is still in the textarea. The retry action re-submits the same query.
2. Result area transitions from error to loading.
3. Remainder identical to F1 steps 5–7.

**No automatic retry.** The user must explicitly retry. This is deliberate (§4.8): a silent automatic retry could compound a backend issue, and during a demo the presenter wants to see the failure explicitly before recovering.

### 6.7 F6 — Share the current result

**Trigger:** User copies the URL from the browser address bar after a successful result has loaded.

**Steps:**

1. After any successful submit, the URL is `/?q=<encoded query>`.
2. User copies the URL using the browser's native copy (Ctrl+L → Ctrl+C, or right-click).
3. Recipient opens the URL → enters flow F3.

**No dedicated "share" button in v1.** The URL itself is the share mechanism. A copy-to-clipboard button could be added later; flagged as a deferred nicety, not a v1 requirement.

**What is not shared:** the backend response. If the backend's behaviour changes between shares (e.g. RAG is updated), the same `?q=` may produce a different result when the link is opened later. This is correct — the shared link represents the *question*, not a frozen *answer*. Documented here so it doesn't come up as a bug.

### 6.8 State transitions — the result area

Summary diagram of C's state machine:

```
                    ┌──────────┐
   (initial load,   │  EMPTY   │
    no ?q=)        └────┬─────┘
                         │ submit
                         ▼
┌───────┐  retry    ┌──────────┐  response OK   ┌──────────┐
│ ERROR │◀──────────│ LOADING  │───────────────▶│ SUCCESS  │
└───┬───┘  submit   └────▲─────┘                └────┬─────┘
    │                    │                           │
    │  submit            │ submit                    │ submit
    └────────────────────┴───────────────────────────┘
```

Properties worth naming:

- **LOADING is never re-entered from LOADING.** A submit during an in-flight request cancels the previous mutation (React Query behaviour) and starts a new one. The UI does not show two concurrent loaders.
- **EMPTY is only reached on cold start.** There is no way to return to it from any other state during a session. The presenter doesn't need a "clear" button; editing the textarea and not submitting is the closest equivalent.
- **ERROR and SUCCESS are terminal** for a given query — they persist until the next submit.

### 6.9 Timing and perceived performance

The total backend latency (2–10 s) is non-trivial for a demo. The flow design mitigates this:

- **Echoed query during loading.** The user sees their words immediately; only the result is delayed.
- **Skeleton matches final layout.** Structural layout does not reflow on response arrival, only content fills in.
- **Cache hits are instant (session mode only).** In `VITE_CACHE_MODE=session`, flipping back to a previously-visited shared URL has no loading state. In `VITE_CACHE_MODE=off`, every visit incurs backend latency — appropriate for evaluation, less ideal for demo rhythm (revisit the mode choice before the demo).
- **No spinner-only loading.** A centred spinner on an empty page feels broken. The skeleton approach feels intentional.

### 6.10 Input validation

At each input moment, validation applies:

| Trigger | Rule | Failure behaviour |
|---|---|---|
| Submit button click | Query non-empty after trim | Button is disabled when invalid; no error shown |
| Submit button click | Query ≤ 2000 chars | Button disabled when over limit; character counter shown |
| Cmd/Ctrl + Enter | Same as above | No-op when invalid |
| Paste into textarea | No validation on paste itself | User can paste over 2000 chars; submit is then disabled |
| URL-bootstrapped `?q=` | Non-empty after trim + ≤ 2000 chars | Handled in F3 edge cases |

No form library is required for v1 — validation is a handful of conditions on one field.

### 6.11 Accessibility implications of the flow design

Specific behaviours flow design commits to, to be implemented in §8:

- The loading state must announce itself to screen readers (`aria-live="polite"` on the result area).
- The error state must announce itself and must not require a mouse to retry.
- Example picker must be fully keyboard-navigable and dismissible with Esc.
- Focus is managed: after submit, focus moves to the result area heading so screen-reader users land on the new content.
- URL changes via `history.replaceState` do not cause focus jumps or content re-mounts.

### 6.12 What the flows deliberately do not do

- **No confirmation before submit.** The user types and submits; no "are you sure?" step.
- **No undo.** Submitting is not destructive; undo is unnecessary.
- **No in-flight cancel button.** If the user really wants to cancel, they close the tab. Cancel adds UI weight and state-machine complexity for a corner case.
- **No "run again" action.** The submit button already does this if the query is unchanged.
- **No drafts or auto-save.** If the user closes the tab mid-typing, the query is lost. Acceptable for v1; revisitable if a "history" feature ever arrives.

---

## 7. Visual Design System & UI Patterns

This section defines the visual identity and component patterns. It answers: what does the app look like, and how is that look maintained consistently?

The goal, per §1.2, is to be **visually distinctive and professional** in the lineage of scientific and auditable interfaces — not generic chat-LLM aesthetics — without inventing novel interaction patterns.

### 7.1 Design direction

**Reference points** (for mood, not mimicry):

- **Linear** — confident typography, tight spacing, generous contrast, restrained palette
- **Observable** — data-first, monospace for numbers, serif accents signalling scientific authority
- **Bloomberg Terminal** (influence only, not imitation) — information density as a virtue, every pixel earns its place
- **Regulatory dashboards** (EFSA, FDA compliance tools) — dense but ordered, provenance visible, uncertainty acknowledged

**Design adjectives (in priority order):**

1. **Auditable** — every value traceable, every claim sourced, no hidden magic
2. **Scientific** — numeric precision, domain-appropriate typography, no marketing gloss
3. **Considered** — spacing and alignment feel deliberate, not generated
4. **Calm** — the UI carries information weight; the design does not add to it
5. **Distinctive** — recognisably this product, not a template

**Design anti-adjectives** (what we're explicitly avoiding):

- Playful, whimsical, rounded-everything
- Chat-bubble patterns, AI-assistant visual tropes, purple gradients
- Glassmorphism, neumorphism, heavy shadows, floating cards
- Stock illustrations, emoji as content, decorative backgrounds
- Bootstrap default aesthetics

### 7.2 Visual identity

**Hybrid aesthetic** combining two influences:

- **Scientific document tradition** — serif headings for gravitas, footnote-style citations, tabular precision for numbers
- **Modern technical product** — clean sans-serif body, confident spacing, subtle interaction affordances

The combination is the distinctive signal. Pure scientific paper feels dusty; pure modern-SaaS feels generic. The overlap is the signature.

**Density:** medium-high. Not Bloomberg-dense (that would alienate non-experts in the audience), but denser than a typical SaaS landing page. The demo audience includes people who read technical documents; treat them as such.

### 7.3 Colour system

Design tokens defined in `styles/globals.css` as CSS variables, consumed by Tailwind config and shadcn/ui primitives. Single source of truth.

**Palette philosophy:** near-monochrome base, colour used semantically. Colour is information, not decoration.

**Light mode (primary; dark mode deferred to §7.12):**

| Token | Role | Value (indicative) |
|---|---|---|
| `--background` | Page background | Near-white, very slightly warm (e.g. `#FAFAF7`) |
| `--surface` | Panel background | True white |
| `--surface-muted` | Subtle panel variants, table rows | `#F4F4F1` |
| `--border` | Panel and divider lines | `#E4E4DF` |
| `--border-strong` | Emphasised separators | `#C8C8C2` |
| `--text` | Primary text | Near-black, slightly warm (e.g. `#1A1A17`) |
| `--text-muted` | Secondary text | `#5B5B55` |
| `--text-subtle` | Tertiary text, metadata | `#8A8A82` |
| `--accent` | Primary interactive, focus rings | Deep ink — e.g. `#2E3A4C` (dark slate blue) |
| `--accent-fg` | Text on accent | White |

**Semantic (functional) colours**, used sparingly:

| Token | Role | Value (indicative) |
|---|---|---|
| `--confidence-high` | Confidence ≥ 0.85 indicator | Muted forest green |
| `--confidence-medium` | 0.60 ≤ confidence < 0.85 | Muted ochre |
| `--confidence-low` | < 0.60 | Muted terracotta |
| `--warning` | Warnings strip accent (non-urgent) | Amber-brown |
| `--correction` | Bias corrections | Muted violet |
| `--danger` | Error state, critical warnings | Deep red (not bright) |
| `--growth` | Growth curve / positive log change | Same as `--warning` family |
| `--inactivation` | Inactivation / negative log change | Cool teal-blue |

**Principles:**

- Semantic colours are **muted**, not saturated. Bright green and bright red would make the UI feel like a dashboard from 2005; muted tones feel scientific.
- The accent colour is the only "brand" colour. It is used for the submit button, focus rings, and primary links. Nothing else.
- No gradients anywhere. Solid fills only.
- Colour is always paired with a non-colour cue (icon, text, position) to preserve meaning for colour-blind users and to pass WCAG.

Exact hex values are indicative. Final tuning happens during implementation with the frontend-design skill.

### 7.4 Typography

**Two-family system:**

- **Body / UI: Inter** — clean, highly legible, excellent at small sizes, variable-weight. The workhorse.
- **Display / scientific emphasis: a restrained serif** — Source Serif 4 or similar. Used for panel headings and the product wordmark. Signals scientific authority; counterbalances Inter's neutrality.
- **Numeric: JetBrains Mono or IBM Plex Mono** — monospace for model outputs, confidence percentages, and anywhere numbers are tabular. Tabular numerals prevent layout shift when values change and signal "this is data."

All three are open-source, widely available, pair well.

**Type scale** (approximate; refined in implementation):

| Level | Use | Size / weight |
|---|---|---|
| Display | Product wordmark | 24px serif, medium |
| H1 | Panel titles (C1–C5) | 18px serif, semibold |
| H2 | Sub-panel headings | 14px sans, semibold, letter-spaced, uppercase-ish |
| Body | General text | 14px sans, regular |
| Body-small | Metadata, notes | 13px sans, regular |
| Numeric-large | Headline prediction numbers | 32px mono, medium, tabular |
| Numeric-medium | Secondary stats | 16px mono, regular, tabular |
| Numeric-small | Inline numbers | 13px mono, regular, tabular |
| Citation | Source tags like `[CDC-2011-T3]` | 12px mono, subtle colour |

**Rules:**

- Numbers always in mono. This is non-negotiable — it's a core signal of scientific seriousness and prevents jitter.
- Scientific binomials (e.g. *Staphylococcus aureus*) italicised per convention.
- No more than three type sizes visible in any single panel.
- Line height: body text at 1.5, headings at 1.2.

### 7.5 Spacing and layout

**Base unit:** 4 px. All spacing is multiples of 4 (4, 8, 12, 16, 24, 32, 48, 64).

**Panel rhythm:** panels are separated by 32 px vertical gap. Internal panel padding is 24 px. Sub-sections within a panel use 16 px.

**Container width:** max 1280 px, centred. At wider viewports, the content stays centred with white space on either side — this is intentional and aligns with the scientific-document influence.

**Grid:** 12-column grid inside the max-width container, 24 px gutters. Panels that need two-column layout (e.g. C1's "words ↔ parameters") use a 6-6 split.

**Alignment:** ruthlessly consistent. All labels left-aligned; all numbers right-aligned within a column. No centred body text anywhere.

### 7.6 Panel chrome

The container for each of C1–C5. One consistent treatment; no visual variety between panels.

- Surface colour: `--surface` (true white)
- Border: 1 px solid `--border`, no shadow
- Corner radius: 4 px (subtle — not 12 px, not 0 px)
- Header bar: panel title (serif H1), optional supporting label (sans H2 subtitle), no icons, no close buttons
- Padding: 24 px all sides
- Separators within a panel: 1 px solid `--border`, full-bleed horizontal rule

No cards-within-cards. Nested surfaces flatten to shared background + border treatments.

### 7.7 Component patterns

Cross-cutting UI patterns referenced repeatedly in Section 8.

**Confidence indicator** — used in C3 (overall), C4 (per-field), anywhere a `confidence` value appears.

- Small horizontal bar, 48 px wide × 4 px tall, rounded corners
- Fill colour from the `--confidence-*` tokens based on value
- Paired with the numeric percentage immediately after, mono, tabular
- On hover or focus: tooltip explaining the confidence threshold bands
- Accessible via `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

**Source badge** — used in C4 (provenance source column), optionally elsewhere.

- Small pill with the humanised source label (§4.5: "Retrieved (RAG)", "From your query", "Inferred", "Default")
- Neutral surface with a coloured left stripe (4 px) — colour distinguishes source category
- Mono font, 12 px
- Not a link in v1 (no linked sources yet)

**Citation tag** — for text like `[CDC-2011-T3]` that appears in `provenance[].notes`.

- Rendered in mono, `--text-subtle`, slightly smaller than body
- No hyperlink in v1 — deferred until a source-reference lookup table is wired in

**Key-value row** — used in C1 (right side), C3 (supporting stats), C4, anywhere a labelled scalar appears.

- Label left, value right, separated by flex layout with a subtle dotted leader line in the gap (nod to scientific reports)
- Label in sans, `--text-muted`, 13 px
- Value in mono, `--text`, 14 px, tabular

**Inline numeric** — for numbers embedded in sentences.

- Mono font, slightly darker than surrounding text, no unit prefix/suffix styling (units in sans)

**Step segment** (C2 timeline) — detail in §8.

- Rectangular segment, full timeline height
- Subtle background fill whose intensity encodes per-step Δlog contribution (darker = more growth/kill)
- Top-aligned label: temperature
- Bottom-aligned label: duration
- Vertical divider (`--border-strong`) between steps

**Warning row** (C5) — detail in §8.

- Horizontal row with a small semantic icon (lucide), type label in sans, message in sans, field name in mono if present
- Icon colour from `--warning` / `--correction` / `--danger` tokens
- No background fill unless the warning is `--danger` class

**Button — primary (submit)**

- Solid `--accent` background, `--accent-fg` text
- 40 px tall, 16 px horizontal padding
- Sans, 14 px, medium weight
- On hover: slight darkening of the accent
- On focus: 2 px offset ring in `--accent`
- On disabled: 40% opacity
- No icon unless absolutely warranted

**Button — secondary ("Load example")**

- Transparent background, 1 px `--border` outline, `--text` text
- Same dimensions as primary
- On hover: `--surface-muted` background
- On focus: same ring as primary

**Textarea (query input)**

- Larger than standard — min 96 px tall (3 rows), auto-grows to max ~256 px (8 rows), then scrolls
- 16 px font, sans — intentionally larger than body text, signals that this is the primary input
- Generous padding (16 px)
- 1 px `--border`, 4 px radius
- On focus: border shifts to `--accent`, 2 px outer ring in `--accent` at 20% opacity
- No placeholder mimicking a "chat" prompt. Placeholder is neutral guidance, e.g. "Describe a food safety scenario…"

**Link**

- `--accent` colour, no underline by default, underline on hover and focus
- No visited-state styling — scope is too small to matter

### 7.8 Iconography

**Source:** lucide-react, no other icon library.

**Rules:**

- Stroke width: 1.5 px (lucide default is 2; 1.5 pairs better with the lighter typographic weight we're using)
- Size: 16 px inline with body text, 20 px in headers, 14 px in compact UI
- Icons never appear decoratively. Every icon has a semantic role or is a button affordance.
- No icon inside the textarea, no icon on the submit button in v1
- Confidence, warnings, corrections, and source categories each use one consistent icon throughout

### 7.9 Motion and interaction

**Philosophy:** motion confirms user actions and smooths state transitions. It is never decorative.

**Allowed transitions:**

- Fade + slight vertical movement (8 px) when the result area transitions between states (empty → loading → success). Duration 200 ms, ease-out.
- Skeleton shimmer during loading, 1.5 s cycle, subtle opacity change only (no gradient sweep)
- Focus ring appearance, 100 ms
- Hover state changes, 150 ms ease

**Not allowed:**

- Spring / bounce physics
- Parallax, scroll-triggered animations
- Animated illustrations of any kind
- Loading spinners except as a last resort (the skeleton is the primary loading affordance)
- Auto-playing transitions that draw attention to themselves (e.g. a chart that "types in" its data)

**Reduced motion:** respect `prefers-reduced-motion: reduce`. All transitions collapse to instant state changes. Skeleton shimmer becomes a static muted fill.

### 7.10 Data visualisation — the growth curve (C3)

Detailed layout in §8; styling rules here.

- **Axes:** thin `--border-strong` lines, labels in mono small, tick marks every sensible interval
- **Curve colour:** `--growth` when positive, `--inactivation` when negative. Piecewise segments inherit the colour of the overall sign of `total_log_increase` — we do not flip colour mid-curve even if a single step has zero contribution.
- **Step boundaries:** thin vertical dashed lines in `--border-strong`, extending the full height of the plot area, with a small mono label at the top ("Step 1 → 2")
- **Area under curve:** filled at 15% opacity of the curve colour. Gives visual weight without dominating.
- **Gridlines:** horizontal only, at major log₁₀ increments (0, ±1, ±2, ±3). In `--border` at 50% opacity.
- **No legend.** The curve represents one thing; labels are inline.
- **No chart title.** The panel title is the chart title.
- **Approximation label:** small mono text, `--text-subtle`, bottom-right corner: "Simplified visualisation — see table for exact per-step values."
- **Empty state (shouldn't occur but handled):** plot area renders with axes and a centred neutral message "No prediction data."

### 7.11 Responsive behaviour

**Primary target:** 1280–1920 px desktop. This is the demo environment.

**Secondary:** graceful degradation down to 1024 px. At this width, some two-column panels collapse to stacked layout. No content is removed.

**Below 1024 px:** functional but unpolished. No dedicated mobile design in v1. The app should not *break* on a tablet, but it is not tuned for one.

**Above 1920 px:** content stays centred at max 1280 px; side margins grow. No wide-screen expansion.

### 7.12 Dark mode

Deferred from v1. Design tokens are defined via CSS variables specifically to make dark mode a later additive change rather than a refactor. Token names (`--background`, `--surface`, `--text`) are value-agnostic by design.

**Not in scope for v1:** the dark palette, the toggle, the persistence mechanism.

**In scope for v1:** the discipline of only using token variables in component styles, so that swapping the token values is the whole migration.

### 7.13 Accessibility

Commitments that constrain the visual design:

- **Colour contrast:** all text–background pairs meet WCAG AA (4.5:1 for body, 3:1 for large text). This drives the choice of near-black text on near-white backgrounds; pure white-on-white is not available.
- **Focus visibility:** every interactive element has a visible focus state using `--accent`. The focus ring is 2 px, offset 2 px from the element, to remain visible against varied backgrounds.
- **Non-colour cues:** semantic colour is always paired with icon or text (e.g. confidence indicator has numeric percentage; warnings have icon + type label).
- **Font size floor:** 12 px for any body-like content. 10–11 px permitted only for genuinely secondary metadata where the user is not expected to rely on it.
- **Line length:** body prose capped at ~70 characters to stay readable.
- **Reduced motion:** per §7.9.

### 7.14 Implementation notes for Claude Code

When the frontend-design skill is activated:

- **Tokens first, components second.** Define `globals.css` tokens before touching any component. Panel chrome, button styles, and input styles all read from tokens; they are not independently styled.
- **shadcn/ui primitives are a starting point, not a constraint.** We are adopting the accessibility and composition model, but overriding visual styling via the token system. A shadcn button should not look like "a shadcn button"; it should look like *this product's* button.
- **No Tailwind arbitrary-value soup.** If the same arbitrary value appears three times, it becomes a token. If the same combination of utilities appears three times, it becomes a component class or a shared component.
- **Font loading:** self-host the three fonts (Inter, Source Serif 4, JetBrains Mono) via `@font-face` in `globals.css` with `font-display: swap`. No Google Fonts runtime request.
- **Iconography stays lucide.** Do not introduce Heroicons, Phosphor, or Material Icons alongside.

---

## 8. Screen-by-Screen Specifications

This is the longest section in the spec. It pins down exact layouts, content, and states for each region defined in §5. Layout measurements are in pixels at the 1280 px target width; they adapt per §7.11.

### 8.1 Overall page layout

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  A │ HEADER                                  64 px tall       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              32 px gap                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  B │ QUERY PANEL                             ~200 px tall     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              32 px gap                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  C │ RESULT AREA                             variable height   │  │
│  │     State-dependent: empty / loading / error / success       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              32 px gap                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  D │ FOOTER                                  40 px tall        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
Page: max-width 1280, centred, 32 px side padding, 32 px top/bottom padding.
Background: --background.
```

### 8.2 Region A — Header

**Layout (left-to-right, 64 px tall, single row):**

```
┌───────────────────────────────────────────────────────────────────┐
│  Problem Translator   |   [One-line descriptor]                   │
└───────────────────────────────────────────────────────────────────┘
```

- **Product name:** *"Problem Translator"* — display serif, 24 px, medium weight, `--text`.
- **Vertical divider:** 1 px, 24 px tall, `--border-strong`, centred vertically, 16 px horizontal margin on each side.
- **Descriptor:** sans, 14 px, regular, `--text-muted`. Copy: *"Natural-language food safety queries, grounded in predictive microbiology."*
- **No navigation, no menu, no user area.**

Separator below header: 1 px horizontal rule, full-width, `--border`, 32 px below header baseline.

### 8.3 Region B — Query Panel

**Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│  Your scenario                                                    │
│  ─────────────────                                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │   [Textarea — auto-growing]                                 │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Load example ▾]                    1247 / 2000      [Translate] │
└───────────────────────────────────────────────────────────────────┘
Panel chrome: white surface, 1 px --border, 4 px radius, 24 px padding.
```

**Panel header:** serif H1 "Your scenario", H2 subtitle not used here.

**Textarea:**
- Full panel width minus padding
- Min height 96 px (~3 rows), max 256 px (~8 rows) before scroll
- Placeholder: *"Describe a food safety scenario in your own words…"*
- Font: 16 px sans (larger than body, signalling primary input)
- Submit shortcut: Cmd/Ctrl + Enter

**Footer row of the panel** (below textarea, 16 px gap):
- Left: "Load example" secondary button with a small chevron-down icon. Opens picker (§8.4).
- Middle-right: character counter. Only appears when length ≥ 1800. Format: `1847 / 2000`. At ≥ 2000: counter turns `--danger` and the Translate button disables.
- Right: primary "Translate" button. Disabled when query is empty (after trim) or over limit.

**Focus flow on load:** textarea receives focus automatically so the presenter can start typing immediately.

### 8.4 Example picker (popover anchored to "Load example" button)

**Presentation:** popover anchored below-left of the button. 480 px wide, height fits content (9 entries + 3 group headings), max-height 480 px with internal scroll if the viewport is short. Closes on Esc, on click outside, or after selection.

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  RISK ASSESSORS                                         │
│  ─────────────────                                      │
│  A1  Listeria in vacuum-packed deli meat…        [⏎]    │
│  A2  Salmonella on ground beef — transport…      [⏎]    │
│  A7  B. cereus in buffet rice…                   [⏎]    │
│                                                         │
│  REGULATORY INSPECTORS                                  │
│  ─────────────────────                                  │
│  B1  Failed refrigeration — poultry truck…       [⏎]    │
│  B2  Hot-holding deviation — chicken soup…       [⏎]    │
│  B7  Frozen turkey thawing on counter…           [⏎]    │
│                                                         │
│  INDUSTRY HACCP / QA                                    │
│  ────────────────────                                   │
│  C1  Overnight refrigeration breakdown…          [⏎]    │
│  C2  Chicken nuggets — thermal inactivation…     [⏎]    │
│  C3  Cooked ham cooling validation…              [⏎]    │
└─────────────────────────────────────────────────────────┘
```

**Entry format:**
- Two-letter ID in mono, `--text-subtle`, 12 px — serves as a stable handle for narration
- One-line summary in sans, 14 px, truncated with ellipsis at 380 px
- The full query text is *not* shown in the picker — the full text appears in the textarea after selection
- Hover/focus state: `--surface-muted` row background
- Keyboard: up/down arrows move selection, Enter selects, Esc closes

**Group headings:** sans 12 px, uppercase, letter-spaced, `--text-subtle`, with a 1 px rule below.

**Behaviour after selection:**
1. Popover closes
2. Textarea is populated with the full verbatim query (§2.4)
3. Focus returns to textarea
4. Cursor is at the end of the pasted text (not "all selected")
5. **No auto-submit** (§6.3)

The one-line summaries are authored in the `exampleQueries.ts` data file alongside the full queries. They are not generated from the full text.

### 8.5 Region C — Result Area

State machine per §6.8. Each state specified below.

#### 8.5.1 Empty state

First load, no `?q=`, no submit.

**Layout:** single panel, same chrome as the others, ~180 px tall, centred content.

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                                                                   │
│           Translate a food safety scenario to see grounded        │
│                      predictions and their provenance.            │
│                                                                   │
│          Try an example from above, or describe your own.         │
│                                                                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

- Two lines of body copy, sans 14 px, `--text-muted`, centred
- No illustration, no icon, no call-to-action button (the call-to-action is already in §8.3)
- The space is intentionally quiet — it is transient

#### 8.5.2 Loading state

Triggered on submit or on URL bootstrap. Persists until response.

**Design principle (§6.9):** the layout is the final layout, with content replaced by skeleton placeholders. When the response arrives, content fills in place; no layout reflow.

**Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│  Translating your scenario…                                       │
│  ──────────────────────────                                       │
│                                                                   │
│  Your query:                                                      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  "The refrigeration chamber for our turkey storage broke  │   │
│  │   down overnight…"                                         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░  ░░░░░░░░░░░░░░░  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                   │
│  Extracting parameters · grounding in sources · running model     │
└───────────────────────────────────────────────────────────────────┘
```

- Panel title: "Translating your scenario…" (serif H1)
- **Query echo block** — the submitted query in a bordered inset, 12 px padding, `--surface-muted` background, mono 14 px text, max 3 lines shown with trailing ellipsis if longer
- **Skeleton blocks** — 3–5 grey rectangles (`--border` fill), rough shapes matching the eventual panels (C1 two-column, C2 single long bar, C3 mixed)
- **Bottom status line** — "Extracting parameters · grounding in sources · running model" in `--text-subtle`, 13 px. This is a static three-phase label, not an animated live status (no streaming per §4.9). It communicates what's happening conceptually.
- **Shimmer:** subtle opacity cycle on skeleton blocks per §7.9
- **Accessibility:** the region has `aria-busy="true"` and `aria-live="polite"`

Duration typically 2–10 s. Never shorter than ~400 ms (even cached responses briefly show the loading state to avoid jarring flashes) — except when the cache hit is instantaneous in `VITE_CACHE_MODE=session`, in which case loading is skipped entirely.

#### 8.5.3 Error state

Triggered by transport failure, validation failure, application failure, or degenerate success (§4.6).

**Layout:**

```
┌───────────────────────────────────────────────────────────────────┐
│  ⚠  Translation did not complete                                  │
│  ─────────────────────────────────                                │
│                                                                   │
│  [Humanised error message — see table below]                      │
│                                                                   │
│  Your query:                                                      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  "…"                                                       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [Try again]     [Edit and resubmit]                              │
└───────────────────────────────────────────────────────────────────┘
```

- Panel title: "Translation did not complete", prefixed with a lucide `AlertTriangle` icon in `--danger`
- Error message per table below, sans 14 px, `--text`
- Query echo block identical to loading state
- Two actions:
  - **Try again** — primary button, re-submits the same query (F5)
  - **Edit and resubmit** — secondary button, focuses the textarea in region B, scrolls into view if needed; no resubmit until user submits explicitly
- **Accessibility:** `role="alert"` on the panel, announces on transition-in

**Error message table:**

| Case (§4.6) | Displayed message |
|---|---|
| Transport failure | *"Could not reach the backend. Make sure the server is running at `http://localhost:8000` and try again."* |
| Validation failure (Zod) | *"The backend returned an unexpected response format. This usually means the frontend and backend versions are out of sync."* (dev-mode: also show Zod error message in a collapsed details block) |
| Application failure (`success: false`) | The `error` field from the response verbatim, prefixed with *"The backend reported:"* |
| Degenerate success | *"Translation completed, but no prediction was produced. Try rephrasing the query."* |
| Network timeout | *"The backend took too long to respond. Try again, or simplify the scenario."* (timeout threshold not enforced in v1 — kept for when one is added) |

#### 8.5.4 Success state

Triggered when response parses and `prediction` is populated. The five panels (C1–C5) render in order.

```
┌───────────────────────────────────────────────────────────────────┐
│  C1 │ Translation Panel                                            │
├───────────────────────────────────────────────────────────────────┤
│                            24 px gap                               │
│  C2 │ Step Timeline                                                │
├───────────────────────────────────────────────────────────────────┤
│                            24 px gap                               │
│  C3 │ Prediction Panel                                             │
├───────────────────────────────────────────────────────────────────┤
│                            24 px gap                               │
│  C4 │ Provenance Panel                                             │
├───────────────────────────────────────────────────────────────────┤
│                            24 px gap                               │
│  C5 │ Warnings Strip                                               │
└───────────────────────────────────────────────────────────────────┘
Panels stacked vertically, each with its own chrome.
Gap between panels: 24 px.
```

Detailed specifications per panel below.

### 8.6 C1 — Translation Panel

**Purpose (§5.6):** "your words ↔ system's parameters".

**Layout:** two columns, 6-6 split of the 12-column grid, 24 px gutter.

```
┌───────────────────────────────────────────────────────────────────┐
│  How the scenario was understood                                   │
│  ─────────────────────────────────                                 │
│                                                                    │
│  ┌───────────────────────────┐  ┌─────────────────────────────┐   │
│  │  YOUR WORDS                │  │  SYSTEM PARAMETERS           │   │
│  │                            │  │                              │   │
│  │  "The refrigeration        │  │  Organism        S. aureus   │   │
│  │   chamber for our turkey   │  │  Model type      Growth      │   │
│  │   storage broke down       │  │  pH              6.7         │   │
│  │   overnight. When we came  │  │  Water activity  0.99        │   │
│  │   in this morning, the     │  │                              │   │
│  │   temperature was reading  │  │  3 steps — see timeline      │   │
│  │   13 °C…"                  │  │                              │   │
│  │                            │  │                              │   │
│  └───────────────────────────┘  └─────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

**Panel header:** serif H1 "How the scenario was understood". No subtitle.

**Left column — "YOUR WORDS":**
- Small H2 heading "YOUR WORDS" (sans 12 px, uppercase, letter-spaced, `--text-subtle`)
- Query rendered as body prose, sans 14 px, `--text`, line-height 1.6
- Inset slightly (16 px left padding) with a 2 px left border in `--border-strong` — a quiet "blockquote" effect
- No text highlighting in v1 (stretch goal per §5.6 not implemented)
- Long queries (> 500 chars) scroll within the column up to a max height of 240 px

**Right column — "SYSTEM PARAMETERS":**
- Small H2 heading "SYSTEM PARAMETERS"
- Key-value rows using the pattern from §7.7
  - Organism (italicised per §4.5 — *Staphylococcus aureus*)
  - Model type (humanised)
  - pH (mono, 2 decimals unless integer)
  - Water activity (mono, 2 decimals)
- **If single-step:**
  - Temperature (mono, with unit)
  - Duration (mono, per §4.5)
- **If multi-step:**
  - A single row: sans label "Profile" — value text *"N steps — see timeline below"* in `--text-muted`
  - Temperature and duration are NOT shown here (§4.7 quirk — they would be misleading scalars)
- No inline warnings in this panel

**Responsive:** at widths < 1024 px the two columns stack; "YOUR WORDS" on top.

### 8.7 C2 — Step Timeline

**Purpose (§5.6):** *"where in the scenario did the interesting thing happen?"*

**Layout:** full panel width, fixed height 160 px for the timeline + 24 px for header.

```
┌───────────────────────────────────────────────────────────────────┐
│  Scenario timeline                                                 │
│  ──────────────────                                                │
│                                                                    │
│  ┌──────────┬────────────────┬─────────────────────────────────┐  │
│  │  28 °C   │     22 °C      │            4 °C                 │  │
│  │          │                │                                  │  │
│  │  +0.40   │    +0.28       │    +0.01 log₁₀                  │  │
│  │          │                │                                  │  │
│  │  45 min  │     1 h        │            2 h                  │  │
│  └──────────┴────────────────┴─────────────────────────────────┘  │
│   step 1        step 2                   step 3                    │
│                                                                    │
│  Total duration: 3 h 45 min           Total: +0.69 log₁₀           │
└───────────────────────────────────────────────────────────────────┘
```

**Panel header:** serif H1 "Scenario timeline".

**Timeline bar:**
- Full width of the panel interior
- Height 120 px
- Segments laid out proportionally to `duration_minutes` — no minimum segment width except a readability floor (e.g. if a segment would be < 60 px wide, minimum of 60 px is enforced and other segments shrink accordingly)
- Segment fill colour: `--growth` or `--inactivation` based on sign of `total_log_increase`, opacity encoding per-step |Δlog| / max |Δlog| across steps (10% for the smallest, 70% for the largest, linear interpolation)
- Vertical dividers between segments: 1 px `--border-strong`
- Outer border: 1 px `--border`, 4 px radius

**Segment labels (inside each segment):**
- **Top-aligned:** temperature in mono-large (18 px), tabular, with `°C` in sans-small
- **Centre:** per-step Δlog contribution in mono (14 px), signed, with `log₁₀` in sans-small, `--text-muted`
- **Bottom-aligned:** duration in mono (13 px), humanised per §4.5

If a segment is narrow (< 100 px after proportional layout), labels stack vertically centred instead. If a segment is very narrow (< 60 px — the floor), only temperature is shown inside and the rest moves to a tooltip on hover.

**Segment labels (below each segment):**
- "step 1", "step 2", etc. in sans-small, `--text-subtle`, centred under segment

**Footer row (below timeline, 16 px gap):**
- Left: "Total duration: 3 h 45 min" in sans 13 px, mono for the number
- Right: "Total: +0.69 log₁₀" in sans 13 px, mono for the number, sign-coloured (`--growth` positive, `--inactivation` negative)

**Single-step scenarios:** render the same component with one segment spanning the full width. No footer "Total" since it equals the single segment's value, but the footer remains (keeps the layout consistent).

**Step-scoped warning indicator:** if a warning is correlated to a specific step (§4.7 heuristic), a small `AlertCircle` icon (12 px, `--warning`) is overlaid on the segment's top-right corner. On hover/focus, the warning message appears in a tooltip.

**Accessibility:** the timeline has `role="img"` with an `aria-label` summarising the profile in text ("3-step profile: 28°C for 45 min, 22°C for 1 h, 4°C for 2 h. Total 3 h 45 min, +0.69 log₁₀ S. aureus."). Each segment is a `<button>` so keyboard users can tab through and see warnings in tooltips.

### 8.8 C3 — Prediction Panel

**Purpose (§5.6):** *"what does the model predict?"*

**Layout:** two columns, 4-8 split of the 12-column grid. Left: headline numbers. Right: growth curve.

```
┌───────────────────────────────────────────────────────────────────┐
│  Prediction                                                        │
│  ──────────                                                        │
│                                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐ │
│  │                          │  │  ╭──────── curve ─────────╮    │ │
│  │      +0.69               │  │  │                        │    │ │
│  │      log₁₀               │  │  │                        │    │ │
│  │                          │  │  │   [growth curve plot]  │    │ │
│  │  S. aureus growth        │  │  │                        │    │ │
│  │                          │  │  ╰────────────────────────╯    │ │
│  │  Confidence   61%  ████░ │  │   Simplified visualisation —   │ │
│  │                          │  │   see table for exact values.  │ │
│  │  ────────────────        │  │                                 │ │
│  │                          │  │                                 │ │
│  │  μ_max (step 1)   1.23/h │  │                                 │ │
│  │  Doubling time      34 m │  │                                 │ │
│  │  Total duration   3 h 45 │  │                                 │ │
│  │                          │  │                                 │ │
│  └─────────────────────────┘  └─────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

**Panel header:** serif H1 "Prediction".

**Left column — headline:**

- **Headline number** — `+0.69` in numeric-large (32 px mono, tabular, signed), followed by "log₁₀" in sans-medium `--text-muted` directly below
- **Headline label** — "S. aureus growth" (or "S. aureus inactivation" for negative; italicised binomial), sans 14 px, `--text-muted`
- **Confidence row** — "Confidence" label, percentage in mono, bar indicator per §7.7, 16 px below headline
- **Horizontal rule** — 1 px `--border`, full column width, 16 px top and bottom margin
- **Supporting stats** — key-value rows per §7.7:
  - μ_max (with an annotation "(step 1)" in `--text-subtle` for multi-step, or no annotation for single-step)
  - Doubling time
  - Total duration

**Right column — growth curve:**

- **Plot area:** 240 px tall, full column width
- **X-axis:** time in minutes, range 0 to total duration, tick marks at step boundaries and at major round intervals
- **Y-axis:** log₁₀ CFU change (from t=0), range auto-fit to curve with a minimum range of ±0.5
- **Curve:** piecewise line, 2 px stroke, colour per §7.10
- **Step boundaries:** thin vertical dashed lines in `--border-strong`, small label at top "1 → 2", "2 → 3"
- **Area under curve:** 15% opacity fill
- **Gridlines:** horizontal only at integer log₁₀ values
- **Approximation label:** below the plot, mono 11 px, `--text-subtle`, right-aligned: *"Simplified visualisation — see table for exact per-step values."*

**Responsive:** at widths < 1024 px the columns stack, curve on top, headline below.

### 8.9 C4 — Provenance Panel

**Purpose (§5.6):** *"where did each number come from, and how sure are we?"*

**Layout:** full-width table.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Provenance of grounded values                                           │
│  ──────────────────────────────                                          │
│                                                                          │
│  FIELD        VALUE    SOURCE              CONFIDENCE   NOTES            │
│  ─────        ─────    ──────              ──────────   ─────            │
│  pH           6.7      Retrieved (RAG)     66%  ████░   Range 6.5–6.7;   │
│                                                         upper bound used │
│  Organism     S. aureus  Retrieved (RAG)   77%  █████   [CDC-2011-T3]    │
│                                                                          │
│  ─────                                                                    │
│  Overall confidence   61%  ████░                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Panel header:** serif H1 "Provenance of grounded values". H2 subtitle (optional): sans 12 px `--text-subtle` — *"Only fields that required grounding are shown."*

**Table structure:**
- 5 columns: **Field**, **Value**, **Source**, **Confidence**, **Notes**
- Column widths (approx.): 140 / 160 / 180 / 180 / flex
- Header row: sans 12 px uppercase letter-spaced `--text-subtle`, 1 px `--border` rule below
- Body rows: sans 14 px; numbers and citations in mono
- Row padding: 12 px vertical, 0 horizontal (columns handle gutters)
- Alternating row backgrounds: no. Rows separated by 1 px `--border` horizontal rules instead (cleaner, more document-like)

**Cell content rules:**
- **Field:** humanised field name in sans, e.g. *"pH"*, *"Organism"*, *"Water activity"*
- **Value:** mono. If raw value is the literal string `"N/A"` (§4.7), render as an em-dash (`—`) in `--text-subtle`
- **Source:** source badge per §7.7
- **Confidence:** percentage in mono + bar indicator, aligned in a sub-row with the percentage first
- **Notes:** sans 13 px, `--text-muted`; citation tags (regex `/\[[A-Z]+-\d+.*?\]/`) rendered as citation tags per §7.7

**Footer row (separated by a 1 px `--border-strong` rule, 12 px padding):**
- "Overall confidence" label, sans 14 px
- Percentage in mono, bar indicator — same pattern as per-field confidence

**Empty provenance list:** if `response.provenance` is empty (possible when all values were user-explicit), replace the table with a single line: *"All values were taken directly from your query. No grounding was required."* in sans 14 px `--text-muted`, then the overall-confidence footer row.

**Responsive:** at widths < 1024 px the Notes column drops below each row (becomes a second line), and the table renders as labelled rows instead of columns.

### 8.10 C5 — Warnings Strip

**Purpose (§5.6):** *"what did the system change or flag?"*

**Layout:** full-width list, grouped by warning type.

```
┌───────────────────────────────────────────────────────────────────┐
│  Corrections and notes                                             │
│  ─────────────────────                                             │
│                                                                    │
│  CORRECTIONS APPLIED                                               │
│  ─────────────────────                                             │
│  ⚙  water_activity    No water activity specified. Using           │
│                       conservative high default (0.99) which       │
│                       maximises predicted growth.                  │
│                                                                    │
│  NOTES                                                             │
│  ─────                                                             │
│  ℹ  (attached to step 3 — see timeline)                           │
│     Temperature 4.0 °C outside valid range [7.5, 30.0]            │
└───────────────────────────────────────────────────────────────────┘
```

**Panel header:** serif H1 "Corrections and notes".

**Groups** (rendered in this order, each with its own sub-heading; groups with no entries are omitted):
1. **Corrections applied** (`type: "bias_correction"`)
2. **Values clamped** (`type: "range_clamp"`)
3. **Notes** (`type: "warning"`)

Sub-heading style: sans 12 px uppercase letter-spaced `--text-subtle`, 1 px `--border` rule below.

**Warning row layout:**
- Icon (16 px lucide, coloured per §7.7): `Settings2` for corrections, `AlertCircle` for clamps, `Info` for notes
- Field name in mono 13 px, `--text-muted`, 120 px wide column (or blank if `field` is null and the warning is not step-correlated)
- If the warning is step-correlated per the heuristic (§4.7, §5.8): the field column shows *"(attached to step N — see timeline)"* in `--text-subtle`, and the warning is also rendered inline in C2. It appears in both places intentionally — the step-level surface for narrative context, the C5 list for completeness.
- Message in sans 14 px, `--text`, flex-fills remaining width
- Rows separated by 12 px padding and 1 px `--border` rules

**Empty state:** if `response.warnings` is empty, the panel is omitted entirely — no empty panel, no "no warnings" message. Panel C4's footer ("Overall confidence") still provides closure to the screen.

### 8.11 Region D — Footer

**Layout:** 40 px tall, full max-width, 32 px below the last result panel.

```
┌───────────────────────────────────────────────────────────────────┐
│  Problem Translator v0.1.0                Documentation · Source   │
└───────────────────────────────────────────────────────────────────┘
Separator: 1 px --border horizontal rule above footer.
```

- Left: *"Problem Translator"* (sans 13 px, `--text-muted`) + version string from `package.json` (mono 12 px, `--text-subtle`)
- Right: two **inert** text labels — "Documentation" and "Source", separated by a middle-dot (·), rendered in `--text-subtle` with no hover state (no real URLs exist yet)
- When real URLs are defined (post-v1), these become real links

### 8.12 Screen-wide behaviours

Behaviours not tied to a specific region.

**Scroll handling:**
- The page is a single long vertical flow. No sticky elements, no internal scroll containers except within textarea, long-query echo, and responsive table cells.
- On submit, the page should auto-scroll so that the top of region C is in view (smooth scroll, 300 ms, respects `prefers-reduced-motion`).
- On error state transition, same scroll behaviour.

**Focus management:**
- On submit: focus moves to the result area's first heading after response arrives (so screen readers announce it)
- On example picker close: focus returns to the textarea
- On "Edit and resubmit": focus moves to textarea, end of content
- On "Try again": focus remains where it was; result area transitions through loading to success

**Keyboard shortcuts:**
- **Cmd/Ctrl + Enter** (global when textarea is focused): submit
- **Esc** (when picker is open): close picker
- **/** (global): focus textarea — optional, flagged as a nice-to-have, not a v1 requirement

**Copy behaviour:**
- All text in panels is selectable and copyable. No `user-select: none` anywhere.
- The growth curve chart is a raster for v1 (Recharts default SVG rendering); no "copy as image" action.

**Print styles:** out of scope for v1. Flag if someone needs to print the result — not specified here.

### 8.13 Copy inventory

All user-facing strings in the UI, centralised here so they can be revised without hunting through components. All in English; implementation keeps them in a single strings module for potential later localisation.

| Key | String |
|---|---|
| `header.productName` | Problem Translator |
| `header.descriptor` | Natural-language food safety queries, grounded in predictive microbiology. |
| `query.heading` | Your scenario |
| `query.placeholder` | Describe a food safety scenario in your own words… |
| `query.loadExample` | Load example |
| `query.submit` | Translate |
| `empty.line1` | Translate a food safety scenario to see grounded predictions and their provenance. |
| `empty.line2` | Try an example from above, or describe your own. |
| `loading.heading` | Translating your scenario… |
| `loading.queryLabel` | Your query: |
| `loading.status` | Extracting parameters · grounding in sources · running model |
| `error.heading` | Translation did not complete |
| `error.transport` | Could not reach the backend. Make sure the server is running at `http://localhost:8000` and try again. |
| `error.validation` | The backend returned an unexpected response format. This usually means the frontend and backend versions are out of sync. |
| `error.application` | The backend reported: |
| `error.degenerate` | Translation completed, but no prediction was produced. Try rephrasing the query. |
| `error.timeout` | The backend took too long to respond. Try again, or simplify the scenario. |
| `error.tryAgain` | Try again |
| `error.editAndResubmit` | Edit and resubmit |
| `c1.heading` | How the scenario was understood |
| `c1.yourWords` | YOUR WORDS |
| `c1.parameters` | SYSTEM PARAMETERS |
| `c1.multiStepNote` | {N} steps — see timeline below |
| `c2.heading` | Scenario timeline |
| `c2.totalDuration` | Total duration: |
| `c2.totalLog` | Total: |
| `c3.heading` | Prediction |
| `c3.confidence` | Confidence |
| `c3.curveCaveat` | Simplified visualisation — see table for exact per-step values. |
| `c3.muMaxStep1Suffix` | (step 1) |
| `c4.heading` | Provenance of grounded values |
| `c4.subtitle` | Only fields that required grounding are shown. |
| `c4.colField` | FIELD |
| `c4.colValue` | VALUE |
| `c4.colSource` | SOURCE |
| `c4.colConfidence` | CONFIDENCE |
| `c4.colNotes` | NOTES |
| `c4.overallConfidence` | Overall confidence |
| `c4.allUserExplicit` | All values were taken directly from your query. No grounding was required. |
| `c5.heading` | Corrections and notes |
| `c5.groupCorrections` | CORRECTIONS APPLIED |
| `c5.groupClamps` | VALUES CLAMPED |
| `c5.groupNotes` | NOTES |
| `c5.stepAttached` | (attached to step {N} — see timeline) |
| `footer.docs` | Documentation |
| `footer.source` | Source |

### 8.14 Implementation handoff notes

For Claude Code when implementing Section 8:

- Each of C1–C5 is its own component in `features/translation/components/`, receiving typed props and rendering nothing but its own panel.
- `ResultLayout` composes them and handles the empty/loading/error/success branching.
- The growth curve component is in `features/translation/components/GrowthCurve.tsx` and consumes `prediction.step_predictions` plus the derivation utility in `features/translation/utils/growthCurve.ts` (§5.9).
- The heuristic for step-scoped warning correlation (§4.7) lives in `features/translation/utils/warnings.ts`. It takes the `warnings` array and the `steps` array and returns a `{ global: Warning[], perStep: Map<stepOrder, Warning[]> }` structure. The rule: if `warning.message` matches `/Temperature ([\d.]+) ?°?C/` and the extracted value equals any `step.temperature_celsius` (within 0.1 °C tolerance), attach to that step. Fallback: global.
- All copy strings from §8.13 live in `features/translation/data/strings.ts` (a single typed object).
- The example queries list from §2.4 and the one-line summaries from §8.4 live in `features/translation/data/exampleQueries.ts`.

---

## 9. State Management & Data Flow

This section specifies exactly what state exists, where it lives, and how it moves.

### 9.1 State taxonomy

Four categories of state in the app. Each has exactly one home.

| Category | Examples | Home | Lifecycle |
|---|---|---|---|
| **Server state** | Translation response, loading status, error | TanStack Query cache | Per query string; 30 min gc time |
| **URL state** | `?q=` parameter | `URLSearchParams` via `history.replaceState` | Browser session |
| **Form state** | Textarea contents, character count | `useState` in `QueryPanel` | Component lifetime |
| **UI state** | Example picker open/closed, focus targets | `useState` in the owning component | Component lifetime |

**Non-goals (state deliberately not kept):**

- No global client store (no Redux, no Zustand, no Jotai). Verified unnecessary at this scope.
- No persistence across reloads beyond the URL. No `localStorage`, no cookies.
- No history of past queries. If the user wants to re-run an earlier query, they use browser back/forward (which replays `?q=` through React Query's cache when `VITE_CACHE_MODE=session`; otherwise re-runs the backend).
- No "draft" tracking. If the user types a query and navigates away, the query is lost. Acceptable per §6.12.

### 9.2 Server state — TanStack Query ownership

The translation API is the only server state. All of it flows through a single module.

**Configuration (at `main.tsx`):**

```ts
const cacheMode = env.VITE_CACHE_MODE  // "off" | "session"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: cacheMode === 'session' ? Infinity : 0,
      gcTime: 1000 * 60 * 30,       // 30 min in cache
      retry: 0,                     // No auto-retry
      refetchOnWindowFocus: false,  // Demo-friendly; no surprise re-runs
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

Rationale for each setting already established in §3.4 and §4.8; the configuration is collected here for a single source of truth.

**Query keys — stable and explicit:**

```ts
// features/translation/api/keys.ts
export const translationKeys = {
  all: ['translation'] as const,
  byQuery: (query: string) => ['translation', query] as const,
}
```

One query family. Keys are typed `as const` so that TanStack's type inference picks up the exact string tuples. All query/mutation calls reference these helpers; no inline string arrays.

**Cache semantics — per mode:**

**`VITE_CACHE_MODE=off` (default):**
- `staleTime: 0` — every bootstrap query fetches fresh
- Mutations always fetch fresh (they do not check the query cache by default)
- A successful mutation response is *still* written to the query cache via `queryClient.setQueryData` (so that if the URL later routes to the same `?q=`, React Query's internal machinery behaves consistently), but the stale-time policy immediately invalidates it for refetch on the next access
- Net effect: every submit, every URL visit, hits the backend

**`VITE_CACHE_MODE=session`:**
- `staleTime: Infinity` — cached responses never go stale within the session
- After a successful mutation, its response is written into the query cache at `translationKeys.byQuery(query)` via `queryClient.setQueryData`. Subsequent URL visits for the same `?q=` then hit the cache instantly.
- Re-submitting an identical query via the mutation still re-hits the backend (mutations don't check cache by default), but navigating back to a previously-submitted `?q=` URL uses cache.

### 9.3 The single hook — `useTranslateQuery`

One hook exposes the entire feature's state surface. Every component consuming server state uses this hook; no component calls the API directly.

**Interface:**

```ts
// features/translation/hooks/useTranslateQuery.ts
interface UseTranslateQueryResult {
  // Current state
  data: TranslationResponse | undefined
  isLoading: boolean    // true during an in-flight request
  isError: boolean
  error: TranslateError | null
  status: 'empty' | 'loading' | 'error' | 'success'

  // Actions
  submit: (query: string) => void
  retry: () => void
  reset: () => void
}

export function useTranslateQuery(
  initialQuery: string | null,
): UseTranslateQueryResult
```

**Responsibilities:**

- Manages a `useMutation` for user-initiated submits.
- Manages a `useQuery` seeded from `initialQuery` (for URL bootstrap).
- Derives a single `status` value from the internal loading/error/data combination — components branch on this, not on React Query's internals.
- Exposes `submit(query)` which (a) fires the mutation, (b) on success writes the response to the cache under `translationKeys.byQuery(query)`, (c) signals the URL sync effect (§9.5) to update `?q=`.
- Exposes `retry()` which re-submits the most recent query.
- Exposes `reset()` which clears the mutation state; used when navigating away from an error. (Not bound to any v1 UI action; included for completeness.)

**Internal sketch:**

```ts
export function useTranslateQuery(initialQuery: string | null) {
  const qc = useQueryClient()

  // URL-bootstrapped query; enabled only when initialQuery is present
  const bootstrap = useQuery({
    queryKey: translationKeys.byQuery(initialQuery ?? ''),
    queryFn: () => translateApi(initialQuery!),
    enabled: !!initialQuery,
  })

  // User submit mutation
  const mutation = useMutation({
    mutationFn: translateApi,
    onSuccess: (data, query) => {
      qc.setQueryData(translationKeys.byQuery(query), data)
    },
  })

  // Derive unified state
  const activeQuery = mutation.variables ?? initialQuery
  const data = mutation.data ?? bootstrap.data
  const isLoading = mutation.isPending || (bootstrap.isLoading && !!initialQuery)
  const isError = mutation.isError || bootstrap.isError
  const error = (mutation.error ?? bootstrap.error) as TranslateError | null

  const status: Status =
    isLoading ? 'loading' :
    isError ? 'error' :
    data ? 'success' :
    'empty'

  return {
    data, isLoading, isError, error, status,
    submit: mutation.mutate,
    retry: () => activeQuery && mutation.mutate(activeQuery),
    reset: () => mutation.reset(),
  }
}
```

The sketch is illustrative; final implementation may differ in details (e.g. using `useMutationState` for inflight tracking) but the public interface and the state-derivation rules are the contract.

**Why one hook and not several:**

Splitting this into `useTranslate`, `useLastResult`, `useSubmitTranslation`, etc., creates coordination bugs when those hooks disagree about which query is current. One hook, one derived state, one contract.

### 9.4 Errors — typed and shaped

A single error type flows through the hook. Components branch on the `kind` discriminator, not on exception types.

```ts
// features/translation/api/errors.ts
export type TranslateError =
  | { kind: 'transport'; cause: unknown }
  | { kind: 'validation'; cause: ZodError }
  | { kind: 'application'; message: string }
  | { kind: 'degenerate' }
  | { kind: 'timeout' }
```

**Construction happens in `translateApi`:**

- `fetch` rejection or non-2xx → `{ kind: 'transport' }`
- `zodSchema.safeParse` failure → `{ kind: 'validation' }`
- Parsed response with `success === false` → `{ kind: 'application', message: response.error ?? '' }`
- Parsed response with `success === true` but `prediction === null` → `{ kind: 'degenerate' }`
- `AbortError` after a future timeout (not in v1) → `{ kind: 'timeout' }`

The `translateApi` function **always throws a `TranslateError`** on any failure path — never a generic `Error`, never a raw `ZodError`, never a bare response. This is what makes the error handling tractable downstream.

Component usage:

```tsx
switch (error.kind) {
  case 'transport':   return <ErrorPanel message={strings.error.transport} />
  case 'validation':  return <ErrorPanel message={strings.error.validation} />
  case 'application': return <ErrorPanel message={`${strings.error.application} ${error.message}`} />
  case 'degenerate':  return <ErrorPanel message={strings.error.degenerate} />
  case 'timeout':     return <ErrorPanel message={strings.error.timeout} />
}
```

Exhaustive switch — TypeScript enforces that all cases are handled.

### 9.5 URL synchronisation

URL state is managed outside React Query, in a single effect in `App.tsx`.

**Read — on mount:**

```ts
// In App.tsx
const initialQuery = useMemo(() => {
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')?.trim() ?? null
  if (!q) return null
  if (q.length > 2000) return null // Edge case per §6.4
  return q
}, [])
```

The initial read is a `useMemo`, not a `useState` or a subscription — we only care about the URL at mount. No router, no listener.

**Write — on successful submit:**

```ts
useEffect(() => {
  if (status !== 'success' || !data) return
  const currentQ = new URLSearchParams(window.location.search).get('q')
  if (currentQ === data.original_query) return
  const params = new URLSearchParams()
  params.set('q', data.original_query)
  window.history.replaceState(null, '', `?${params.toString()}`)
}, [status, data])
```

- `replaceState`, not `pushState` — we do not want successful submits to fill the browser history. The user's back button should take them to wherever they came from, not through every query they ran.
- Writes only after the response arrives (so the URL and the displayed result agree).
- Uses `data.original_query` (echoed back by the backend), not the raw form input, to ensure the URL matches exactly what was run.
- Guard prevents unnecessary writes when the URL is already correct (avoids churning during re-renders).

**URL encoding:**

`URLSearchParams` handles encoding automatically. Unicode characters (°, μ) survive round-tripping via percent-encoding. Queries up to 2000 chars produce URLs around 3–6 KB — well within all browser URL limits.

### 9.6 Form state — lives in `QueryPanel`

Only two pieces of form state:

```ts
// features/translation/components/QueryPanel.tsx
const [query, setQuery] = useState(initialQuery ?? '')
const [isPickerOpen, setIsPickerOpen] = useState(false)
```

- `query` is a controlled input value for the textarea. It is NOT synced to React Query or the URL during typing — only the submit action propagates it.
- `isPickerOpen` controls the example picker popover. Local to this component; no reason to lift it.

**Submit handler:**

```ts
const { submit } = useTranslateQuery(initialQuery)

function handleSubmit() {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length > 2000) return
  submit(trimmed)
}
```

**Example picker selection:**

```ts
function handleExampleSelect(example: ExampleQuery) {
  setQuery(example.fullText)       // Populate textarea
  setIsPickerOpen(false)           // Close picker
  // No auto-submit per §6.3
}
```

**No form library.** `useState` is sufficient for one textarea. Adding React Hook Form would be premature.

### 9.7 The one piece of shared UI state — `initialQuery`

The URL parameter on mount needs to reach two places:

1. `QueryPanel` — to pre-fill the textarea
2. `useTranslateQuery` — to kick off the bootstrap query

Both consume it as a prop passed from `App`. No context, no hook-inside-hook coupling.

```tsx
// App.tsx
export default function App() {
  const initialQuery = useInitialQueryFromURL() // the useMemo from §9.5
  const translate = useTranslateQuery(initialQuery)

  useUrlSync(translate.status, translate.data) // the effect from §9.5

  return (
    <Layout>
      <QueryPanel
        initialQuery={initialQuery}
        onSubmit={translate.submit}
        isSubmitting={translate.status === 'loading'}
      />
      <ResultArea
        status={translate.status}
        data={translate.data}
        error={translate.error}
        onRetry={translate.retry}
      />
    </Layout>
  )
}
```

Props flow downward, callbacks flow upward. No context provider for app state; the hook owns it and the single `App` component distributes it.

A `QueryClientProvider` wraps the app — that's it for providers.

### 9.8 Data transformations — where they happen

A single discipline applied throughout: **data is transformed at the trust boundary, not at display time**, except for display formatting (§4.5) which happens as late as possible.

**At the API boundary (`translateApi`):**

- Parse and validate the response with Zod
- Throw a typed `TranslateError` on any failure
- No field renaming, no restructuring — the shape that enters the app matches the Pydantic schema

**In a utility, computed during render (no caching needed given React Query's own cache):**

- Growth curve point array, from `step_predictions` — `utils/growthCurve.ts` (§5.9)
- Warning-to-step correlation, from `warnings` + `steps` — `utils/warnings.ts` (§8.14)
- Any display string formatting — `utils/format.ts` (§4.5)

**In components at render time:**

- Conditional rendering based on `prediction.is_multi_step`
- Source badge mapping (§4.5)
- Truncation, humanisation, ordering

No transformation happens inside `useTranslateQuery`. The hook returns the validated response as-is; consumers transform as needed for display.

### 9.9 Concurrent request handling

What happens when the user submits a second query before the first resolves.

**TanStack Query's built-in behaviour, relied upon:**

- Calling `mutation.mutate` while a previous mutation is in flight does not cancel the previous call — it just starts a new one and replaces the mutation state.
- The first mutation's response, when it arrives, is discarded by the hook (its variables no longer match the current mutation).
- The first mutation's response IS still written to the cache under its own query key via `setQueryData` in `onSuccess` — so if the user later submits that first query again with session caching on, it returns from cache.

**One UI consequence (§6.8):** the loading state is entered once per submit and does not "stack". A rapid second submit simply keeps the UI in loading until the second response arrives.

**What the spec explicitly does not require:**

- No request cancellation via `AbortController` in v1. The backend is local and the cost of a discarded request is negligible. Revisit if cancellation becomes necessary (e.g. slow remote backend, abusive submit rate).
- No debouncing of submits. The submit button disables while `isSubmitting`, which is sufficient guard.

### 9.10 Rendering and memoisation

**Default posture:** no memoisation. React components are fast; premature memoisation is a known anti-pattern.

**Exceptions where memoisation IS specified:**

- `useInitialQueryFromURL` uses `useMemo` because it reads `window.location.search` once; recomputing would be pointless (not expensive, just wasteful).
- `growthCurve` derivation in `GrowthCurve.tsx` uses `useMemo` keyed on `prediction.step_predictions` — it produces an array of 150+ points and is recomputed on every render if not memoised. The array is also passed to Recharts, which will re-layout when the reference changes, so stability matters.
- `warnings` correlation (§8.14) uses `useMemo` keyed on `warnings` and `steps` — computed once per response; cheap but conceptually per-response.

Everything else: plain re-renders. If a performance issue surfaces during implementation, address with profiling, not with prophylactic `memo` calls.

### 9.11 Development-only assertions

A small number of consistency checks that exist only in development and are stripped in production via a `if (import.meta.env.DEV)` guard.

| Assertion | Location | Purpose |
|---|---|---|
| Growth curve total equals `prediction.total_log_increase` within 1e-6 | `utils/growthCurve.ts` | Catches schema/derivation drift (§5.9) |
| `prediction.steps.length === prediction.step_predictions.length` | `schema.ts` (post-validation) | Catches backend schema drift |
| `prediction.is_multi_step === (prediction.steps.length > 1)` | `schema.ts` (post-validation) | Catches backend inconsistency |
| Every `step_predictions[i].step_order === i + 1` | `schema.ts` (post-validation) | Catches ordering bugs upstream |

These are `console.warn` calls, not thrown errors. They surface regressions to the developer without breaking the demo if the backend has drifted. If an assertion fires during the actual demo, the UI still renders — the warning lands in the console.

### 9.12 What tests exist at this layer

Scope of tests in v1 is deliberately small. The state management is simple; testing it heavily would outweigh the code under test.

**In scope for v1 tests:**

- `utils/growthCurve.ts` — pure function, unit tests for single-step, multi-step, inactivation, edge cases (zero duration, negative μ_max)
- `utils/warnings.ts` — pure function, unit tests for the correlation heuristic
- `utils/format.ts` — pure function, unit tests for all formatting rules in §4.5
- `api/schema.ts` — round-trip tests with the live response JSON from §4 (parse the example, verify all fields populate)
- `api/client.ts` — mocked `fetch`, test each error case in §9.4 lands with the correct `kind`

**Out of scope for v1:**

- Component tests (React Testing Library) — deferred. Visual/integration review happens during demo prep.
- End-to-end tests (Playwright) — deferred.
- Hook tests — deferred; the hook is thin and its correctness is evident from `client.ts` + the component flow.

### 9.13 What the state layer deliberately does not do

- **No optimistic updates.** The backend takes 2–10 s; nothing about this scope benefits from optimism.
- **No background refetching.** The same `?q=` produces the same UI for the session (§6.7) when in session cache mode; in off mode, every visit re-fetches.
- **No websockets, no SSE, no polling.** Single request-response per submit.
- **No state persistence.** Close the tab, lose the state. Intentional.
- **No cross-tab synchronisation.** If the user has two tabs open and submits in one, the other does not update. Zero value at this scope.
- **No telemetry, no analytics events.** Console logs in dev; nothing in production.

### 9.14 Summary — the state story in one paragraph

The app has one piece of server state (the translation response), owned by TanStack Query and keyed by query string. Cache policy is controlled by `VITE_CACHE_MODE` — `off` (default) means every submit re-runs the backend, `session` means cached responses are reused within the browser session. One hook (`useTranslateQuery`) wraps that state and exposes a minimal surface (`status`, `data`, `error`, `submit`, `retry`). The URL carries a single parameter (`?q=`) that is read once on mount and written once per successful submit, coupling the browser history to the displayed result without persisting anything else. The textarea holds its own transient `useState`. The example picker holds its own transient `useState`. Transformations (growth curve, warning correlation, formatting) are pure functions, colocated with the components that need them, memoised only where measurably beneficial. Everything else is a plain re-render.

---

## 10. Non-Functional Requirements

Quality attributes the frontend must meet that aren't tied to a specific feature.

### 10.1 Performance

**Targets:**

| Metric | Target | Rationale |
|---|---|---|
| Time to interactive (cold load, dev build) | ≤ 2 s on the demo laptop | Demo must feel alive within a beat |
| Time to interactive (cold load, production build) | ≤ 1 s | Industry norm; trivial at this scope |
| Interaction latency (click → visible feedback) | ≤ 100 ms | Textarea, submit, picker all instant |
| Bundle size (production, gzipped) | ≤ 300 KB total, ≤ 180 KB initial | Generous ceiling; the stack is already lean |
| Frame rate during animations | 60 fps | Tailwind transitions + skeleton shimmer only |

**What is deliberately NOT a performance concern in v1:**

- **Backend latency.** 2–10 s per request is outside frontend control. The loading state (§8.5.2) is the mitigation.
- **Lighthouse "Performance" score.** Not a v1 criterion. The app is not public-indexed; optimising for Lighthouse is premature.
- **First Contentful Paint to sub-500 ms.** The header and query panel render within their budget; squeezing further is not worth the effort at this stage.

**Bundle discipline:**

- Recharts is the heaviest dependency (~90 KB gzipped). Acceptable — it's used on every successful result render. Not worth replacing or lazy-loading at this scope.
- Zod adds ~15 KB. Acceptable.
- lucide-react is tree-shaken — only imported icons ship.
- shadcn/ui primitives are copied into the repo, not imported from a library, so they add zero overhead beyond their own (small) code.
- No moment.js, no lodash (full), no date-fns. Flagged in §3.1.

**Build output:** single SPA, static assets. Servable from any static host, from the FastAPI static directory, or from `vite preview`. No server-side rendering, no serverless functions.

### 10.2 Accessibility

Commitments already scattered through §5–§8 consolidated here.

**Target:** WCAG 2.1 AA on all rendered states.

**Specific commitments:**

| Area | Requirement |
|---|---|
| Colour contrast | All text meets 4.5:1 (body) / 3:1 (large text). Confidence indicator, warning icons, source badges meet 3:1 for graphical elements. |
| Keyboard navigation | Every interactive element reachable via Tab. Focus order matches visual order. No keyboard traps. |
| Focus visibility | 2 px `--accent` ring, visible on every interactive element. Never removed via CSS. |
| Screen reader support | Semantic HTML throughout; ARIA only where semantic HTML is insufficient. Loading state has `aria-busy` + `aria-live="polite"`. Error state has `role="alert"`. |
| Reduced motion | `prefers-reduced-motion: reduce` honoured. Skeleton shimmer becomes static fill; transitions become instant. |
| Text scaling | Layout survives 200% browser zoom without content loss or horizontal scrolling. |
| Form labels | Every input has an associated label, either visible or via `aria-label`. |
| Non-colour information | Confidence indicator pairs bar with percentage. Warning types pair icon with text label. Growth curve sign pairs colour with explicit sign on the number. |

**Not in v1 scope:**

- Full AAA compliance (e.g. 7:1 contrast for body text)
- Screen reader testing with multiple AT products (NVDA, VoiceOver, JAWS) — opportunistic testing only
- Captions or transcripts (no audio/video content)

**Concrete ARIA patterns used:**

- Example picker: `role="menu"` with `role="menuitem"` entries, arrow-key navigation
- Result area: `aria-live="polite"` region, focus moved to heading on transition
- Step timeline: `role="img"` with descriptive `aria-label`; segments as `<button>` for tooltip access
- Confidence indicator: `role="meter"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`

### 10.3 Browser support

**Primary target:** current stable Chrome, Firefox, Safari, Edge on desktop. "Current stable" means released within the past 12 months at demo time.

**Secondary:** preceding major version of each, best-effort.

**Not supported:** Internet Explorer (any), browsers older than 2 years, mobile browsers (not targeted per §7.11).

**Browser API assumptions:**

- `fetch`, `URLSearchParams`, `history.replaceState` — universal
- CSS custom properties — universal
- `prefers-reduced-motion` media query — universal in target browsers
- `Intl.NumberFormat` — used for percentage formatting; universal
- `AbortController` — not used in v1 but available if needed

No polyfills in v1. The stack targets ES2022.

### 10.4 Security

**Threat model:** the app is a local-only demo talking to a local backend in v1. The threat surface is thin.

**Still non-negotiable:**

| Area | Requirement |
|---|---|
| User input sanitisation | React escapes text by default; no `dangerouslySetInnerHTML` anywhere |
| URL parameter handling | Decoded value treated as untrusted text. Rendered in textarea and echoed in result area — never evaluated, interpolated into HTML, or used as a URL |
| API response handling | Validated via Zod at the boundary. Never interpolated into HTML. `notes` field contents (which may include citation tags like `[CDC-2011-T3]`) rendered as text — citation tags detected via regex and styled as text, not as links |
| Third-party dependencies | Locked via `package-lock.json`. No auto-updating loaders. |
| Environment variables | Only `VITE_API_BASE_URL` and `VITE_CACHE_MODE` are exposed to the client bundle. No secrets anywhere in the frontend. |
| External requests | None. No analytics, no telemetry, no CDN-fetched fonts (§7.14). Only request made by the frontend is to `VITE_API_BASE_URL/api/v1/translate`. |
| CORS | Backend sets `allow_origins=["*"]` — flagged in §3.7 for production hardening, not a v1 blocker |

**Not in v1 scope (but noted for production):**

- Content Security Policy header
- Subresource Integrity for any external assets
- HTTPS enforcement (app will run over HTTPS in production; the frontend makes no protocol assumptions)
- Authentication / session handling (no auth in v1)
- Rate limiting (no auth, no persistent users)

### 10.5 Error handling and resilience

**Runtime error boundaries:**

- One top-level `<ErrorBoundary>` wraps the entire app in `App.tsx`. It catches uncaught React errors (e.g. a component throws during render) and replaces the UI with a minimal fallback:
  > *"Something went wrong rendering the page. Try reloading."*
  - A "Reload" button that calls `window.location.reload()`
  - In development mode, the error stack is rendered below; in production, it is not.
- No per-feature error boundaries in v1. The single feature is self-contained; compartmentalising further is premature.

**Known non-exceptional error states** are handled in the hook/UI per §9.4, not via error boundaries. Error boundaries catch *unexpected* errors (component bugs); `TranslateError` handles *expected* failures (backend issues, validation issues).

**Resilience to backend schema drift:**

- Zod validation catches shape mismatches (fields added, removed, retyped) at the boundary
- Permissive string typing (§4.4) means new enum values don't blow up parsing
- Dev-mode consistency assertions (§9.11) catch subtle inconsistencies that pass Zod but violate invariants
- Production gracefully renders whatever does validate; a warning in the console is the only signal of drift

**Resilience to backend unavailability:**

- Transport errors handled explicitly (§9.4, §8.5.3)
- No auto-retry; retry is a user action
- No queue of pending submits; the user is shown the error and the retry path

### 10.6 Logging and observability

**In v1:**

- `console.error` for caught exceptions in `translateApi`
- `console.warn` for dev-mode consistency assertions (§9.11)
- Zero production logging infrastructure — no Sentry, no LogRocket, no custom endpoint

**What is deliberately NOT logged:**

- User queries (privacy)
- API responses (privacy; also: large)
- Performance metrics (no consumer for them at this scope)

**For production (noted, not implemented):**

- If/when a production deployment exists, client error reporting (Sentry or equivalent) is the single highest-value addition. Flagged as out of v1 scope but first item on the post-demo hardening list.

### 10.7 Maintainability

The architecture choices in §3 are the primary maintainability levers. This subsection specifies the conventions that keep a consistent codebase.

**Code conventions:**

| Topic | Rule |
|---|---|
| TypeScript strictness | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`. |
| Module style | ES modules only. No CommonJS. |
| File naming | `PascalCase.tsx` for components; `camelCase.ts` for everything else. `index.ts` barrel files only at the feature root (`features/translation/index.ts`) for public API. No deep barrels. |
| Component structure | Function components only. No class components. Hooks at the top, helpers below the component, types inline or in a sibling `.types.ts`. |
| Props typing | `type Props = { ... }` (not `interface`), colocated with the component. No generic `FC<>` wrapper. |
| Imports | Absolute from `@/` (configured in `tsconfig.json`). Feature-internal imports use relative paths. |
| Exports | Named exports. Default exports only for `App.tsx` and Vite entry points. |
| CSS | Tailwind utilities, tokens from `globals.css` (§7.3). No inline `style={}` except for dynamic values (e.g. segment widths in the step timeline). No CSS modules, no styled-components. |
| Comments | Comments explain *why*, not *what*. No commented-out code in commits. |
| Dead code | None at merge time. |

**Formatter:** Prettier with default config + `singleQuote: true`. No bikeshedding.

**Linter:** ESLint with `@typescript-eslint/recommended`, `react-hooks/recommended`, `react/jsx-runtime` (for the new JSX transform). No custom rules in v1 — custom rules are a later addition when a specific recurring bug justifies one.

**Formatting/linting gates:** run on `pre-commit` via a simple husky + lint-staged setup. Not blocking for v1 if it slows the demo timeline; add after demo.

**Documentation:**

- `README.md` at the repo root — how to install, run, build. Covers the demo flow end-to-end.
- This spec document lives in the repo at `docs/frontend-spec.md` for reference.
- Inline code documentation: JSDoc on exported functions in `utils/` and `api/`. No ornamental JSDoc on self-explanatory components.

### 10.8 Build and deployment

**Build:**

- `npm run build` produces static assets in `dist/`
- Build must succeed with zero TypeScript errors and zero ESLint errors
- Build must succeed with `--mode production` and `--mode development`

**Deployment (v1):**

- **None automated.** The demo is run locally via `npm run dev` against a local backend.
- Ad-hoc deployment to a static host (Vercel, Netlify, GitHub Pages, or a Centre-internal host) is feasible from the `dist/` folder but not part of v1 scope.

**Deployment (future — noted so the architecture accommodates it):**

- Frontend and backend can be deployed together (FastAPI serving the SPA from a static directory) or separately (CDN + API)
- Both options are supported by the existing architecture with no code changes — only `VITE_API_BASE_URL` differs

**No CI pipeline in v1.** Builds run on the developer's machine. CI is a post-demo hardening task.

### 10.9 Internationalisation

English only in v1 (§1.3). The copy inventory (§8.13) lives in a single typed module, which makes a later i18n migration straightforward (wrap in a translation function, replace the static object with a provider) but adds no overhead today.

**Not doing:**
- No `i18next`, no `react-intl`, no translation workflow, no locale switching
- No RTL support
- No date/number locale handling beyond `Intl.NumberFormat` default

### 10.10 Privacy

The frontend collects nothing. No cookies (beyond what the browser sets for its own operation), no localStorage, no sessionStorage, no fingerprinting, no analytics.

The URL parameter (`?q=`) is readable by anyone who receives the shared URL — this is the intended behaviour for sharing — but it is not transmitted to any third party by the frontend.

If the app is ever deployed publicly, a privacy notice will be needed for the backend's handling of queries (LLM providers may log them). The frontend carries no separate privacy commitment.

### 10.11 Telemetry and analytics

Zero, in v1.

If a future version needs usage analytics, the architectural hook exists (a single event emitter inside the feature module) but nothing consumes it in v1.

### 10.12 Summary of non-functional commitments

The app is small, local, and single-user. Most non-functional concerns are addressed by choosing a minimal stack and not adding complexity:

- **Fast** because the stack is lean and the UI is small
- **Accessible** because shadcn/ui and Tailwind give us the primitives for free, and we don't undo them
- **Secure** because we don't ingest external data, don't store secrets, don't render untrusted HTML
- **Maintainable** because the folder structure is feature-first, the state story is minimal, and the conventions are boring
- **Observable enough** because errors are typed and visible, not swallowed

The non-functional work is therefore about *not losing* these properties during implementation rather than *gaining* them.

---

## 11. Out-of-Scope and Future Extensions

This section consolidates what v1 does not do, explains the rationale, and sketches how each item would land on the existing architecture when its time comes. The purpose is to make the v1 scope boundary explicit and to reassure that deferred features do not require architectural changes.

### 11.1 Already deferred — consolidated list

Items appearing as "deferred", "out of scope", "future", or "stretch goal" earlier in the spec, gathered here:

| Item | First mentioned | Why deferred |
|---|---|---|
| Natural-language interpretation of model results | §1.3, §1.4 | Belongs to a future result-interpretation capability on the backend; raw values are the honest v1 answer |
| `model_type` override in the UI | §1.3 | API accepts it; v1 doesn't expose to avoid cluttering the surface |
| Query history / saved sessions | §1.3, §1.4 | Requires persistence; URL sharing covers the demo use case |
| Authentication and per-user context | §1.4 | No multi-user need in v1 |
| Multi-pathogen parallel analysis | §1.3, §1.4 | Backend returns one organism per query |
| Comparative analysis ("what if…") | §1.4 | Requires a compare-two-results UI model; premature |
| Manual step editing for multi-step profiles | §1.3, §1.4 | LLM extraction is the v1 mechanism; manual override is a power-user feature |
| Interactive clarification loop for low-confidence extractions | §1.4 | Requires backend support not yet available |
| Token highlighting in C1 (query ↔ parameters) | §5.6, §5.11 | Would require backend extraction offsets; heuristic fallback is fragile |
| Mobile-first design | §1.3, §7.11 | Desktop-only demo target |
| Dark mode | §1.3, §7.12 | Token architecture ready; palette/toggle not done |
| Internationalisation | §1.3, §10.9 | Copy is centralised; swap layer addable later |
| Streaming / SSE for progressive stage reveal | §4.9 | Atomic response + skeleton is sufficient for v1 |
| Request cancellation via AbortController | §9.9 | Local backend; cost of discarded request is negligible |
| Client error telemetry (Sentry or equivalent) | §10.6 | No production deployment in v1 |
| Component tests / Playwright e2e | §9.12 | Unit tests on pure utilities cover the highest-risk code |
| CI pipeline | §10.8 | No production deployment; not a v1 blocker |
| Copy-to-clipboard share button | §6.7 | URL bar is the share mechanism in v1 |
| In-flight cancel button | §6.12 | Corner-case UX for marginal benefit |
| Explicit "re-run" action bypassing cache | §6.12 | Default cache mode (off) already re-runs every submit |
| Timestamp parameter in shared URLs | §6.7 | Marginal benefit for added complexity |
| "/" keyboard shortcut to focus textarea | §8.12 | Nice-to-have; not v1 |
| Print styles | §8.12 | No stated need |
| Wide-screen expansion beyond 1280 px | §7.11 | Intentional — keeps the feel of a scientific document |

### 11.2 Landing zones for future features

For each major deferred feature, a brief note on where it plugs into the v1 architecture.

**Natural-language interpretation layer.** When the backend exposes an interpretation string or a structured interpretation object (likely as a new field on `PredictionResult`), a new panel inserts between C3 (Prediction) and C4 (Provenance). The panel reads from the new field; no existing panel changes. Alternatively, if the interpretation is integrated into C3 as a prose annotation, the change is a single component with its props extended.

**Clarification loop.** Requires backend support (the orchestrator needs to return "needs clarification" as a response state). In the frontend, this becomes a new branch in the state machine (§6.8): success / error / **clarification-needed**. The clarification state would render a panel above C1 with the backend-supplied questions, rewriting the submit path to include the user's clarifications. The hook contract in §9.3 extends by one more discriminator on `status`.

**Query history.** A new top-level component — history sidebar, or header dropdown — lists past queries. Persistence via IndexedDB (a keyed store by `{query, timestamp, response hash}`). Does not touch `useTranslateQuery`; the history component reads from its own hook and, on click, calls `submit(query)`. React Query's cache already keys by query string, so repeat submissions of an historical query return instantly (when in session cache mode).

**Authentication.** A provider wraps the app, injects a token into `translateApi`'s fetch calls, and adds a login screen. The feature module is untouched.

**Multi-pathogen comparison.** Backend returns a list of pathogens rather than one. In the UI, C3 (Prediction Panel) extends to a small-multiples layout — one mini-prediction per pathogen — with a selector for the detail view. C4 (Provenance) shows the shared grounding plus per-pathogen specifics. C5 (Warnings) groups by pathogen.

**Comparative "what if" analysis.** Requires a UI for second-query input and a diffed result view. The cleanest landing is a second route (`/compare`) rather than extending the single screen. This is where React Router arrives (§3.1 flagged this migration as trivial). The feature module remains self-contained; a new `features/compare/` sibling holds the compare-specific UI.

**Manual step editing.** A power-user mode triggered from C2. Clicking an existing step opens an inline editor for temperature/duration; submitting re-runs with a user-supplied profile. Requires a backend endpoint that accepts a pre-decomposed profile rather than natural language (or extension of the existing endpoint with an optional `profile` field).

**Token highlighting in C1.** If the backend adds extraction offsets to the response (e.g. `extraction_spans: [{ field, start, end }]`), C1's left column renders the query with `<mark>` spans for each span. On hover of a mark, the corresponding row in C1's right column highlights. No other panel changes.

**Dark mode.** Add a dark palette to `globals.css` inside a `[data-theme="dark"]` selector. Add a toggle in the header. Persist the choice to `localStorage`. Per §7.12, component styles already reference tokens; this is purely a token-layer change.

**Internationalisation.** Wrap the strings module (§8.13) in a hook (`useStrings()`). Replace the static object with a provider that selects the current locale. Add locale files for each language. No component logic changes.

**Streaming / SSE.** Requires backend support. The hook gains an additional state value (partial data during streaming). The UI unlocks stage-by-stage reveal: C1 can render as soon as extraction finishes, C3/C4/C5 after execution. This is the biggest architectural extension in this list because it changes the data-arrival model — but the component structure still holds.

**Client error telemetry.** Add one initialisation call in `main.tsx`; wrap the `ErrorBoundary` fallback and `translateApi` error paths to forward to the telemetry service. Zero component changes.

### 11.3 Items that would require architectural revisiting

Not everything in §11.1 slots cleanly into the existing architecture. Two items are flagged here as genuine future architectural decisions, not just additive features.

**Multi-screen navigation.** A second substantive screen (comparative analysis, admin/settings, methodology page) is the point at which React Router is added. This is a small migration but it touches `App.tsx`, the header (which gains navigation), and the URL state model (which now carries per-screen parameters). Flagged so it's not a surprise.

**Backend API shape growth.** If the response schema grows substantially (multi-pathogen, streaming, per-stage traces, richer provenance with structured citations), the Zod schema grows to match and display-layer components extend their prop shapes. The boundary discipline (§9.8) holds; the surface area simply grows. No rearrangement is expected — but this is worth periodic re-evaluation. If the API gains 3+ new top-level concepts, a review of whether `features/translation/` should split into sub-features (`features/translation/extraction/`, `features/translation/prediction/`, etc.) is warranted.

### 11.4 Items that remain deliberately out of scope indefinitely

A small set of features are not just deferred but are unlikely to ever belong in this application, and are listed here to preempt scope discussions:

- **Editing backend data through the UI** (e.g. adding RAG entries, tweaking interpretation rules) — this belongs in administrative tooling, not the end-user application
- **Uploading files** (CSVs, PDFs, images) — the input model is natural-language queries; extending beyond this changes what the product is
- **Embedding the app inside another product via iframe** — possible technically, but no stated need and introduces security/CORS concerns
- **Offline mode** — the core workload (LLM extraction, RAG retrieval) cannot run offline; there is no useful offline state

### 11.5 The principle behind the scope boundary

Two guiding questions have kept v1 contained:

1. *Does this feature demonstrate the system's value?* If it doesn't directly support the demo's message (natural language → auditable, grounded predictions), it's deferred.
2. *Does omitting this feature force a future rewrite?* If yes, it's in v1. If no, it's deferred.

Everything in §11.1 answered "yes" to question 2 — none of these features, when added later, will force a restructure. The architecture in §3 and the state model in §9 were chosen specifically to make this true.

---

## 12. Open Questions and Risks

Specific items still open at the end of this specification, and risks that should be acknowledged before implementation begins.

### 12.1 Open questions — resolved

Items that were open during spec-writing and have been resolved. Listed here for reference.

| # | Question | Resolution |
|---|---|---|
| Q1 | Product name | **"Problem Translator"** (confirmed final) |
| Q2 | Display formatting opinionated calls | Defaults in §4.5 accepted |
| Q3 | Typography commitment | Full hybrid serif-plus-sans (§7.4) accepted |
| Q4 | Colour palette character | Defaults in §7.3 accepted |
| Q5 | Cache policy | Configurable via `VITE_CACHE_MODE` env var; default `off` (every submit re-runs the backend). Can be switched to `session` for the demo if snappy replay is desired. |
| Q6 | Example picker one-line summaries | To be drafted in `exampleQueries.ts` during implementation, reviewed against the live system's actual behaviour |
| Q7 | Footer links | **Rendered inert** (text only, no hyperlinks) |

### 12.2 Open questions surfaceable during implementation

Items that are fine to decide while implementing, typically because the right call is clearer once the thing is on screen.

| # | Question | Decision point |
|---|---|---|
| Q8 | Step segment label layout when segments are narrow (< 100 px proportional width). | First time the demo includes a short step; tune in §8.7 |
| Q9 | Growth curve Y-axis range — auto-fit vs fixed minimum. | First render of C3 with a very small and very large result |
| Q10 | Skeleton layout proportions — exact placement of the 3–5 placeholder blocks. | First loading-state render |
| Q11 | Empty-state wording refinement — current copy in §8.13 may feel flat in context. | First cold-load review |
| Q12 | Exact motion durations (200 ms / 150 ms / 100 ms). | First full interaction pass |

These are noted here so they don't get forgotten, not because they need a pre-implementation answer.

### 12.3 Risks

Ranked by impact × likelihood. Each has a named mitigation or acceptance.

**R1 — A demo query produces a poor or misleading result.**

- *Impact:* High — the demo's credibility depends on visible examples behaving well
- *Likelihood:* Medium — LLM extraction is non-deterministic and the 9 curated queries have not all been stress-tested
- *Mitigation:* Pre-demo verification (§2.4) — every query executed against the live backend before the demo. Any query that misbehaves is swapped with another from the 30-query library. C2 (thermal inactivation) and C3 (multi-step cooling) are highest-priority to verify because they exercise distinctive behaviours.

**R2 — Backend unavailability during the demo.**

- *Impact:* Critical — the demo cannot proceed
- *Likelihood:* Low on the presenter's own laptop, but non-zero (local process crash, port conflict)
- *Mitigation:* The error state (§8.5.3) makes the failure visible and named. Pre-demo checklist should include a sanity-check translation. A backup laptop or a screen-recording of a successful run are the fallbacks — outside frontend scope.

**R3 — LLM extraction latency exceeding expectations.**

- *Impact:* Medium — a demo with 30-second waits is painful
- *Likelihood:* Low for the configured setup; higher if a slow model variant is used
- *Mitigation:* Loading state design (§8.5.2) makes wait time feel intentional. Pre-demo measurement of each curated query's latency; swap any query that consistently exceeds ~10 s. For the demo itself, consider switching to `VITE_CACHE_MODE=session` so a second pass through examples is instant.

**R4 — Step-scoped warning correlation heuristic misfires.**

- *Impact:* Low — warnings fall through to the global C5 list, which is always correct
- *Likelihood:* Medium — the regex approach (§8.14) will not match all warning formats
- *Mitigation:* Graceful degradation already specified. Over time, the heuristic can be tightened or replaced with a backend-supplied `step_order` field on warnings.

**R5 — Growth curve approximation disagrees visibly with the backend's exact total.**

- *Impact:* Medium — undermines trust if visible during a demo
- *Likelihood:* Low if the derivation (§5.9) is correct; the dev-mode assertion catches drift
- *Mitigation:* Assertion in §9.11. The approximation caveat text (§7.10, §8.8) pre-empts audience objections. If the discrepancy becomes a demo issue, the fallback is to remove the curve and keep the step timeline only.

**R6 — Backend schema drift between spec-writing and implementation.**

- *Impact:* Medium — frontend fails to parse the response
- *Likelihood:* Medium — the backend is actively developed (the multi-step fields were added mid-spec)
- *Mitigation:* Zod permissive typing on enum-like fields (§4.4); dev-mode assertions (§9.11); Zod parse error surfaces as the "validation failure" error state (§8.5.3) rather than a white screen. Any schema change on the backend should be paired with an updated live response example in the spec or repo.

**R7 — `provenance[].value = "N/A"` behaviour confuses audience.**

- *Impact:* Low — rendered as an em-dash, not as the literal text "N/A"
- *Likelihood:* Low — handled at the display layer
- *Mitigation:* §4.7 documented; rendering rule specified in §8.9. Cleanup at the backend side is a later task.

**R8 — The full hybrid serif-plus-sans typography feels too academic for the internal audience.**

- *Impact:* Low — it's a stylistic concern, not a functional one
- *Likelihood:* Medium — the distinctive look is a deliberate bet
- *Mitigation:* The fallback (Inter-only body and headings, serif reserved for the wordmark) is a one-file change in the design tokens; reversible before the demo with minimal effort.

**R9 — Claude Code over-engineers during implementation.**

- *Impact:* Medium — produces code that doesn't match the "simple now, scale later" principle
- *Likelihood:* Medium — LLM codegen tools often add abstraction preemptively
- *Mitigation:* The spec repeatedly names specific non-goals (no global state, no memoisation by default, no form library, no custom hooks beyond `useTranslateQuery`, no premature component extraction). Section 9 in particular commits explicitly to the simplest option at each fork. Review the first implementation pass against the "What is deliberately NOT…" subsections.

**R10 — The single-hook contract (§9.3) proves awkward and gets split during implementation.**

- *Impact:* Low — the code still works; architectural cleanliness suffers
- *Likelihood:* Low — the contract is small and self-contained
- *Mitigation:* The sketch in §9.3 is illustrative; the contract is the interface. If implementation finds the single-hook pattern awkward, the resolution is to refactor toward the contract, not to multiply hooks.

### 12.4 Assumptions baked into the spec that could prove wrong

A different category from risks — things currently assumed true that, if false, require spec revisions.

- **`VITE_CACHE_MODE=off` is the right default.** It favours the evaluation use case over the demo use case. If the demo is imminent and evaluation is done, flipping to `session` for the demo session is a one-line env-var change.
- **The 9 curated queries all succeed.** The spec is built around this assumption. If some fail, the demo set shrinks; the UI is unaffected but the narrative flow is.
- **The backend's response time is 2–10 s.** If it's consistently longer (say, 30+ s), the loading state design needs a stronger signal of progress — possibly the streaming option from §4.9 becomes necessary rather than optional.
- **The presenter narrates the demo.** If the demo becomes self-serve (e.g. a kiosk for the advisory board), the copy in §8.13 is too terse and needs richer in-UI explanation.
- **One screen is enough for the demo.** If a "methodology" or "about" page becomes required mid-scope, Section 3 is correct that React Router is a cheap addition — but the spec's one-route assumption propagates into §5 and §9 and would need a pass.

### 12.5 What happens when this spec is wrong

Specs written ahead of implementation are wrong in at least small ways. Two principles for resolving disagreements between the spec and reality:

1. **Conflicts between sections are a spec bug; earlier sections win.** If §8 appears to contradict §3, §3 is the source of truth and §8 should be corrected. This is true because §3 (architecture) was decided deliberately and §8 (screens) follows from it.
2. **Conflicts between the spec and the working code are resolved by a decision, not by drift.** If during implementation a spec choice turns out to be wrong, the spec gets updated — not ignored. The spec is a living document that should match what ships.

A short "revision log" at the top of the spec doc in the repo tracks material changes post-implementation.

---

*End of specification.*
