// Growth curve derivation per §5.9.
// This is a first-order linear approximation — constant μ_max within each step,
// instantaneous transitions. The real ComBase model is Baranyi with lag phase;
// the UI communicates this via the "Simplified visualisation" label.

import type { StepPrediction } from '../api/types'

export type CurvePoint = {
  t: number         // minutes from scenario start
  logChange: number // log₁₀ CFU change relative to t=0
}

// Resolution per step. 50 points gives smooth rendering at demo sizes.
const POINTS_PER_STEP = 50

/**
 * Derives a piecewise log₁₀ growth/inactivation curve from step predictions.
 *
 * Formula: log₁₀_change(t) = mu_max × t_within_step / (ln10 × 60)
 * where t_within_step is minutes, mu_max is 1/h.
 * Dividing by ln10 converts from natural-log rate; dividing by 60 converts h→min.
 *
 * For growth scenarios the derived total equals prediction.total_log_increase.
 * For thermal_inactivation the models differ, so the curve is approximate and
 * the dev assertion fires — expected and covered by the UI caveat label.
 */
export function deriveGrowthCurve(
  stepPredictions: StepPrediction[],
  totalLogIncrease: number,
): CurvePoint[] {
  if (stepPredictions.length === 0) return [{ t: 0, logChange: 0 }]

  const points: CurvePoint[] = [{ t: 0, logChange: 0 }]
  let tOffset = 0    // absolute time for the start of the current step
  let prevLog = 0    // cumulative log change at the end of the previous step

  for (const step of stepPredictions) {
    const { mu_max, duration_minutes } = step

    if (duration_minutes <= 0) {
      // Zero-duration step: anchor a single point, advance nothing.
      points.push({ t: tOffset, logChange: prevLog })
      continue
    }

    for (let i = 1; i <= POINTS_PER_STEP; i++) {
      const tWithinStep = (duration_minutes * i) / POINTS_PER_STEP
      const logWithinStep = (mu_max * tWithinStep) / (Math.LN10 * 60)
      points.push({ t: tOffset + tWithinStep, logChange: prevLog + logWithinStep })
    }

    prevLog += (mu_max * duration_minutes) / (Math.LN10 * 60)
    tOffset += duration_minutes
  }

  if (import.meta.env.DEV) {
    const last = points[points.length - 1]
    const derivedTotal = last?.logChange ?? 0
    const diff = Math.abs(derivedTotal - totalLogIncrease)
    if (diff > 1e-6) {
      console.warn(
        `[growthCurve] Derived total (${derivedTotal.toFixed(6)}) ≠ ` +
          `prediction.total_log_increase (${totalLogIncrease.toFixed(6)}). ` +
          `Diff: ${diff.toExponential(2)}. ` +
          'Expected for thermal_inactivation; not expected for growth scenarios.',
      )
    }
  }

  return points
}
