import { describe, it, expect } from 'vitest';
import { TranslationResponseSchema } from '../schema';
import singleStepGrowth from '../__fixtures__/single-step-growth.json';
import multiStepGrowth from '../__fixtures__/multi-step-growth.json';
import thermalInactivation from '../__fixtures__/thermal-inactivation.json';

// Fixtures are real backend responses captured 2026-04-22.
// See specs/frontend-spec.md §4.3 for the shape reference.

describe('TranslationResponseSchema — single-step growth (B1-style)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    expect(result.success).toBe(true);
  });

  it('populates top-level fields', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    if (!result.success) return;
    expect(result.data.success).toBe(true);
    expect(result.data.status).toBe('completed');
    expect(result.data.original_query).toContain('Salmonella');
  });

  it('populates prediction fields', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    if (!result.success) return;
    const p = result.data.prediction;
    expect(p).not.toBeNull();
    expect(p?.organism).toBe('SALMONELLA');
    expect(p?.model_type).toBe('growth');
    expect(p?.is_multi_step).toBe(false);
    expect(p?.steps).toHaveLength(1);
    expect(p?.doubling_time_hours).toBeTypeOf('number');
  });

  it('populates provenance with value "N/A" (§4.7 quirk)', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    if (!result.success) return;
    const naEntry = result.data.provenance.find((p) => p.value === 'N/A');
    expect(naEntry).toBeDefined();
  });

  it('populates warnings with field-scoped entries', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    if (!result.success) return;
    const biasCorrection = result.data.warnings.find((w) => w.type === 'bias_correction');
    expect(biasCorrection).toBeDefined();
    expect(biasCorrection?.field).toBeTypeOf('string');
  });
});

describe('TranslationResponseSchema — multi-step growth (counter + fridge)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(multiStepGrowth);
    expect(result.success).toBe(true);
  });

  it('populates multi-step prediction fields', () => {
    const result = TranslationResponseSchema.safeParse(multiStepGrowth);
    if (!result.success) return;
    const p = result.data.prediction;
    expect(p?.is_multi_step).toBe(true);
    expect(p?.steps).toHaveLength(2);
    expect(p?.step_predictions).toHaveLength(2);
    // duration_minutes is total across steps (§4.7 quirk)
    expect(p?.duration_minutes).toBe(480);
    // temperature_celsius is first-step value only (§4.7 quirk)
    expect(p?.temperature_celsius).toBe(22);
  });

  it('accepts warnings with field: null (§4.7 quirk)', () => {
    const result = TranslationResponseSchema.safeParse(multiStepGrowth);
    if (!result.success) return;
    const nullField = result.data.warnings.find((w) => w.field === null);
    expect(nullField).toBeDefined();
  });
});

describe('TranslationResponseSchema — thermal inactivation (C2)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(thermalInactivation);
    expect(result.success).toBe(true);
  });

  it('populates thermal inactivation fields', () => {
    const result = TranslationResponseSchema.safeParse(thermalInactivation);
    if (!result.success) return;
    const p = result.data.prediction;
    expect(p?.model_type).toBe('thermal_inactivation');
    // mu_max is negative for inactivation
    expect(p?.mu_max).toBeLessThan(0);
    // total_log_increase is negative (log reduction)
    expect(p?.total_log_increase).toBeLessThan(0);
    // doubling_time_hours is null for inactivation
    expect(p?.doubling_time_hours).toBeNull();
  });

  it('includes warnings with field: null (§4.7 quirk)', () => {
    const result = TranslationResponseSchema.safeParse(thermalInactivation);
    if (!result.success) return;
    const globalWarning = result.data.warnings.find((w) => w.field === null);
    expect(globalWarning).toBeDefined();
  });

  it('rejects a response missing required fields', () => {
    const broken = { ...thermalInactivation } as Record<string, unknown>;
    delete broken['session_id'];
    const result = TranslationResponseSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});
