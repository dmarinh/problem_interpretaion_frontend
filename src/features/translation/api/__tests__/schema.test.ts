import { describe, it, expect } from 'vitest';
import { TranslationResponseSchema } from '../schema';
import singleStepGrowth from '../__fixtures__/single-step-growth.json';
import multiStepGrowth from '../__fixtures__/multi-step-growth.json';
import thermalInactivation from '../__fixtures__/thermal-inactivation.json';
import verboseGrowth from '../__fixtures__/verbose-growth.json';
import verboseDefaults from '../__fixtures__/verbose-defaults.json';
import inferredGrowth from '../__fixtures__/inferred-growth.json';
import embeddingFallback from '../__fixtures__/embedding-fallback.json';

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

describe('TranslationResponseSchema — verbose growth (with audit block)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    expect(result.success).toBe(true);
  });

  it('audit block is present and has expected top-level shape', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const { audit } = result.data;
    expect(audit).toBeDefined();
    expect(audit?.field_audit).toBeDefined();
    expect(audit?.combase_model).toBeDefined();
    expect(audit?.system).toBeDefined();
    // Categories are nested under audit.audit
    expect(audit?.audit).toBeDefined();
  });

  it('three audit categories exist under audit.audit; all empty for bread query', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const categories = result.data.audit!.audit;
    // Bread query has no events in any category; backend now emits truly empty arrays.
    expect(categories.range_clamps).toEqual([]);
    expect(categories.defaults_imputed).toEqual([]);
    expect(categories.warnings).toEqual([]);
    expect((categories as Record<string, unknown>)['bias_corrections']).toBeUndefined();
  });

  it('user_explicit field has source and null retrieval/extraction/standardization', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const organismField = result.data.audit!.field_audit['organism'];
    expect(organismField).toBeDefined();
    expect(organismField?.source).toBe('user_explicit');
    expect(organismField?.retrieval).toBeNull();
    expect(organismField?.standardization).toBeNull();
  });

  it('rag_retrieval field has extraction and retrieval blocks', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phField = result.data.audit!.field_audit['ph'];
    expect(phField?.source).toBe('rag_retrieval');
    expect(phField?.extraction).not.toBeNull();
    expect(phField?.retrieval).not.toBeNull();
  });

  it('retrieval top_match has embedding_score as number', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phRetrieval = result.data.audit!.field_audit['ph']?.retrieval;
    expect(phRetrieval?.top_match.embedding_score).toBeTypeOf('number');
    expect(phRetrieval?.top_match.embedding_score).toBeCloseTo(0.793, 3);
  });

  it('retrieval top_match has full_citations as a string record', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phRetrieval = result.data.audit!.field_audit['ph']?.retrieval;
    const citations = phRetrieval?.top_match.full_citations;
    expect(citations).toBeDefined();
    expect(typeof citations?.['FDA-PH-2007']).toBe('string');
    expect(typeof citations?.['IFT-2003-T31']).toBe('string');
  });

  it('retrieval top_match has source_ids as string array', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phRetrieval = result.data.audit!.field_audit['ph']?.retrieval;
    expect(phRetrieval?.top_match.source_ids).toContain('FDA-PH-2007');
    expect(phRetrieval?.top_match.source_ids).toContain('IFT-2003-T31');
  });

  it('retrieval runners_up have embedding_score and content_preview', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phRetrieval = result.data.audit!.field_audit['ph']?.retrieval;
    expect(phRetrieval?.runners_up).toHaveLength(2);
    const first = phRetrieval?.runners_up[0];
    expect(first?.embedding_score).toBeTypeOf('number');
    expect(first?.content_preview).toBeTypeOf('string');
  });

  it('combase_model has organism, model_id, valid_ranges, and coefficients_str', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const model = result.data.audit!.combase_model;
    expect(model.organism).toBe('BACILLUS_CEREUS');
    expect(model.model_type).toBe('growth');
    expect(model.model_id).toBe(1);
    expect(model.valid_ranges).toBeDefined();
    expect(model.coefficients_str).toBeTypeOf('string');
  });

  it('rag_retrieval field with range has populated standardization block with new field names', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const phField = result.data.audit!.field_audit['ph'];
    expect(phField?.standardization).not.toBeNull();
    expect(phField?.standardization?.rule).toBe('range_bound_selection');
    expect(phField?.standardization?.direction).toBe('upper');
    expect(phField?.standardization?.after_value).toBe(6.2);
    expect(phField?.standardization?.before_value).toEqual([5.0, 6.2]);
    expect(phField?.standardization?.reason).toBeTypeOf('string');
  });

  it('combase_model valid_ranges are [min, max] tuples', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const ranges = result.data.audit!.combase_model.valid_ranges;
    expect(ranges['temperature_celsius']?.[0]).toBe(5);
    expect(ranges['temperature_celsius']?.[1]).toBe(34);
  });

  it('system block has ptm_version, hashes, and datetimes', () => {
    const result = TranslationResponseSchema.safeParse(verboseGrowth);
    if (!result.success) return;
    const sys = result.data.audit!.system;
    expect(sys.ptm_version).toBeTypeOf('string');
    expect(sys.combase_model_table_hash).toBeTypeOf('string');
    expect(sys.rag_store_hash).toBeTypeOf('string');
    expect(sys.rag_ingested_at).toBeTypeOf('string');
    expect(sys.source_csv_audit_date).toBeTypeOf('string');
  });

  it('non-verbose response parses without audit block (backward compat)', () => {
    const result = TranslationResponseSchema.safeParse(singleStepGrowth);
    if (!result.success) return;
    expect(result.data.audit).toBeUndefined();
  });
});

describe('TranslationResponseSchema — inferred growth (chicken overnight)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    expect(result.success).toBe(true);
  });

  it('user_inferred fields have rule_match extraction with matched_pattern and conservative', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    const tempField = result.data.audit!.field_audit['temperature_celsius'];
    expect(tempField?.source).toBe('user_inferred');
    expect(tempField?.extraction?.method).toBe('rule_match');
    expect(tempField?.extraction?.matched_pattern).toBe('counter');
    expect(tempField?.extraction?.conservative).toBe(true);
    expect(tempField?.extraction?.notes).toBeTypeOf('string');
    expect(tempField?.extraction?.raw_match).toBeNull();
    expect(tempField?.extraction?.similarity).toBeNull();
    expect(tempField?.extraction?.canonical_phrase).toBeNull();
    expect(tempField?.standardization).toBeNull();
    expect(tempField?.retrieval).toBeNull();
  });

  it('duration_minutes has rule_match extraction with conservative: false', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    const durationField = result.data.audit!.field_audit['duration_minutes'];
    expect(durationField?.extraction?.method).toBe('rule_match');
    expect(durationField?.extraction?.matched_pattern).toBe('overnight');
    expect(durationField?.extraction?.conservative).toBe(false);
  });

  it('provenance has user_inferred entries with interpretation notes', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    const tempProv = result.data.provenance.find((p) => p.field === 'temperature_celsius');
    expect(tempProv?.source).toBe('user_inferred');
    expect(tempProv?.notes).toContain('Interpreted as');
  });

  it('ph has rag_retrieval extraction with parsed_range but null standardization', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    const phField = result.data.audit!.field_audit['ph'];
    expect(phField?.source).toBe('rag_retrieval');
    expect(phField?.extraction?.parsed_range).toEqual([6.2, 6.4]);
    expect(phField?.standardization).toBeNull();
  });

  it('defaults_imputed contains one structured entry for water_activity', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    const items = result.data.audit!.audit.defaults_imputed;
    expect(items).toHaveLength(1);
    expect(items[0]?.field_name).toBe('water_activity');
    expect(items[0]?.default_value).toBe(0.99);
  });

  it('water_activity is absent from field_audit (defaulted fields are not grounded)', () => {
    const result = TranslationResponseSchema.safeParse(inferredGrowth);
    if (!result.success) return;
    expect(result.data.audit!.field_audit['water_activity']).toBeUndefined();
  });
});

describe('TranslationResponseSchema — verbose defaults (zarblax, two defaults_imputed entries)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(verboseDefaults);
    expect(result.success).toBe(true);
  });

  it('defaults_imputed contains two structured DefaultImputedInfo objects', () => {
    const result = TranslationResponseSchema.safeParse(verboseDefaults);
    if (!result.success) return;
    const items = result.data.audit!.audit.defaults_imputed;
    expect(items).toHaveLength(2);
    expect(items[0]?.field_name).toBe('ph');
    expect(items[0]?.default_value).toBe(7);
    expect(items[0]?.reason).toBeTypeOf('string');
    expect(items[1]?.field_name).toBe('water_activity');
    expect(items[1]?.default_value).toBe(0.99);
  });

  it('default_value union accepts both number and string', () => {
    const result = TranslationResponseSchema.safeParse(verboseDefaults);
    if (!result.success) return;
    const items = result.data.audit!.audit.defaults_imputed;
    // Both ph and water_activity defaults are numbers in this fixture
    items.forEach((item) => expect(typeof item.default_value).toMatch(/number|string/));
  });

  it('range_clamps and warnings are truly empty arrays', () => {
    const result = TranslationResponseSchema.safeParse(verboseDefaults);
    if (!result.success) return;
    const cats = result.data.audit!.audit;
    expect(cats.range_clamps).toEqual([]);
    expect(cats.warnings).toEqual([]);
  });
});

describe('TranslationResponseSchema — embedding fallback (bread in hot car)', () => {
  it('parses successfully', () => {
    const result = TranslationResponseSchema.safeParse(embeddingFallback);
    expect(result.success).toBe(true);
  });

  it('temperature_celsius has embedding_fallback extraction with canonical_phrase and similarity', () => {
    const result = TranslationResponseSchema.safeParse(embeddingFallback);
    if (!result.success) return;
    const tempField = result.data.audit!.field_audit['temperature_celsius'];
    expect(tempField?.source).toBe('user_inferred');
    expect(tempField?.extraction?.method).toBe('embedding_fallback');
    expect(tempField?.extraction?.canonical_phrase).toBe('warm vehicle storage');
    expect(tempField?.extraction?.similarity).toBeCloseTo(0.84, 2);
    expect(tempField?.extraction?.conservative).toBe(true);
    expect(tempField?.extraction?.notes).toContain('0.84');
    // rule_match-only fields are absent/null
    expect(tempField?.extraction?.matched_pattern).toBeNull();
    expect(tempField?.extraction?.raw_match).toBeNull();
  });

  it('rag_retrieval fields have regex+llm extraction without rule_match fields', () => {
    const result = TranslationResponseSchema.safeParse(embeddingFallback);
    if (!result.success) return;
    const phField = result.data.audit!.field_audit['ph'];
    expect(phField?.source).toBe('rag_retrieval');
    expect(phField?.extraction?.method).toBe('regex+llm');
    expect(phField?.extraction?.matched_pattern).toBeNull();
    expect(phField?.extraction?.canonical_phrase).toBeNull();
    expect(phField?.extraction?.similarity).toBeNull();
    expect(phField?.extraction?.conservative).toBeNull();
  });

  it('rag_retrieval ph field has standardization block with range_bound_selection', () => {
    const result = TranslationResponseSchema.safeParse(embeddingFallback);
    if (!result.success) return;
    const phField = result.data.audit!.field_audit['ph'];
    expect(phField?.standardization?.rule).toBe('range_bound_selection');
    expect(phField?.standardization?.direction).toBe('upper');
    expect(phField?.standardization?.after_value).toBe(6.2);
  });
});
