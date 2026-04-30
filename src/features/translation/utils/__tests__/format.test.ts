import { describe, it, expect } from 'vitest'
import {
  formatOrganism,
  formatModelType,
  formatEngine,
  formatSource,
  formatWarningTypeLabel,
  formatConfidence,
  formatMuMax,
  formatDoublingTime,
  formatLogIncrease,
  formatDuration,
  formatTemperature,
  formatFieldName,
  formatEmbeddingScore,
  formatAuditDatetime,
  formatHash,
  formatValidRange,
  formatCoefficientsPreview,
  truncateRetrievedText,
  formatImputedValue,
  formatStdLabel,
} from '../format'

describe('formatOrganism', () => {
  it('formats two-word binomial', () => {
    expect(formatOrganism('STAPHYLOCOCCUS_AUREUS')).toBe('Staphylococcus aureus')
  })
  it('formats single word', () => {
    expect(formatOrganism('SALMONELLA')).toBe('Salmonella')
  })
  it('formats three-word name', () => {
    expect(formatOrganism('LISTERIA_MONOCYTOGENES')).toBe('Listeria monocytogenes')
  })
  it('passes through unknown values as-is (lowercased + title case)', () => {
    expect(formatOrganism('ESCHERICHIA_COLI')).toBe('Escherichia coli')
  })
})

describe('formatModelType', () => {
  it('formats growth', () => expect(formatModelType('growth')).toBe('Growth'))
  it('formats thermal_inactivation', () => {
    expect(formatModelType('thermal_inactivation')).toBe('Thermal inactivation')
  })
  it('passes through unknown, sentence-casing', () => {
    expect(formatModelType('some_other_type')).toBe('Some other type')
  })
})

describe('formatEngine', () => {
  it('maps known engine', () => expect(formatEngine('combase_local')).toBe('ComBase (local)'))
  it('passes through unknown', () => expect(formatEngine('unknown_engine')).toBe('unknown_engine'))
})

describe('formatSource', () => {
  it('maps rag_retrieval', () => expect(formatSource('rag_retrieval')).toBe('Retrieved (RAG)'))
  it('maps user_explicit', () => expect(formatSource('user_explicit')).toBe('From your query'))
  it('maps user_inferred', () => expect(formatSource('user_inferred')).toBe('Inferred from rule'))
  it('maps default', () => expect(formatSource('default')).toBe('Default'))
  it('maps conservative_default', () => expect(formatSource('conservative_default')).toBe('System default'))
  it('passes through unknown', () => expect(formatSource('unknown')).toBe('unknown'))
})

describe('formatWarningTypeLabel', () => {
  it('maps bias_correction', () => {
    expect(formatWarningTypeLabel('bias_correction')).toBe('Correction applied')
  })
  it('maps range_clamp', () => {
    expect(formatWarningTypeLabel('range_clamp')).toBe('Value clamped')
  })
  it('maps warning', () => {
    expect(formatWarningTypeLabel('warning')).toBe('Note')
  })
  it('passes through unknown', () => {
    expect(formatWarningTypeLabel('unknown_type')).toBe('unknown_type')
  })
})

describe('formatConfidence', () => {
  it('rounds to nearest percent', () => {
    expect(formatConfidence(0.6551502585)).toBe('66%')
  })
  it('handles exact 100%', () => {
    expect(formatConfidence(1)).toBe('100%')
  })
  it('handles 0%', () => {
    expect(formatConfidence(0)).toBe('0%')
  })
  it('clamps values above 1', () => {
    expect(formatConfidence(1.2)).toBe('100%')
  })
  it('clamps values below 0', () => {
    expect(formatConfidence(-0.1)).toBe('0%')
  })
})

describe('formatMuMax', () => {
  it('formats to 2 decimal places with unit', () => {
    expect(formatMuMax(1.2344246610)).toBe('1.23 /h')
  })
  it('formats negative value for inactivation', () => {
    expect(formatMuMax(-11915.617337708327)).toBe('-11915.62 /h')
  })
})

describe('formatDoublingTime', () => {
  it('returns em-dash for null (inactivation)', () => {
    expect(formatDoublingTime(null)).toBe('—')
  })
  it('converts < 1h to minutes', () => {
    expect(formatDoublingTime(0.5615143657)).toBe('34 min')
  })
  it('formats >= 1h to hours with 1 decimal', () => {
    expect(formatDoublingTime(1.2)).toBe('1.2 h')
  })
  it('formats exactly 1h', () => {
    expect(formatDoublingTime(1)).toBe('1.0 h')
  })
})

describe('formatLogIncrease', () => {
  it('prefixes positive with +', () => {
    expect(formatLogIncrease(0.6907397610)).toBe('+0.69 log₁₀')
  })
  it('leaves negative as-is', () => {
    expect(formatLogIncrease(-0.5)).toBe('-0.50 log₁₀')
  })
  it('prefixes zero with +', () => {
    expect(formatLogIncrease(0)).toBe('+0.00 log₁₀')
  })
})

describe('formatDuration', () => {
  it('formats < 60 min', () => expect(formatDuration(45)).toBe('45 min'))
  it('formats whole hours', () => expect(formatDuration(120)).toBe('2 h'))
  it('formats hours and minutes', () => expect(formatDuration(225)).toBe('3 h 45 min'))
  it('formats exactly 60 min', () => expect(formatDuration(60)).toBe('1 h'))
  it('rounds sub-minute values', () => expect(formatDuration(45.6)).toBe('46 min'))
})

describe('formatTemperature', () => {
  it('formats integer celsius', () => expect(formatTemperature(28)).toBe('28 °C'))
  it('formats non-integer celsius', () => expect(formatTemperature(27.5)).toBe('27.5 °C'))
  it('formats negative temperature', () => expect(formatTemperature(-4)).toBe('-4 °C'))
})

describe('formatFieldName', () => {
  it('maps known fields', () => {
    expect(formatFieldName('ph')).toBe('pH')
    expect(formatFieldName('water_activity')).toBe('Water activity')
    expect(formatFieldName('temperature_celsius')).toBe('Temperature')
  })
  it('title-cases and strips underscores for unknown fields', () => {
    expect(formatFieldName('some_unknown_field')).toBe('Some unknown field')
  })
  it('strips _step_N suffix before lookup', () => {
    expect(formatFieldName('temperature_celsius_step_1')).toBe('Temperature')
    expect(formatFieldName('ph_step_2')).toBe('pH')
    expect(formatFieldName('water_activity_step_3')).toBe('Water activity')
  })
  it('strips step suffix from unknown fields too', () => {
    expect(formatFieldName('some_field_step_1')).toBe('Some field')
  })
})

describe('formatEmbeddingScore', () => {
  it('formats to 3 decimal places', () => {
    expect(formatEmbeddingScore(0.793)).toBe('0.793')
  })
  it('pads trailing zeros', () => {
    expect(formatEmbeddingScore(0.8)).toBe('0.800')
  })
  it('formats high score', () => {
    expect(formatEmbeddingScore(0.9999)).toBe('1.000')
  })
  it('formats low score', () => {
    expect(formatEmbeddingScore(0.1)).toBe('0.100')
  })
})

describe('formatAuditDatetime', () => {
  it('formats ISO 8601 string to "YYYY-MM-DD HH:MM UTC"', () => {
    expect(formatAuditDatetime('2026-04-20T14:00:00.000000')).toBe('2026-04-20 14:00 UTC')
  })
  it('handles ISO string with Z suffix', () => {
    expect(formatAuditDatetime('2026-04-22T16:28:00Z')).toBe('2026-04-22 16:28 UTC')
  })
  it('returns em-dash for null', () => {
    expect(formatAuditDatetime(null)).toBe('—')
  })
  it('passes through non-ISO strings unchanged', () => {
    expect(formatAuditDatetime('not-a-date')).toBe('not-a-date')
  })
})

describe('formatHash', () => {
  it('truncates long hash to first 8 chars + ellipsis', () => {
    expect(formatHash('a1b2c3d4e5f6a1b2c3d4')).toBe('a1b2c3d4…')
  })
  it('returns hash as-is when 8 chars or fewer', () => {
    expect(formatHash('a1b2c3d4')).toBe('a1b2c3d4')
    expect(formatHash('abc')).toBe('abc')
  })
  it('returns em-dash for null', () => {
    expect(formatHash(null)).toBe('—')
  })
})

describe('formatValidRange', () => {
  it('formats min and max with 1 decimal place and en-dash', () => {
    expect(formatValidRange(10, 48)).toBe('10.0–48.0')
  })
  it('formats fractional values', () => {
    expect(formatValidRange(4.5, 8.5)).toBe('4.5–8.5')
  })
  it('formats water activity range', () => {
    expect(formatValidRange(0.93, 0.995)).toBe('0.9–1.0')
  })
})

describe('formatCoefficientsPreview', () => {
  it('returns string unchanged when 80 chars or fewer', () => {
    const short = 'mu_opt=1.23;T_min=4.0'
    expect(formatCoefficientsPreview(short)).toBe(short)
  })
  it('truncates long string to 80 chars + ellipsis', () => {
    const long = 'mu_opt=1.23;T_min=4.0;T_opt=37.0;T_max=50.0;pH_min=4.3;pH_opt=7.0;pH_max=9.3;aw_min=0.928;extra'
    const result = formatCoefficientsPreview(long)
    expect(result).toHaveLength(81) // 80 + ellipsis char
    expect(result.endsWith('…')).toBe(true)
    expect(result.slice(0, 80)).toBe(long.slice(0, 80))
  })
  it('handles exactly 80 char string without truncation', () => {
    const exactly80 = 'a'.repeat(80)
    expect(formatCoefficientsPreview(exactly80)).toBe(exactly80)
  })
})

describe('truncateRetrievedText', () => {
  it('returns text unchanged when 200 chars or fewer', () => {
    const short = 'White bread has a pH range of 5.0 to 6.2.'
    expect(truncateRetrievedText(short)).toBe(short)
  })
  it('truncates long text to 200 chars + ellipsis', () => {
    const long = 'a'.repeat(300)
    const result = truncateRetrievedText(long)
    expect(result).toHaveLength(201) // 200 + ellipsis char
    expect(result.endsWith('…')).toBe(true)
  })
  it('handles exactly 200 char text without truncation', () => {
    const exactly200 = 'b'.repeat(200)
    expect(truncateRetrievedText(exactly200)).toBe(exactly200)
  })
})

describe('formatStdLabel', () => {
  it('range_bound_selection upper → Range bound (upper)', () => {
    expect(formatStdLabel('range_bound_selection', 'upper')).toBe('Range bound (upper)')
  })
  it('range_bound_selection lower → Range bound (lower)', () => {
    expect(formatStdLabel('range_bound_selection', 'lower')).toBe('Range bound (lower)')
  })
  it('range_bound_selection with no direction → Range bound', () => {
    expect(formatStdLabel('range_bound_selection', undefined)).toBe('Range bound')
  })
  it('unknown rule → em-dash', () => {
    expect(formatStdLabel('some_other_rule', undefined)).toBe('—')
  })
  it('undefined rule (no standardization block) → em-dash', () => {
    expect(formatStdLabel(undefined, undefined)).toBe('—')
  })
})

describe('formatImputedValue', () => {
  it('formats a numeric pH value as plain string', () => {
    expect(formatImputedValue('ph', 7)).toBe('7')
  })
  it('formats a numeric water_activity value as plain string', () => {
    expect(formatImputedValue('water_activity', 0.99)).toBe('0.99')
  })
  it('formats temperature_celsius with °C unit', () => {
    expect(formatImputedValue('temperature_celsius', 25)).toBe('25 °C')
  })
  it('formats a string organism value via formatOrganism', () => {
    expect(formatImputedValue('organism', 'SALMONELLA')).toBe('Salmonella')
  })
  it('formats an unknown string value as-is (via formatOrganism)', () => {
    expect(formatImputedValue('some_field', 'BACILLUS_CEREUS')).toBe('Bacillus cereus')
  })
})
