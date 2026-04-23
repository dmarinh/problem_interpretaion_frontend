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
  it('maps user_inferred', () => expect(formatSource('user_inferred')).toBe('Inferred'))
  it('maps default', () => expect(formatSource('default')).toBe('Default'))
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
})
