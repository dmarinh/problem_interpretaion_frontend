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

## 2026-04-28 — StandardizationService now populates the standardization block; parsed_range fallback removed

**Context:** Backend migrated range-bound selection from GroundingService to StandardizationService, populating `field_audit[].standardization` with a structured block (`rule`, `direction`, `reason`, `before_value`, `after_value`) for every range narrowed to a single value.
**Lesson:** The prior PipelineStrip workaround (`extraction.parsed_range.length >= 2` as a proxy for standardization events) was correct while the backend left `standardization: null` for ranged values. After the backend migration, the real block is always populated — the fallback overstated the count and masked the migration. The StandardizationSchema field names also changed (`description`→`reason`, `before`→`before_value`, `after`→`after_value`). The `source` enum no longer distinguishes user-supplied ranges from user-supplied point values — that distinction now lives in `parsed_range` and the standardization block.
**Action:** When the backend populates a structured block, read it directly rather than inferring from adjacent fields. Before writing a proxy heuristic, ask whether the backend will eventually provide the real signal. A new backend-internal field `range_pending: boolean` was added to `FieldAuditSchema`; add a dev-mode assertion that warns if it arrives as `true` (indicates an incomplete backend response). Do not render `range_pending` in the UI.
**Reference:** `src/features/translation/api/schema.ts` (StandardizationSchema), `src/features/translation/utils/pipelineStrip.ts`, `src/features/translation/components/ProvenancePanel.tsx`, §4.3, §8.5.4, §8.9.

## 2026-04-28 — Backend removed bias_corrections; defaults_imputed became structured

**Context:** Backend conceptual cleanup removed the BiasCorrection phase and renamed the event class to DefaultImputed. The frontend Zod schema broke because `audit.audit.bias_corrections` was required but no longer present.

**Lesson:** `bias_corrections` is completely gone (not optional, not renamed at the same path). `defaults_imputed` changed from a string array (with `"(none applied)"` sentinel) to a structured `DefaultImputed[]` list (may be empty; no sentinel). The `range_clamps` and `warnings` string arrays with their sentinel are unchanged. The `hasRealItems` sentinel-check helper applies only to the string-array categories; `defaults_imputed.length > 0` is the correct empty check for the structured list.

**Action:** When `defaults_imputed` is used as a groundingWarning trigger, compare `.length > 0` not `hasRealItems()`. When rendering `defaults_imputed` entries, read `field_name` and `reason` from the structured object — not a raw string. The old fixture sentinel `["(none applied)"]` for `defaults_imputed` becomes `[]`. Any synthetic test fixture using the audit categories block must omit `bias_corrections` entirely and use `[]` for an empty `defaults_imputed`.

**Reference:** `src/features/translation/api/schema.ts` (DefaultImputedSchema, AuditCategoriesSchema), `src/features/translation/utils/pipelineStrip.ts`, `src/features/translation/components/AuditChecks.tsx`, `src/features/translation/api/__fixtures__/verbose-growth.json`.

## 2026-04-28 — defaults_imputed is still a string array; verify live backend before assuming structured types

**Context:** Syncing the frontend schema after the backend removed bias_corrections and renamed BiasCorrection → DefaultImputed. The task description said defaults_imputed was now a structured object list, but the live backend returned `"Expected object, received string"` errors.

**Lesson:** The backend description stated defaults_imputed would become a structured `DefaultImputed[]` list, but the live backend still returns a string array with the `"(none applied)"` sentinel — the same format as range_clamps and warnings. A live curl before writing schema changes would have caught this immediately. The structured format may arrive in a future backend update.

**Action:** Before changing a schema type from string to structured object (or vice versa), curl the live backend and inspect the actual value. Do not trust task descriptions or spec text alone when the live backend is available. The check costs 30 seconds; a revert cycle costs far more.

**Reference:** `src/features/translation/api/schema.ts` (AuditCategoriesSchema), curl: `curl -X POST "http://localhost:8000/api/v1/translate?verbose=true" -H "Content-Type: application/json" -d '{"query":"..."}'`

## 2026-04-28 — defaults_imputed became structured objects; sentinel pattern retired

**Context:** Follow-up backend update shipped: defaults_imputed changed from a string array (with "(none applied)" sentinel) to a structured DefaultImputedInfo object list, and all three audit categories now emit truly empty arrays instead of sentinels.

**Lesson:** The `hasRealItems` helper that filtered sentinel strings was a backend workaround masquerading as business logic. Once the backend emits honest empty arrays, the helper should be deleted entirely — not preserved for "safety." Leaving it would silently accept sentinel strings from a reverted backend, making the regression invisible. The UI-layer "(none applied)" copy belongs in `strings.ts` and is rendered when `array.length === 0`; it is unrelated to the backend sentinel.

**Action:** When a backend sentinel pattern is retired, delete the filtering helper immediately. UI copy for the empty state is always the frontend's own responsibility — keep it in the strings inventory. For structured list fields (like DefaultImputedInfo), use `formatFieldName` for the `field_name` display and `formatImputedValue` for `default_value` (template is in `format.ts`).

**Reference:** `pipelineStrip.ts` (hasRealItems removed), `AuditChecks.tsx` (DefaultImputedRow added), `format.ts` (formatImputedValue added), `api/__fixtures__/verbose-defaults.json` (zarblax live capture).

## 2026-04-28 — user_inferred field_audit has no structured INTERPRETATION data

**Context:** Adding a STANDARDIZATION column and chevron disclosure for Inferred rows in the Provenance panel. The task description listed rule, pattern, conservative, similarity as expected fields inside `field_audit` for `user_inferred` sources.

**Lesson:** The live backend does not expose structured INTERPRETATION data for `user_inferred` fields. `field_audit.temperature_celsius` for an inferred-temperature query returns `{ source: "user_inferred", extraction: null, standardization: null, retrieval: null }` — no rule, no pattern, no conservative flag. All interpretation context is in the flat `provenance[].notes` string ("Interpreted as 25.0°C (Standard assumption; actual range 20-25°C)"). The Chevron disclosure can only show the notes text; the structured INTERPRETATION block is a backend follow-up.

**Action:** For inferred chevron disclosures, read `provenance[].notes` for the field and render it as plain text under an INTERPRETATION sub-heading. Do not parse the notes string to extract mapped value or rule name — the format is not guaranteed. File the structured INTERPRETATION fields (method, pattern, conservative) as a backend follow-up rather than working around them.

**Reference:** `src/features/translation/api/__fixtures__/inferred-growth.json`, `src/features/translation/components/ProvenancePanel.tsx` (FieldAuditDisclosure, inferredNote prop).

## 2026-04-28 — Backend now provides structured extraction for user_inferred fields (rule_match and embedding_fallback)

**Context:** Updating the INTERPRETATION disclosure in the Provenance panel to surface matched_pattern, conservative, canonical_phrase, and similarity for inferred values.
**Lesson:** The prior lesson (2026-04-28 "user_inferred field_audit has no structured INTERPRETATION data") is now superseded. The backend populates `field_audit[field].extraction` for `user_inferred` fields with `method: "rule_match"` or `method: "embedding_fallback"`. The `rule_match` shape includes `matched_pattern`, `conservative`, `notes` (and null `similarity`/`canonical_phrase`). The `embedding_fallback` shape includes `canonical_phrase`, `similarity`, `conservative`, `notes` (and null `matched_pattern`). Both have `raw_match: null` and `parsed_range: null` — these fields are for RAG-style extraction and are meaningless here. The EXTRACTION block (Method, Raw match, Parsed range) is suppressed for `user_inferred` source; those fields use INTERPRETATION exclusively. The `inferred-growth.json` fixture was updated from `extraction: null` to reflect the real backend shape. `embedding-fallback.json` was created as a synthetic fixture (not a live capture — live backend should be used to replace it when available).
**Action:** For `user_inferred` fields: render INTERPRETATION with structured extraction when method is rule_match or embedding_fallback. Never show Raw match or Parsed range rows in INTERPRETATION. Suppress the EXTRACTION block entirely for `user_inferred` source. Boolean `conservative` renders as "yes" / "no". Matched pattern and canonical phrase render quoted to signal verbatim strings.
**Reference:** `src/features/translation/api/schema.ts` (ExtractionSchema), `src/features/translation/components/ProvenancePanel.tsx` (FieldAuditDisclosure), `src/features/translation/api/__fixtures__/inferred-growth.json`, `src/features/translation/api/__fixtures__/embedding-fallback.json`, §8.9, §4.5.

## 2026-04-28 — RAG retrieval without a standardization block still shows stale provenance note

**Context:** Fixing the "awaiting standardization" placeholder that appears in the DETAIL column for RAG fields that have a parsed_range but no standardization block (e.g., chicken pH: range [6.2, 6.4], final value 6.2, but standardization is null).

**Lesson:** The backend writes `"range extracted, awaiting standardization"` to `transformation_applied` (and propagates to `provenance[].notes`) as a transitional state. For completed responses, this string is always stale — the standardization step has already run. But `standardization` may still be null if the backend chose not to emit a block (e.g. when the lower bound happened to equal the raw extracted value). The frontend must filter this placeholder rather than display it.

**Action:** In `deriveDetailNote()`, check `rawProvenanceNote?.includes('awaiting standardization')` and return null in that case. Additionally, when `extraction.parsed_range` is present but no standardization block exists, derive `"range {min}–{max}"` from the extraction as a minimal but always-accurate DETAIL note. The full bound choice is visible in the disclosure's Extraction section.

**Reference:** `src/features/translation/components/ProvenancePanel.tsx` (deriveDetailNote), `src/features/translation/api/__fixtures__/inferred-growth.json` (ph field: standardization: null, notes: "range extracted, awaiting standardization").

## 2026-05-01 — retrieval.top_match must be nullable; Zod strips unknown fields silently

**Context:** Backend change to retrieval semantics: `top_match` now means "the doc that supplied final_value" and is null when no doc meets the threshold; two new optional fields (`reranker_top`, `attempted_top`) were added.

**Lesson:** (1) `top_match` was typed as required non-nullable in `RetrievalBlockSchema`. A backend response with `top_match: null` caused the entire `TranslationResponseSchema.safeParse()` to fail — not a graceful fallback, a full parse error surfaced to the user. (2) Zod's default object mode is `strip`, so new optional fields (`reranker_top`, `attempted_top`) are silently dropped without a parse error. Silent drops are invisible in normal operation; only an explicit investigation surfaces them. (3) TypeScript's null-safety caught all five remaining unsafe `top_match.*` accesses after the schema fix — the compiler errors were the complete list of rendering MUSTs, requiring no manual audit.

**Action:** When a backend field that was previously always-present can become null, the schema change is one line (`.nullable()`), but it forces a full TypeScript compile to find every unsafe access. Run typecheck immediately after any `.nullable()` addition and treat the errors as the authoritative list of rendering fixes. For new fields silently dropped by Zod, document them in the investigation report and make a deliberate choice — don't assume absence in the parse output means absence in the wire response.

**Reference:** `src/features/translation/api/schema.ts` (RetrievalBlockSchema), `src/features/translation/components/ProvenancePanel.tsx` (FieldAuditDisclosure, VerboseTable), `src/features/translation/api/__tests__/schema.test.ts` (null top_match test).
