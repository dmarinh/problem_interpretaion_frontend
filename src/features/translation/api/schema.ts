import { z } from 'zod';
import type { TranslationResponse } from './types';

const StepSchema = z.object({
  step_order: z.number(),
  temperature_celsius: z.number(),
  duration_minutes: z.number(),
});

const StepPredictionSchema = z.object({
  step_order: z.number(),
  temperature_celsius: z.number(),
  duration_minutes: z.number(),
  mu_max: z.number(),
  log_increase: z.number(),
});

const PredictionSchema = z.object({
  organism: z.string(),
  model_type: z.string(),
  engine: z.string(),
  temperature_celsius: z.number(),
  duration_minutes: z.number(),
  ph: z.number(),
  water_activity: z.number(),
  mu_max: z.number(),
  doubling_time_hours: z.number().nullable(),
  total_log_increase: z.number(),
  is_multi_step: z.boolean(),
  steps: z.array(StepSchema),
  step_predictions: z.array(StepPredictionSchema),
  growth_description: z.string(),
});

const ProvenanceItemSchema = z.object({
  field: z.string(),
  value: z.string(),
  source: z.string(),
  // confidence was removed from the backend response
  confidence: z.number().optional(),
  notes: z.string().nullable(),
});

const WarningItemSchema = z.object({
  type: z.string(),
  message: z.string(),
  field: z.string().nullable(),
});

// ── Verbose audit block schemas (§4.3, present when verbose=true is sent) ────

const RetrievalTopMatchSchema = z.object({
  doc_id: z.string(),
  embedding_score: z.number(),
  rerank_score: z.number().nullable(),
  retrieved_text: z.string(),
  source_ids: z.array(z.string()),
  full_citations: z.record(z.string(), z.string()),
});

const RunnerUpSchema = z.object({
  doc_id: z.string(),
  content_preview: z.string(),
  embedding_score: z.number(),
  rerank_score: z.number().nullable(),
});

const RetrievalBlockSchema = z.object({
  query: z.string(),
  // nullable: backend sends null when no doc passes the retrieval threshold
  top_match: RetrievalTopMatchSchema.nullable(),
  runners_up: z.array(RunnerUpSchema),
});

const ExtractionSchema = z.object({
  method: z.string(),
  raw_match: z.string().nullable(),
  parsed_range: z.array(z.number()).nullable().optional(),
  // rule_match and embedding_fallback fields (present when method matches; null for other methods)
  matched_pattern: z.string().nullable().optional(),
  conservative: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  // embedding_fallback only
  similarity: z.number().nullable().optional(),
  canonical_phrase: z.string().nullable().optional(),
});

const StandardizationSchema = z.object({
  rule: z.string(),
  direction: z.string(),
  reason: z.string(),
  // before_value is an array [min, max] for range_bound_selection; keep permissive
  before_value: z.union([z.array(z.number()), z.number(), z.string()]),
  after_value: z.number(),
});

// Per-field breakdown. source is permissive (z.string()) per §4.4.
// retrieval/extraction/standardization are null (not absent) for user_explicit fields.
// range_pending is a backend-internal flag; should never be true in UI-bound responses.
const FieldAuditSchema = z.object({
  final_value: z.union([z.string(), z.number()]).nullable().optional(),
  source: z.string(),
  extraction: ExtractionSchema.nullable().optional(),
  standardization: StandardizationSchema.nullable().optional(),
  retrieval: RetrievalBlockSchema.nullable().optional(),
  range_pending: z.boolean().optional(),
});

const CombaseModelSchema = z.object({
  organism: z.string(),
  model_type: z.string(),
  model_id: z.number(),
  selection_reason: z.string(),
  // valid_ranges are [min, max] tuples, not {min, max} objects
  valid_ranges: z.record(z.string(), z.tuple([z.number(), z.number()])),
  coefficients_str: z.string(),
});

const AuditSystemSchema = z.object({
  ptm_version: z.string(),
  combase_model_table_hash: z.string().nullable(),
  rag_store_hash: z.string().nullable(),
  rag_ingested_at: z.string().nullable(),
  source_csv_audit_date: z.string().nullable(),
});

// Structured object emitted when a default value was imputed for a missing field.
// Backend class: DefaultImputedInfo. Confirmed against live backend 2026-04-28.
export const DefaultImputedInfoSchema = z.object({
  field_name: z.string(),
  default_value: z.union([z.number(), z.string()]),
  reason: z.string(),
});

// Nested audit categories. bias_corrections was removed (2026-04-28).
// Empty categories now emit truly empty arrays — no "(none applied)" sentinel.
// range_clamps and warnings remain string arrays.
// defaults_imputed is now a structured list of DefaultImputedInfo objects.
const AuditCategoriesSchema = z.object({
  range_clamps: z.array(z.string()),
  defaults_imputed: z.array(DefaultImputedInfoSchema),
  warnings: z.array(z.string()),
});

// Top-level audit block. Nullish because backend sends null when not populated.
// In production verbose=true is always sent (§4.2), so this should always be an object.
export const AuditBlockSchema = z.object({
  // Keys are field names (e.g. "ph", "organism", "temperature_celsius").
  // z.record() used because key set is unknown at schema time — depends on the query.
  field_audit: z.record(z.string(), FieldAuditSchema),
  combase_model: CombaseModelSchema,
  // Nested audit sub-object with four category lists
  audit: AuditCategoriesSchema,
  system: AuditSystemSchema,
});

export const TranslationResponseSchema = z.object({
  success: z.boolean(),
  session_id: z.string(),
  status: z.string(),
  created_at: z.string(),
  completed_at: z.string(),
  original_query: z.string(),
  prediction: PredictionSchema.nullable(),
  provenance: z.array(ProvenanceItemSchema),
  warnings: z.array(WarningItemSchema),
  // overall_confidence was removed from the backend response
  overall_confidence: z.number().nullish(),
  error: z.string().nullable(),
  // Verbose audit block — nullish; backend sends null when not populated (§4.3)
  audit: AuditBlockSchema.nullish(),
});

/**
 * Dev-mode consistency assertions for the parsed response (§9.11).
 * All are console.warn — never thrown, so they don't break the demo.
 */
export function runDevAssertions(data: TranslationResponse): void {
  if (!import.meta.env.DEV) return
  const { prediction } = data
  if (!prediction) return

  if (prediction.steps.length !== prediction.step_predictions.length) {
    console.warn(
      `[schema] prediction.steps.length (${prediction.steps.length}) ≠ ` +
        `prediction.step_predictions.length (${prediction.step_predictions.length})`,
    )
  }

  if (prediction.is_multi_step !== prediction.steps.length > 1) {
    console.warn(
      `[schema] prediction.is_multi_step (${prediction.is_multi_step}) ` +
        `inconsistent with steps.length (${prediction.steps.length})`,
    )
  }

  for (let i = 0; i < prediction.step_predictions.length; i++) {
    const sp = prediction.step_predictions[i]
    if (sp !== undefined && sp.step_order !== i + 1) {
      console.warn(
        `[schema] step_predictions[${i}].step_order is ${sp.step_order}, expected ${i + 1}`,
      )
    }
  }

  // Warn if verbose=true was sent but audit block is absent — indicates backend
  // schema mismatch; the audit panels will fall back to provenance[] rendering.
  if (!data.audit) {
    console.warn(
      '[schema] audit block absent — verbose=true was sent but the backend did not ' +
        'return audit data. Verify the backend supports verbose=true and capture a ' +
        'fresh fixture: curl -X POST $VITE_API_BASE_URL/api/v1/translate -d \'{"query":"...","verbose":true}\'',
    )
  }

  // range_pending = true means the StandardizationService has not yet resolved a
  // bound for this range. It must never be true in a completed response.
  if (data.audit) {
    for (const [field, fa] of Object.entries(data.audit.field_audit)) {
      if (fa?.range_pending === true) {
        console.warn(
          `[schema] field_audit['${field}'].range_pending is true — ` +
            'this indicates a backend regression: StandardizationService did not ' +
            'resolve a range bound before the response was returned.',
        )
      }
    }
  }
}
