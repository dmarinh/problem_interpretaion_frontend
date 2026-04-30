import { describe, it, expect } from 'vitest';
import { derivePipelineStatus } from '../pipelineStrip';
import type { TranslationResponse } from '../../api/types';
import verboseGrowth from '../../api/__fixtures__/verbose-growth.json';
import { TranslationResponseSchema } from '../../api/schema';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFixture(raw: unknown): TranslationResponse {
  const result = TranslationResponseSchema.safeParse(raw);
  if (!result.success) throw new Error('fixture parse failed: ' + JSON.stringify(result.error));
  return result.data as TranslationResponse;
}

// Minimal valid prediction block shared by synthetic fixtures.
const BASE_PREDICTION = {
  organism: 'SALMONELLA',
  model_type: 'growth',
  engine: 'combase_local',
  temperature_celsius: 22,
  duration_minutes: 240,
  ph: 6.5,
  water_activity: 0.97,
  mu_max: 0.3,
  doubling_time_hours: 2.3,
  total_log_increase: 0.46,
  is_multi_step: false,
  steps: [{ step_order: 1, temperature_celsius: 22, duration_minutes: 240 }],
  step_predictions: [{ step_order: 1, temperature_celsius: 22, duration_minutes: 240, mu_max: 0.3, log_increase: 0.46 }],
  growth_description: 'Moderate growth',
};

const BASE_AUDIT_SYSTEM = {
  ptm_version: 'test',
  combase_model_table_hash: null,
  rag_store_hash: null,
  rag_ingested_at: null,
  source_csv_audit_date: null,
};

const BASE_COMBASE_MODEL = {
  organism: 'SALMONELLA',
  model_type: 'growth',
  model_id: 1,
  selection_reason: 'test',
  valid_ranges: { temperature_celsius: [7, 30] as [number, number] },
  coefficients_str: '0;0;0',
};

// Empty audit categories — no real events.
// Backend now emits truly empty arrays; no "(none applied)" sentinel.
// defaults_imputed is a structured list; range_clamps and warnings are string lists.
const CLEAN_CATS = {
  range_clamps: [] as string[],
  defaults_imputed: [] as { field_name: string; default_value: number | string; reason: string }[],
  warnings: [] as string[],
};

// ── Fixture (a) — bread query (verbose-growth.json) ──────────────────────────

describe('derivePipelineStatus — fixture (a): bread query', () => {
  const data = parseFixture(verboseGrowth);

  it('extractionCount = 5 (all five provenance entries)', () => {
    expect(derivePipelineStatus(data).extractionCount).toBe(5);
  });

  it('groundingCount = 2 (ph and water_activity are rag_retrieval)', () => {
    expect(derivePipelineStatus(data).groundingCount).toBe(2);
  });

  it('standardizationCount = 2 (ph and water_activity have populated standardization blocks)', () => {
    expect(derivePipelineStatus(data).standardizationCount).toBe(2);
  });

  it('no warning markers (all audit categories are sentinel-only)', () => {
    const s = derivePipelineStatus(data);
    expect(s.groundingWarning).toBe(false);
    expect(s.standardizationWarning).toBe(false);
    expect(s.executionWarning).toBe(false);
  });
});

// ── Fixture (b) — synthetic: one range-narrowed value + range_clamps + engine warning ──
// Expected: counts (5, 3, 1), ⚠ on Standardization and Execution.

describe('derivePipelineStatus — fixture (b): one standardization block + warnings', () => {
  const data: TranslationResponse = {
    success: true,
    session_id: 'b',
    status: 'completed',
    created_at: '2026-01-01T00:00:00',
    completed_at: '2026-01-01T00:00:01',
    original_query: 'test',
    error: null,
    prediction: { ...BASE_PREDICTION },
    provenance: [
      { field: 'organism',            value: 'N/A', source: 'user_explicit',        notes: null },
      { field: 'temperature_celsius', value: 'N/A', source: 'user_explicit',        notes: null },
      { field: 'ph',                  value: 'N/A', source: 'rag_retrieval',        notes: null },
      { field: 'water_activity',      value: 'N/A', source: 'rag_retrieval',        notes: null },
      { field: 'salt_pct',            value: 'N/A', source: 'conservative_default', notes: null },
    ],
    warnings: [],
    overall_confidence: null,
    audit: {
      field_audit: {
        organism:            { source: 'user_explicit',        extraction: null, standardization: null, retrieval: null },
        temperature_celsius: { source: 'user_explicit',        extraction: { method: 'direct', raw_match: null, parsed_range: [20, 25] }, standardization: null, retrieval: null },
        // ph has a populated standardization block → standardizationCount = 1
        ph:                  { source: 'rag_retrieval',        extraction: { method: 'regex', raw_match: '5.0 to 6.2', parsed_range: [5.0, 6.2] }, standardization: { rule: 'range_bound_selection', direction: 'upper', reason: 'Range narrowed to upper bound', before_value: [5.0, 6.2], after_value: 6.2 }, retrieval: null },
        water_activity:      { source: 'rag_retrieval',        extraction: { method: 'regex', raw_match: '0.94 to 0.97', parsed_range: [0.94, 0.97] }, standardization: null, retrieval: null },
        salt_pct:            { source: 'conservative_default', extraction: { method: 'default', raw_match: null, parsed_range: [0, 5] }, standardization: null, retrieval: null },
      },
      combase_model: BASE_COMBASE_MODEL,
      audit: {
        range_clamps: ['Temperature clamped to upper bound 30°C', 'pH clamped to lower bound 4.9'],
        defaults_imputed: [] as { field_name: string; default_value: number | string; reason: string }[],
        warnings: ['Mu_max near boundary — interpret with caution'],
      },
      system: BASE_AUDIT_SYSTEM,
    },
  };

  it('extractionCount = 5', () => {
    expect(derivePipelineStatus(data).extractionCount).toBe(5);
  });

  it('groundingCount = 3 (ph, water_activity, salt_pct)', () => {
    expect(derivePipelineStatus(data).groundingCount).toBe(3);
  });

  it('standardizationCount = 1 (only ph has a populated standardization block)', () => {
    expect(derivePipelineStatus(data).standardizationCount).toBe(1);
  });

  it('groundingWarning = false (no defaults_imputed)', () => {
    expect(derivePipelineStatus(data).groundingWarning).toBe(false);
  });

  it('standardizationWarning = true (two range_clamps)', () => {
    expect(derivePipelineStatus(data).standardizationWarning).toBe(true);
  });

  it('executionWarning = true (one engine warning)', () => {
    expect(derivePipelineStatus(data).executionWarning).toBe(true);
  });
});

// ── Fixture (c) — synthetic: no standardization events + one default imputed ──
// Expected: counts (5, 2, 0), ⚠ on Grounding only.
// Also confirms that derivePipelineStatus reads from the structured DefaultImputed
// list (non-empty array = warning) rather than the old string-sentinel form.

describe('derivePipelineStatus — fixture (c): default imputed', () => {
  const data: TranslationResponse = {
    success: true,
    session_id: 'c',
    status: 'completed',
    created_at: '2026-01-01T00:00:00',
    completed_at: '2026-01-01T00:00:01',
    original_query: 'test',
    error: null,
    prediction: { ...BASE_PREDICTION },
    provenance: [
      { field: 'organism',            value: 'N/A', source: 'user_explicit', notes: null },
      { field: 'temperature_celsius', value: 'N/A', source: 'user_explicit', notes: null },
      { field: 'duration_minutes',    value: 'N/A', source: 'user_explicit', notes: null },
      { field: 'ph',                  value: 'N/A', source: 'rag_retrieval', notes: null },
      { field: 'water_activity',      value: 'N/A', source: 'rag_retrieval', notes: null },
    ],
    warnings: [],
    overall_confidence: null,
    audit: {
      field_audit: {
        organism:            { source: 'user_explicit', extraction: null, standardization: null, retrieval: null },
        temperature_celsius: { source: 'user_explicit', extraction: null, standardization: null, retrieval: null },
        duration_minutes:    { source: 'user_explicit', extraction: null, standardization: null, retrieval: null },
        ph:                  { source: 'rag_retrieval', extraction: { method: 'regex', raw_match: '5.0 to 6.2', parsed_range: [5.0, 6.2] }, standardization: null, retrieval: null },
        water_activity:      { source: 'rag_retrieval', extraction: { method: 'regex', raw_match: '0.94 to 0.97', parsed_range: [0.94, 0.97] }, standardization: null, retrieval: null },
      },
      combase_model: BASE_COMBASE_MODEL,
      audit: {
        ...CLEAN_CATS,
        defaults_imputed: [
          { field_name: 'ph', default_value: 6.5, reason: 'No pH specified — using conservative neutral default' },
        ],
      },
      system: BASE_AUDIT_SYSTEM,
    },
  };

  it('extractionCount = 5', () => {
    expect(derivePipelineStatus(data).extractionCount).toBe(5);
  });

  it('groundingCount = 2', () => {
    expect(derivePipelineStatus(data).groundingCount).toBe(2);
  });

  it('standardizationCount = 0 (parsed_range present but no standardization blocks)', () => {
    expect(derivePipelineStatus(data).standardizationCount).toBeNull();
  });

  it('groundingWarning = true (one default imputed)', () => {
    expect(derivePipelineStatus(data).groundingWarning).toBe(true);
  });

  it('standardizationWarning = false', () => {
    expect(derivePipelineStatus(data).standardizationWarning).toBe(false);
  });

  it('executionWarning = false', () => {
    expect(derivePipelineStatus(data).executionWarning).toBe(false);
  });
});
