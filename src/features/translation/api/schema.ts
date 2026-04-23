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
  confidence: z.number(),
  notes: z.string().nullable(),
});

const WarningItemSchema = z.object({
  type: z.string(),
  message: z.string(),
  field: z.string().nullable(),
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
  overall_confidence: z.number().nullable(),
  error: z.string().nullable(),
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
}
