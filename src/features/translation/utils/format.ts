// Display-layer formatting rules per §4.5.
// All formatters live here so the rules are auditable in one place.

const ENGINE_MAP: Record<string, string> = {
  combase_local: 'ComBase (local)',
}

const SOURCE_MAP: Record<string, string> = {
  rag_retrieval: 'Retrieved (RAG)',
  user_explicit: 'From your query',
  user_inferred: 'Inferred',
  default: 'Default',
}

const WARNING_TYPE_LABEL_MAP: Record<string, string> = {
  bias_correction: 'Correction applied',
  range_clamp: 'Value clamped',
  warning: 'Note',
}

// Explicit field names for the provenance table.
const FIELD_NAME_MAP: Record<string, string> = {
  organism: 'Organism',
  model_type: 'Model type',
  temperature_celsius: 'Temperature',
  duration_minutes: 'Duration',
  ph: 'pH',
  water_activity: 'Water activity',
  mu_max: 'μ_max',
  doubling_time_hours: 'Doubling time',
}

/** "STAPHYLOCOCCUS_AUREUS" → "Staphylococcus aureus" */
export function formatOrganism(raw: string): string {
  const words = raw.toLowerCase().split('_')
  if (words.length === 0 || words[0] === undefined) return raw
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ')
}

/** "thermal_inactivation" → "Thermal inactivation" */
export function formatModelType(raw: string): string {
  const lower = raw.replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** "combase_local" → "ComBase (local)" — unknown values passed through */
export function formatEngine(raw: string): string {
  return ENGINE_MAP[raw] ?? raw
}

/** "rag_retrieval" → "Retrieved (RAG)" — unknown values passed through */
export function formatSource(raw: string): string {
  return SOURCE_MAP[raw] ?? raw
}

/** "bias_correction" → "Correction applied" — unknown values passed through */
export function formatWarningTypeLabel(raw: string): string {
  return WARNING_TYPE_LABEL_MAP[raw] ?? raw
}

/** 0.6551... → "66%". Clamps to [0, 1] before rounding. */
export function formatConfidence(value: number): string {
  const clamped = Math.min(1, Math.max(0, value))
  return `${Math.round(clamped * 100)}%`
}

/** 1.2344... → "1.23 /h" */
export function formatMuMax(value: number): string {
  return `${value.toFixed(2)} /h`
}

/**
 * Doubling time (hours) → "34 min" (< 1 h) or "1.2 h" (≥ 1 h).
 * null (thermal inactivation, no doubling time) → em-dash.
 */
export function formatDoublingTime(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours.toFixed(1)} h`
}

/** 0.6907... → "+0.69 log₁₀" (signed, 2 decimal places). */
export function formatLogIncrease(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)} log₁₀`
}

/**
 * Duration in minutes → "45 min" (< 60 min) or "3 h 45 min" (≥ 60 min).
 * Whole hours omit the "0 min" suffix.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

/**
 * Temperature in °C → "28 °C" (integer) or "27.5 °C" (non-integer).
 * No rounding — shows the actual precision of the value.
 */
export function formatTemperature(celsius: number): string {
  const formatted = Number.isInteger(celsius) ? celsius.toString() : celsius.toFixed(1)
  return `${formatted} °C`
}

/**
 * Backend field name → display label.
 * Known fields use explicit labels; unknown fields get title-cased, underscores stripped.
 */
export function formatFieldName(raw: string): string {
  const known = FIELD_NAME_MAP[raw]
  if (known !== undefined) return known
  const lower = raw.replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}
