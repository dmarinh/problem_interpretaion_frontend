import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env before importing client (client imports env at module level)
vi.mock('@/shared/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000' },
}));

const VALID_RESPONSE = {
  success: true,
  session_id: 'test-session',
  status: 'completed',
  created_at: '2026-04-22T10:00:00Z',
  completed_at: '2026-04-22T10:00:05Z',
  original_query: 'test query',
  prediction: {
    organism: 'SALMONELLA',
    model_type: 'growth',
    engine: 'combase_local',
    temperature_celsius: 20.0,
    duration_minutes: 120,
    ph: 6.5,
    water_activity: 0.99,
    mu_max: 0.41,
    doubling_time_hours: 1.69,
    total_log_increase: 0.69,
    is_multi_step: false,
    steps: [{ step_order: 1, temperature_celsius: 20.0, duration_minutes: 120 }],
    step_predictions: [
      { step_order: 1, temperature_celsius: 20.0, duration_minutes: 120, mu_max: 0.41, log_increase: 0.69 },
    ],
    growth_description: 'Moderate growth.',
  },
  provenance: [],
  warnings: [],
  overall_confidence: 0.8,
  error: null,
};

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
}

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('translateApi', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed data on a valid success response', async () => {
    mockFetch(makeResponse(VALID_RESPONSE));
    const { translateApi } = await import('../client');

    const result = await translateApi('test query');
    expect(result.session_id).toBe('test-session');
    expect(result.prediction?.organism).toBe('SALMONELLA');
  });

  it('throws { kind: "transport" } when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    const { translateApi } = await import('../client');

    await expect(translateApi('q')).rejects.toMatchObject({ kind: 'transport' });
  });

  it('throws { kind: "transport" } on a non-2xx HTTP response', async () => {
    mockFetch(makeResponse({ detail: 'Internal server error' }, 500));
    const { translateApi } = await import('../client');

    await expect(translateApi('q')).rejects.toMatchObject({ kind: 'transport' });
  });

  it('throws { kind: "validation" } when response fails Zod parse', async () => {
    mockFetch(makeResponse({ totally: 'wrong shape' }));
    const { translateApi } = await import('../client');

    await expect(translateApi('q')).rejects.toMatchObject({ kind: 'validation' });
  });

  it('throws { kind: "application" } when success === false', async () => {
    const appError = { ...VALID_RESPONSE, success: false, error: 'Model not found for organism.' };
    mockFetch(makeResponse(appError));
    const { translateApi } = await import('../client');

    await expect(translateApi('q')).rejects.toMatchObject({
      kind: 'application',
      message: 'Model not found for organism.',
    });
  });

  it('throws { kind: "degenerate" } when success === true but prediction === null', async () => {
    const degenerate = { ...VALID_RESPONSE, prediction: null };
    mockFetch(makeResponse(degenerate));
    const { translateApi } = await import('../client');

    await expect(translateApi('q')).rejects.toMatchObject({ kind: 'degenerate' });
  });
});
