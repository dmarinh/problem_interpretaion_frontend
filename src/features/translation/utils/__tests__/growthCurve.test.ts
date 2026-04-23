import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { deriveGrowthCurve } from '../growthCurve'
import type { StepPrediction } from '../../api/types'

// suppress dev-mode assertion warnings in tests that intentionally trigger them
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.restoreAllMocks()
})

const SINGLE_STEP: StepPrediction[] = [
  { step_order: 1, temperature_celsius: 15, duration_minutes: 45, mu_max: 0.22092526545879357, log_increase: 0.07195996777632384 },
]

const MULTI_STEP: StepPrediction[] = [
  { step_order: 1, temperature_celsius: 22, duration_minutes: 120, mu_max: 0.6987719791865064, log_increase: 0.6069456293386273 },
  { step_order: 2, temperature_celsius: 5, duration_minutes: 360, mu_max: 0.019574436974432778, log_increase: 0.05100641978615483 },
]

const INACTIVATION_STEP: StepPrediction[] = [
  { step_order: 1, temperature_celsius: 68, duration_minutes: 8, mu_max: -11915.617337708327, log_increase: -1588.7489783611102 },
]

describe('deriveGrowthCurve — single step', () => {
  it('starts at (0, 0)', () => {
    const points = deriveGrowthCurve(SINGLE_STEP, SINGLE_STEP[0]!.log_increase)
    expect(points[0]).toEqual({ t: 0, logChange: 0 })
  })

  it('produces 51 points (1 start + 50 per step)', () => {
    const points = deriveGrowthCurve(SINGLE_STEP, SINGLE_STEP[0]!.log_increase)
    expect(points).toHaveLength(51)
  })

  it('final t equals total duration', () => {
    const points = deriveGrowthCurve(SINGLE_STEP, SINGLE_STEP[0]!.log_increase)
    expect(points[points.length - 1]!.t).toBeCloseTo(45, 5)
  })

  it('total log change matches prediction.total_log_increase within 1e-6 (growth)', () => {
    const totalLogIncrease = 0.07195996777632384
    const points = deriveGrowthCurve(SINGLE_STEP, totalLogIncrease)
    const finalLog = points[points.length - 1]!.logChange
    expect(Math.abs(finalLog - totalLogIncrease)).toBeLessThan(1e-6)
  })

  it('is monotonically increasing for positive mu_max', () => {
    const points = deriveGrowthCurve(SINGLE_STEP, SINGLE_STEP[0]!.log_increase)
    for (let i = 1; i < points.length; i++) {
      expect(points[i]!.logChange).toBeGreaterThanOrEqual(points[i - 1]!.logChange)
    }
  })
})

describe('deriveGrowthCurve — multi-step', () => {
  it('produces 101 points (1 start + 50 per step × 2)', () => {
    const total = MULTI_STEP.reduce((s, sp) => s + sp.log_increase, 0)
    const points = deriveGrowthCurve(MULTI_STEP, total)
    expect(points).toHaveLength(101)
  })

  it('final t equals sum of all durations', () => {
    const total = MULTI_STEP.reduce((s, sp) => s + sp.log_increase, 0)
    const points = deriveGrowthCurve(MULTI_STEP, total)
    expect(points[points.length - 1]!.t).toBeCloseTo(480, 5)
  })

  it('total log change matches prediction.total_log_increase within 1e-6', () => {
    const totalLogIncrease = 0.6579520491247821
    const points = deriveGrowthCurve(MULTI_STEP, totalLogIncrease)
    const finalLog = points[points.length - 1]!.logChange
    expect(Math.abs(finalLog - totalLogIncrease)).toBeLessThan(1e-6)
  })

  it('curve is continuous (no resets at step boundary)', () => {
    const total = MULTI_STEP.reduce((s, sp) => s + sp.log_increase, 0)
    const points = deriveGrowthCurve(MULTI_STEP, total)
    // Point 50 (end of step 1) and point 51 (start of step 2) should be close
    // (step 2 starts where step 1 left off)
    const endOfStep1 = points[50]!.logChange
    const startOfStep2 = points[51]!.logChange
    // step 2's first inner point is a tiny increment above step 1's end
    expect(startOfStep2).toBeGreaterThanOrEqual(endOfStep1)
    expect(startOfStep2 - endOfStep1).toBeLessThan(0.02) // tiny first slice
  })
})

describe('deriveGrowthCurve — thermal inactivation (negative mu_max)', () => {
  it('produces a descending curve', () => {
    const points = deriveGrowthCurve(INACTIVATION_STEP, INACTIVATION_STEP[0]!.log_increase)
    expect(points[0]!.logChange).toBe(0)
    expect(points[points.length - 1]!.logChange).toBeLessThan(0)
  })

  it('fires dev assertion (expected mismatch for thermal inactivation)', () => {
    deriveGrowthCurve(INACTIVATION_STEP, INACTIVATION_STEP[0]!.log_increase)
    // The formula gives a different result than the backend's thermal model
    expect(console.warn).toHaveBeenCalled()
  })
})

describe('deriveGrowthCurve — zero-duration edge case', () => {
  it('handles zero-duration step without crashing', () => {
    const zeroDuration: StepPrediction[] = [
      { step_order: 1, temperature_celsius: 20, duration_minutes: 0, mu_max: 0.5, log_increase: 0 },
    ]
    const points = deriveGrowthCurve(zeroDuration, 0)
    expect(points.length).toBeGreaterThan(0)
    expect(points[0]).toEqual({ t: 0, logChange: 0 })
  })

  it('returns only the start point for empty step predictions', () => {
    const points = deriveGrowthCurve([], 0)
    expect(points).toEqual([{ t: 0, logChange: 0 }])
  })
})
