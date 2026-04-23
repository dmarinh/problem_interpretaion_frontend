// Step-scoped warning correlation heuristic per §8.14.
// Warnings that mention a temperature matching a step are attached to that step;
// everything else stays global. Both C2 (step timeline) and C5 (warnings strip)
// consume this result — C2 for the inline indicator, C5 for the "attached to step N" note.

import type { WarningItem, Step } from '../api/types'

export type CorrelatedWarnings = {
  /** Warnings not associated with any specific step. */
  global: WarningItem[]
  /** Step-order → warnings attached to that step. */
  perStep: Map<number, WarningItem[]>
}

// Matches "Temperature 4.0°C" or "Temperature 5.0 °C" in warning messages.
const TEMP_RE = /Temperature\s+([\d.]+)\s*°?C/i

/**
 * Associates each warning with the step whose temperature matches the warning text,
 * within 0.1 °C tolerance. Unmatched warnings go into `global`.
 *
 * Step-correlated warnings appear in both C2 (inline indicator) and C5 (with note).
 * This function determines correlation; each consumer decides what to render.
 */
export function correlateWarnings(warnings: WarningItem[], steps: Step[]): CorrelatedWarnings {
  const perStep = new Map<number, WarningItem[]>()
  const global: WarningItem[] = []

  for (const warning of warnings) {
    const match = TEMP_RE.exec(warning.message)
    if (match?.[1] !== undefined) {
      const extracted = parseFloat(match[1])
      const matched = steps.find((s) => Math.abs(s.temperature_celsius - extracted) < 0.1)
      if (matched !== undefined) {
        const bucket = perStep.get(matched.step_order) ?? []
        bucket.push(warning)
        perStep.set(matched.step_order, bucket)
        continue
      }
    }
    global.push(warning)
  }

  return { global, perStep }
}

/**
 * Returns a Map from each warning to the step order it's attached to,
 * for O(1) lookup when rendering C5 rows.
 */
export function buildWarningStepMap(perStep: Map<number, WarningItem[]>): Map<WarningItem, number> {
  const map = new Map<WarningItem, number>()
  for (const [stepOrder, stepWarnings] of perStep) {
    for (const w of stepWarnings) {
      map.set(w, stepOrder)
    }
  }
  return map
}
