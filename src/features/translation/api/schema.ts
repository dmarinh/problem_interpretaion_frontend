import { z } from 'zod';

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
