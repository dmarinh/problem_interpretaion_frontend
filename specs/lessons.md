# Lessons Learned

Running record of project-specific lessons. Read at the start of every session. Append a new entry whenever a lesson is learned — see "Maintaining `lessons.md`" in `CLAUDE.md` for when and how.

Format for each entry:

```
## YYYY-MM-DD — Short title

**Context:** one sentence on what was being worked on.
**Lesson:** one to three sentences on what was learned.
**Action:** the rule or check to apply going forward.
**Reference:** related spec section, file, or commit if relevant.
```

Newest entries at the bottom. Do not edit or remove past entries.

---

## 2026-04-22 — ErrorBoundary is the sole permitted class component

**Context:** Implementing `src/main.tsx` at Checkpoint 1, which requires a top-level error boundary per §10.5.
**Lesson:** React's error boundary API (`getDerivedStateFromError` / `componentDidCatch`) has no function-component equivalent; a class component is the only option. The "function components only" rule in CLAUDE.md cannot apply here.
**Action:** Do not flag or attempt to refactor the `ErrorBoundary` class component in `src/main.tsx`. It is explicitly affirmed as the one class component permitted in this codebase. No other class components are allowed.
**Reference:** §10.5, `src/main.tsx`, CLAUDE.md "Code conventions".

## 2026-04-22 — Schema test fixtures must be real backend responses, not spec-derived reconstructions

**Context:** Writing schema round-trip tests at Checkpoint 1; §4.3 provides a TypeScript type definition but no literal JSON example.
**Lesson:** Constructing test fixtures from the spec's type definition is circular — a schema bug that matches the spec's description would pass the test. Real backend responses break this circularity and also surface unexpected backend behaviour (e.g. A2 and C3 queries failed at the backend due to duration inference gaps not visible in the spec). Three real responses were captured and committed as fixtures: `single-step-growth.json`, `multi-step-growth.json`, `thermal-inactivation.json`.
**Action:** Always use real backend captures for schema fixtures. When the backend schema changes, recapture with `curl -X POST $VITE_API_BASE_URL/api/v1/translate` and replace the fixture files. Do not reconstruct from the §4.3 type definition.
**Reference:** §4.3 (amended to reference fixtures), `src/features/translation/api/__fixtures__/`.

## 2026-04-23 — Package manager switched from pnpm to npm; spec explicitly accommodates this

**Context:** Switched the project's package manager from pnpm to npm at Checkpoint 1.
**Lesson:** The spec (§3.1) already states "Not a religious choice — npm is acceptable if preferred." The switch required no `package.json` script changes (all scripts call `vite`, `vitest run`, etc. directly — not pnpm-specific wrappers). Documentation updates only: `frontend-spec.md` §3.1 table, the §10 lock-file reference, and build/deploy command examples; `checkpoint-contract.md` CP1 deliverable and reviewer checklist; `CLAUDE.md` tech stack bullet and commands block; `README.md` install/run instructions.
**Action:** Use `npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm test`, `npm run lint`, `npm run typecheck` throughout. The checkpoint gate command is `npm run typecheck && npm run lint && npm test`. Do not revert to pnpm without an explicit instruction.
**Reference:** §3.1, CLAUDE.md "Commands", `README.md`.

## 2026-04-23 — env validation must not throw at module level; ESM module errors are uncatchable by importers

**Context:** Implementing env validation in `shared/config/env.ts` for Checkpoint 1; the CP1 reviewer checklist requires visible startup errors for invalid env vars.
**Lesson:** When a module throws at evaluation time (top-level `throw` or `throw` in top-level `if`), the error propagates as an ESM module evaluation failure. No downstream importer can catch it with `try/catch` — the error fires as an uncaught exception before any code in the importing module runs. `ErrorBoundary` also cannot catch it because React hasn't mounted yet. The result is a blank page with no visible error. The fix: move validation into an exported `validateEnv()` function that `main.tsx` calls explicitly inside a `try/catch`. If validation fails, `main.tsx` renders an inline error page directly to the DOM (no React involved) and does not call `mountApp()`. `ErrorBoundary` is for errors thrown during React rendering, not for startup configuration errors.
**Action:** Never throw at module level in any file that is statically imported at startup. Always gate startup validation behind an explicit function call in `main.tsx`, wrapped in a `try/catch` that renders a visible error page. Also: `vite-env.d.ts` must type all potentially-absent env vars as `string | undefined`, not `string`, so TypeScript truthiness guards are type-correct.
**Reference:** §3.6, `src/shared/config/env.ts`, `src/main.tsx`, `src/vite-env.d.ts`.

## 2026-04-23 — §3.5 is authoritative for folder structure and must be kept in sync when other sections add files

**Context:** Amending §3.5 after Checkpoint 1 implementation revealed that `errors.ts`, `keys.ts`, `__fixtures__/`, and `__tests__/` were absent from the tree despite being required by §9.4, §9.2, and the fixture-circularity lesson.
**Lesson:** §3.5 is the single authoritative picture of the folder structure. Other sections (§9.2, §9.4, lessons.md) can specify files by name and purpose, but if those files don't also appear in the §3.5 tree, a future session will scaffold from §3.5 alone and miss them. The discrepancy between the specified files and the tree was only caught at CP1 review.
**Action:** Whenever a spec section or lessons entry introduces a new file (by name, path, or purpose), also add it to the §3.5 tree in the same edit. Treat the §3.5 tree as a checklist: if a file exists in the repo but not in the tree, or is specified in the spec but not in the tree, the tree is wrong and must be updated.
**Reference:** §3.5, §9.2, §9.4.

## 2026-04-23 — React 18 RefObject type parameter must not include null

**Context:** Implementing CP2 components with optional heading refs passed across component boundaries, with `exactOptionalPropertyTypes: true` in tsconfig.
**Lesson:** Two distinct issues surfaced: (1) In React 18's `@types/react`, the JSX `ref` attribute accepts `LegacyRef<T>` which requires `RefObject<T>` (not `RefObject<T | null>`). Writing `RefObject<HTMLHeadingElement | null>` causes a type mismatch even though `useRef<HTMLHeadingElement>(null)` returns `RefObject<HTMLHeadingElement>` with `.current: HTMLHeadingElement | null`. The `| null` belongs to the `.current` property, not to the generic type parameter. (2) With `exactOptionalPropertyTypes: true`, you cannot pass `Foo | undefined` to a prop typed as `?: Foo` — the value must be exactly `Foo` or the prop must be absent. Conditionally spreading `{...(val !== undefined ? { prop: val } : {})}` is the correct fix, or make the prop required everywhere it is always provided.
**Action:** Always write `React.RefObject<HTMLElement>` (no `| null` in type param). When a prop is optional and the outer component may have it as `undefined`, make it required if it's always provided at the call site — don't cascade the optional through multiple layers.

## 2026-04-23 — Session cache mode removed; always-fetch is the correct behaviour

**Context:** CP2 verification revealed that `VITE_CACHE_MODE=session` was not working as expected — in-tab replay still hit the backend on every submit.
**Lesson:** The session cache mode added complexity (env var, conditional staleTime, setQueryData in onSuccess, documentation in four spec sections) but delivered no observable value in the evaluation workflow, where fresh backend calls are desirable. Cross-tab demos cannot share in-memory cache regardless. Fixing the behaviour would have added more complexity without changing the fundamental answer: for this use case, always-fetch is simpler and correct.
**Action:** If cache behaviour is ever needed again, it comes back as a deliberate addition with explicit end-to-end verification, not as an option flag. Do not re-introduce `VITE_CACHE_MODE` without a concrete use case that cannot be served by always-fetch.
**Reference:** `src/shared/config/env.ts`, `src/features/translation/hooks/useTranslateQuery.ts`, `src/main.tsx`, prior lessons on session cache.

## 2026-04-23 — Static assets in public/ referenced by URL path, not module import; logo alt text names the maker

**Context:** Integrating the Foodigit logo PNG into the header (CP2 amendment, pre-CP3).
**Lesson:** Assets placed in `public/` are served by Vite at the root URL and must be referenced as `/logo.png` in markup — not imported as ES modules. Importing them would cause Vite to hash and bundle them, losing the stable public URL. Explicit `width` and `height` attributes on `<img>` are needed when the native image is much larger than the rendered size to reserve layout space and prevent CLS (the browser will downscale a 880×282 PNG to 32 px tall without quality loss, but without the attributes it can't allocate space before the image loads). Alt text for a maker's logo that sits beside a product wordmark should name the maker, not repeat the product name — "Foodigit logo" attributes the organisation; "Problem Translator" is already in the adjacent wordmark text.
**Action:** Future logo or static-asset additions go in `public/` with URL referencing. Always add explicit `width`/`height` attrs when native dimensions differ significantly from rendered size. Write alt text that conveys what the image adds beyond what surrounding text already says.
**Reference:** §8.2, §8.13, `src/App.tsx`.
