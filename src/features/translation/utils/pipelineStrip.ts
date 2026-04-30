// Pure derivation for the PipelineStrip component (§8.5.4).
// Counts and warning markers are computed here so the component stays presentational
// and the logic is independently unit-testable.

import type { TranslationResponse } from '../api/types'

export type PipelineStatus = {
  extractionCount: number | null       // null = don't render the count
  groundingCount: number | null
  standardizationCount: number | null
  // Phase-attributed warning markers (§8.5.4 warning marker rules)
  groundingWarning: boolean            // defaults_imputed non-empty
  standardizationWarning: boolean      // range_clamps non-empty
  executionWarning: boolean            // engine warnings non-empty
}

/**
 * Derives pipeline counts and warning markers from a successful response.
 *
 * Phase → category mapping (canonical, mirrors the strip and C5 Safety Flags panel):
 *   Grounding        ← defaults_imputed (structured list; non-empty = warning)
 *   Standardization  ← range_clamps (string list; non-empty = warning)
 *   Execution        ← warnings (string list; non-empty = warning)
 *
 * Empty arrays are honest empty — no sentinel filtering needed.
 */
export function derivePipelineStatus(data: TranslationResponse): PipelineStatus {
  const { provenance, audit } = data

  // Extraction: total distinct fields that entered the system.
  const extractionCount = provenance.length > 0 ? provenance.length : null

  // Grounding: fields that required retrieval or a conservative system default.
  const groundingRaw = provenance.filter(
    (p) => p.source === 'rag_retrieval' || p.source === 'conservative_default',
  ).length

  // Standardization: fields where the backend's StandardizationService resolved
  // a bound selection — indicated by a populated standardization block.
  let standardizationRaw = 0
  if (audit != null) {
    standardizationRaw = Object.values(audit.field_audit).filter(
      (fa) => fa != null && fa.standardization != null,
    ).length
  }

  // Warning markers — verbose audit categories take precedence; fall back to
  // flat warnings[] when the audit block is absent (non-verbose responses).
  let groundingWarning = false
  let standardizationWarning = false
  let executionWarning = false

  if (audit != null) {
    const cats = audit.audit
    groundingWarning = cats.defaults_imputed.length > 0
    standardizationWarning = cats.range_clamps.length > 0
    executionWarning = cats.warnings.length > 0
  } else {
    groundingWarning = data.warnings.some((w) => w.type === 'default_imputed')
    standardizationWarning = data.warnings.some((w) => w.type === 'range_clamp')
    // Any warning type not attributed to Grounding or Standardization is Execution.
    executionWarning = data.warnings.some(
      (w) => w.type !== 'range_clamp' && w.type !== 'default_imputed',
    )
  }

  return {
    extractionCount,
    groundingCount: groundingRaw > 0 ? groundingRaw : null,
    standardizationCount: standardizationRaw > 0 ? standardizationRaw : null,
    groundingWarning,
    standardizationWarning,
    executionWarning,
  }
}
