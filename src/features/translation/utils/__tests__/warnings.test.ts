import { describe, it, expect } from 'vitest'
import { correlateWarnings, buildWarningStepMap } from '../warnings'
import type { WarningItem, Step } from '../../api/types'

const STEPS: Step[] = [
  { step_order: 1, temperature_celsius: 22, duration_minutes: 120 },
  { step_order: 2, temperature_celsius: 5, duration_minutes: 360 },
]

const TEMP_WARNING: WarningItem = {
  type: 'warning',
  message: 'Temperature 5.0°C outside valid range [7.0, 40.0]',
  field: null,
}

const FIELD_WARNING: WarningItem = {
  type: 'bias_correction',
  message: 'No pH specified. Using neutral default which is near-optimal for pathogen growth.',
  field: 'ph',
}

const ANOTHER_GLOBAL: WarningItem = {
  type: 'warning',
  message: 'No pathogen specified. Using Salmonella as conservative default.',
  field: null,
}

describe('correlateWarnings — temperature correlation', () => {
  it('attaches temperature warning to matching step', () => {
    const { global, perStep } = correlateWarnings([TEMP_WARNING], STEPS)
    expect(global).toHaveLength(0)
    expect(perStep.get(2)).toEqual([TEMP_WARNING])
  })

  it('matches within 0.1 °C tolerance', () => {
    const slightlyOff: WarningItem = {
      type: 'warning',
      message: 'Temperature 5.05°C outside valid range [7.0, 40.0]',
      field: null,
    }
    const { perStep } = correlateWarnings([slightlyOff], STEPS)
    expect(perStep.get(2)).toEqual([slightlyOff])
  })

  it('does not match when difference exceeds 0.1 °C', () => {
    const farOff: WarningItem = {
      type: 'warning',
      message: 'Temperature 5.2°C outside valid range [7.0, 40.0]',
      field: null,
    }
    const { global, perStep } = correlateWarnings([farOff], STEPS)
    expect(global).toContain(farOff)
    expect(perStep.size).toBe(0)
  })
})

describe('correlateWarnings — no-match fallback to global', () => {
  it('puts field warnings into global', () => {
    const { global, perStep } = correlateWarnings([FIELD_WARNING], STEPS)
    expect(global).toContain(FIELD_WARNING)
    expect(perStep.size).toBe(0)
  })

  it('puts non-temperature message warnings into global', () => {
    const { global } = correlateWarnings([ANOTHER_GLOBAL], STEPS)
    expect(global).toContain(ANOTHER_GLOBAL)
  })
})

describe('correlateWarnings — multiple warnings', () => {
  it('separates step-correlated and global warnings', () => {
    const warnings = [TEMP_WARNING, FIELD_WARNING, ANOTHER_GLOBAL]
    const { global, perStep } = correlateWarnings(warnings, STEPS)
    expect(perStep.get(2)).toContain(TEMP_WARNING)
    expect(global).toContain(FIELD_WARNING)
    expect(global).toContain(ANOTHER_GLOBAL)
  })
})

describe('correlateWarnings — mixed types', () => {
  it('handles empty warnings array', () => {
    const { global, perStep } = correlateWarnings([], STEPS)
    expect(global).toHaveLength(0)
    expect(perStep.size).toBe(0)
  })

  it('handles empty steps array — all go to global', () => {
    const { global } = correlateWarnings([TEMP_WARNING], [])
    expect(global).toContain(TEMP_WARNING)
  })
})

describe('buildWarningStepMap', () => {
  it('maps each correlated warning to its step order', () => {
    const { perStep } = correlateWarnings([TEMP_WARNING], STEPS)
    const map = buildWarningStepMap(perStep)
    expect(map.get(TEMP_WARNING)).toBe(2)
  })

  it('returns empty map for empty perStep', () => {
    const map = buildWarningStepMap(new Map())
    expect(map.size).toBe(0)
  })
})
