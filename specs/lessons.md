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
