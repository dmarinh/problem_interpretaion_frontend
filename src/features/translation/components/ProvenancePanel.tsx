// C4 — Provenance Panel per §8.9.
// "Where did each number come from?" — source tier, standardisation, retrieval, citations.
//
// Two rendering modes:
//   verbose mode  — when data.audit is present; shows audit.field_audit per-field breakdown
//   fallback mode — when data.audit is absent; shows flat provenance[] (pre-audit compat)

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TranslationResponse, ProvenanceItem, FieldAudit } from '../api/types'
import { strings } from '../data/strings'
import {
  formatFieldName,
  formatOrganism,
  formatTemperature,
  formatDuration,
  formatEmbeddingScore,
  formatStdLabel,
  truncateRetrievedText,
} from '../utils/format'
import {
  PanelChrome,
  SourceBadge,
  NotesWithCitations,
  SubHeading,
  CitationButton,
} from './primitives'

// ── Standardization inline note ──────────────────────────────────────────────

/**
 * Composes "range 5.0–6.2 → upper bound 6.2 (growth direction)" from the
 * populated standardization block. Used in the Detail column inline summary.
 */
function formatStdInlineNote(
  std: NonNullable<FieldAudit['standardization']>,
  modelType: string | undefined,
): string {
  const before = Array.isArray(std.before_value)
    ? std.before_value.join('–')
    : String(std.before_value)
  const boundLabel = std.direction === 'upper' ? 'upper bound' : 'lower bound'
  const directionHint =
    modelType === 'growth'
      ? ' (growth direction)'
      : modelType === 'thermal_inactivation'
        ? ' (inactivation direction)'
        : ''
  return `range ${before} → ${boundLabel} ${std.after_value}${directionHint}`
}

/**
 * Derives the inline DETAIL note for a field from the available audit data.
 *
 * Priority:
 *   1. Structured standardization block (never stale)
 *   2. Extracted parsed range when no standardization block is present
 *   3. Provenance note — except the backend-internal "awaiting standardization"
 *      placeholder, which is stale by the time the response reaches the UI
 */
function deriveDetailNote(
  audit: FieldAudit,
  rawProvenanceNote: string | null,
  modelType: string | undefined,
): string | null {
  if (audit.standardization != null) {
    return formatStdInlineNote(audit.standardization, modelType)
  }
  const pr = audit.extraction?.parsed_range
  if (pr != null && pr.length >= 2 && pr[0] !== undefined && pr[1] !== undefined) {
    return `range ${pr[0]}–${pr[1]}`
  }
  if (rawProvenanceNote?.includes('awaiting standardization')) {
    return null
  }
  return rawProvenanceNote
}

// ── Value resolution for verbose mode ────────────────────────────────────────

/**
 * Resolves the display value for an audit field from the prediction object.
 * Step-suffixed keys (e.g. "temperature_celsius_step_1") map to the relevant step.
 */
function resolveFieldValue(fieldName: string, data: TranslationResponse): string {
  const p = data.prediction!
  const stepMatch = fieldName.match(/^(.+)_step_(\d+)$/)
  if (stepMatch) {
    const baseName = stepMatch[1]
    const stepIdx = parseInt(stepMatch[2] ?? '1', 10) - 1
    const step = p.steps[stepIdx]
    if (step !== undefined) {
      if (baseName === 'temperature_celsius') return formatTemperature(step.temperature_celsius)
      if (baseName === 'duration_minutes') return formatDuration(step.duration_minutes)
    }
    return '—'
  }
  switch (fieldName) {
    case 'organism':
      return formatOrganism(p.organism)
    case 'ph':
      return p.ph.toFixed(2)
    case 'water_activity':
      return p.water_activity.toFixed(2)
    case 'temperature_celsius':
      return formatTemperature(p.temperature_celsius)
    case 'duration_minutes':
      return formatDuration(p.duration_minutes)
    default:
      return '—'
  }
}

/**
 * Returns the step number embedded in a step-scoped field key, or null if not step-scoped.
 * "temperature_celsius_step_2" → 2, "ph" → null
 */
function extractStepNumber(fieldName: string): number | null {
  const m = fieldName.match(/_step_(\d+)$/)
  return m !== null && m[1] !== undefined ? parseInt(m[1], 10) : null
}

// ── FieldAuditDisclosure ─────────────────────────────────────────────────────

type DisclosureProps = {
  fieldName: string
  audit: FieldAudit
  colCount: number
  sharedRetrievalFields: string[]
  /** Provenance note for user_inferred fields — shown in the INTERPRETATION sub-block. */
  inferredNote: string | null
}

/** Inline expansion row shown below a field row when the chevron is toggled. */
function FieldAuditDisclosure({ fieldName: _fieldName, audit, colCount, sharedRetrievalFields, inferredNote }: DisclosureProps) {
  const [showFullText, setShowFullText] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  const { extraction, standardization, retrieval } = audit
  const hasContent =
    extraction != null ||
    standardization != null ||
    retrieval != null ||
    (audit.source === 'user_inferred' && inferredNote != null)

  if (!hasContent) return null

  const fullCitations = retrieval?.top_match.full_citations ?? {}

  return (
    <tr>
      <td
        colSpan={colCount}
        style={{ padding: '0' }}
      >
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surface-muted)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* ── Interpretation (user_inferred sources) ─────────────────── */}
          {audit.source === 'user_inferred' && (
            extraction != null && (extraction.method === 'rule_match' || extraction.method === 'embedding_fallback') ? (
              <div>
                <SubHeading>{strings.c4.interpretationHeading}</SubHeading>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={labelStyle}>Method</span>
                    <span style={monoStyle}>{extraction.method}</span>
                  </div>
                  {extraction.method === 'rule_match' && extraction.matched_pattern != null && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>Matched pattern</span>
                      <span style={monoStyle}>"{extraction.matched_pattern}"</span>
                    </div>
                  )}
                  {extraction.method === 'embedding_fallback' && extraction.canonical_phrase != null && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>Canonical phrase</span>
                      <span style={monoStyle}>"{extraction.canonical_phrase}"</span>
                    </div>
                  )}
                  {extraction.method === 'embedding_fallback' && extraction.similarity != null && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>{strings.c4.similarityLabel}</span>
                      <span style={{ ...monoStyle, fontVariantNumeric: 'tabular-nums' }}>
                        {formatEmbeddingScore(extraction.similarity)}
                      </span>
                    </div>
                  )}
                  {extraction.conservative != null && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>Conservative</span>
                      <span style={monoStyle}>{extraction.conservative ? 'yes' : 'no'}</span>
                    </div>
                  )}
                  {extraction.notes != null && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <span style={labelStyle}>Notes</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans, Inter, sans-serif)',
                          fontSize: '13px',
                          color: 'var(--text)',
                          flex: 1,
                          lineHeight: 1.5,
                        }}
                      >
                        {extraction.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : inferredNote != null ? (
              <div>
                <SubHeading>{strings.c4.interpretationHeading}</SubHeading>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <span style={labelStyle}>Notes</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans, Inter, sans-serif)',
                      fontSize: '13px',
                      color: 'var(--text)',
                      flex: 1,
                      lineHeight: 1.5,
                    }}
                  >
                    {inferredNote}
                  </span>
                </div>
              </div>
            ) : null
          )}

          {/* ── Extraction ─────────────────────────────────────────────── */}
          {/* Omitted for user_inferred: rule_match/embedding_fallback render in INTERPRETATION above */}
          {extraction != null && audit.source !== 'user_inferred' && (
            <div>
              <SubHeading>{strings.c4.extractionHeading}</SubHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Method</span>
                  <span style={monoStyle}>{extraction.method}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Raw match</span>
                  <span style={monoStyle}>{extraction.raw_match ?? '—'}</span>
                </div>
                {extraction.parsed_range != null && extraction.parsed_range.length > 0 && (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={labelStyle}>Parsed range</span>
                    <span style={monoStyle}>{extraction.parsed_range.join(' – ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Standardisation ────────────────────────────────────────── */}
          {standardization != null && (
            <div>
              <SubHeading>{strings.c4.standardisationHeading}</SubHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Rule</span>
                  <span style={monoStyle}>{standardization.rule}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Direction</span>
                  <span style={monoStyle}>{standardization.direction}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Before</span>
                  <span style={monoStyle}>
                    {Array.isArray(standardization.before_value)
                      ? standardization.before_value.join('–')
                      : String(standardization.before_value)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>After</span>
                  <span style={monoStyle}>{standardization.after_value}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <span style={labelStyle}>Reason</span>
                  <span
                    style={{
                      ...monoStyle,
                      fontFamily: 'var(--font-sans, Inter, sans-serif)',
                      flex: 1,
                      lineHeight: 1.5,
                    }}
                  >
                    {standardization.reason}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Retrieval ──────────────────────────────────────────────── */}
          {retrieval != null && (
            <div>
              <SubHeading>{strings.c4.retrievalHeading}</SubHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Query */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Query</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '12px',
                      color: 'var(--text)',
                      fontStyle: 'italic',
                      flex: 1,
                    }}
                  >
                    "{retrieval.query}"
                  </span>
                </div>

                {/* Top match */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>Top match</span>
                  <span style={monoStyle}>{retrieval.top_match.doc_id}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={labelStyle}>{strings.c4.similarityLabel}</span>
                  {/* embedding_score is the ONLY numeric grounding signal — never relabelled as "confidence" */}
                  <span style={{ ...monoStyle, fontVariantNumeric: 'tabular-nums' }}>
                    {formatEmbeddingScore(retrieval.top_match.embedding_score)}
                  </span>
                </div>

                {/* Retrieved text — truncated by default */}
                <div>
                  <span style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>
                    Retrieved text
                  </span>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '11px',
                      color: 'var(--text-subtle)',
                      lineHeight: 1.5,
                      margin: '0 0 4px 0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {showFullText
                      ? retrieval.top_match.retrieved_text
                      : truncateRetrievedText(retrieval.top_match.retrieved_text)}
                  </p>
                  {retrieval.top_match.retrieved_text.length > 200 && (
                    <button
                      type="button"
                      onClick={() => setShowFullText((v) => !v)}
                      style={toggleButtonStyle}
                    >
                      {showFullText ? strings.c4.hideFullText : strings.c4.showFullText}
                    </button>
                  )}
                </div>

                {/* Full citations per source_id */}
                {retrieval.top_match.source_ids.length > 0 && (
                  <div>
                    <span style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>
                      Citations
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {retrieval.top_match.source_ids.map((sid) => {
                        const full = fullCitations[sid]
                        if (full !== undefined) {
                          return <CitationButton key={sid} sourceId={sid} fullCitation={full} />
                        }
                        return (
                          <span
                            key={sid}
                            style={{
                              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                              fontSize: '12px',
                              color: 'var(--text-subtle)',
                            }}
                          >
                            [{sid}]
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Runner-up matches — collapsed by default */}
                {retrieval.runners_up.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAlternatives((v) => !v)}
                      style={toggleButtonStyle}
                    >
                      {showAlternatives
                        ? strings.c4.hideAlternatives
                        : strings.c4.showAlternatives}
                    </button>
                    {showAlternatives && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <SubHeading>{strings.c4.runnersUpHeading}</SubHeading>
                        {retrieval.runners_up.map((ru, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                            <span style={monoStyle}>{ru.doc_id}</span>
                            <span style={{ ...monoStyle, color: 'var(--text-subtle)' }}>
                              {formatEmbeddingScore(ru.embedding_score)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared retrieval note — shown when another field used the same document pull */}
          {sharedRetrievalFields.length > 0 && (
            <p
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                marginTop: '4px',
              }}
            >
              {strings.c4.sharedRetrievalNote.replace(
                '{fields}',
                sharedRetrievalFields.map((f) => formatFieldName(f)).join(', '),
              )}
            </p>
          )}
        </div>
      </td>
    </tr>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans, Inter, sans-serif)',
  fontSize: '12px',
  color: 'var(--text-subtle)',
  flexShrink: 0,
  width: '110px',
}

const monoStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
  fontSize: '12px',
  color: 'var(--text)',
}

const toggleButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '0',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans, Inter, sans-serif)',
  fontSize: '12px',
  color: 'var(--accent)',
  textDecoration: 'underline',
}

// ── Verbose mode table header ─────────────────────────────────────────────────

// FIELD | VALUE | SOURCE | STANDARDIZATION | DETAIL
const COL_WIDTHS = ['150px', '130px', '200px', '160px', 'auto']

function VerboseTableHeader() {
  const cols = [
    strings.c4.colField,
    strings.c4.colValue,
    strings.c4.colSource,
    strings.c4.colStandardization,
    strings.c4.colDetail,
  ]
  return (
    <thead>
      <tr>
        {cols.map((label, i) => (
          <th
            key={label}
            scope="col"
            style={{
              width: COL_WIDTHS[i],
              textAlign: 'left',
              padding: '0 0 8px 0',
              paddingRight: i < cols.length - 1 ? '16px' : '0',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// ── Verbose mode field row ────────────────────────────────────────────────────

const COL_COUNT = 5

type VerboseRowProps = {
  fieldName: string
  data: TranslationResponse
  audit: FieldAudit
  expandedField: string | null
  onToggle: (name: string) => void
  sharedRetrievalFields: string[]
}

function VerboseFieldRow({ fieldName, data, audit, expandedField, onToggle, sharedRetrievalFields }: VerboseRowProps) {
  const isExpanded = expandedField === fieldName

  // Raw provenance note — used for inferred disclosure and detail derivation
  const rawProvenanceNote =
    audit.source !== 'user_explicit'
      ? (data.provenance.find((p) => p.field === fieldName)?.notes ?? null)
      : null

  const hasExpansion =
    (audit.extraction != null &&
      (audit.extraction.method === 'rule_match' ||
        audit.extraction.method === 'embedding_fallback' ||
        audit.extraction.raw_match !== null ||
        (audit.extraction.parsed_range != null && audit.extraction.parsed_range.length > 0))) ||
    audit.standardization != null ||
    audit.retrieval != null ||
    (audit.source === 'user_inferred' && rawProvenanceNote != null)

  const displayValue = resolveFieldValue(fieldName, data)

  // DETAIL column: derived from structured blocks first, then filtered provenance note
  const detailNote = deriveDetailNote(audit, rawProvenanceNote, data.prediction?.model_type)
  const detailPreview =
    detailNote != null
      ? detailNote.length > 80
        ? detailNote.slice(0, 80) + '…'
        : detailNote
      : undefined

  // STANDARDIZATION column: compact label derived from the standardization block
  const stdLabel =
    audit.standardization != null
      ? formatStdLabel(audit.standardization.rule, audit.standardization.direction)
      : undefined

  return (
    <>
      <tr style={{ borderTop: '1px solid var(--border)' }}>
        {/* Field */}
        <td style={cellStyle}>
          <span
            style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '14px',
              color: 'var(--text)',
            }}
          >
            {formatFieldName(fieldName)}
          </span>
        </td>

        {/* Value */}
        <td style={{ ...cellStyle, paddingRight: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
              fontSize: '14px',
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {displayValue}
          </span>
        </td>

        {/* Source */}
        <td style={{ ...cellStyle, paddingRight: '16px' }}>
          <SourceBadge source={audit.source} />
        </td>

        {/* Standardization */}
        <td style={{ ...cellStyle, paddingRight: '16px' }}>
          {stdLabel !== undefined ? (
            <span
              style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: '12px',
                color: 'var(--text)',
              }}
            >
              {stdLabel}
            </span>
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '12px',
                color: 'var(--text-subtle)',
              }}
            >
              —
            </span>
          )}
        </td>

        {/* Detail — truncated description + chevron toggle */}
        <td style={{ ...cellStyle, verticalAlign: 'middle' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {detailPreview !== undefined && (
              <span
                style={{
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  flex: 1,
                }}
              >
                {detailPreview}
              </span>
            )}
            {hasExpansion && (
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? strings.c4.collapseLabel
                    : strings.c4.expandLabel
                }
                onClick={() => onToggle(fieldName)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: 'var(--text-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Inline disclosure row — appears immediately below when expanded */}
      {isExpanded && hasExpansion && (
        <FieldAuditDisclosure
          fieldName={fieldName}
          audit={audit}
          colCount={COL_COUNT}
          sharedRetrievalFields={sharedRetrievalFields}
          inferredNote={audit.source === 'user_inferred' ? rawProvenanceNote : null}
        />
      )}
    </>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '12px 0',
  paddingRight: '16px',
  verticalAlign: 'top',
}

// ── Verbose mode — full table ─────────────────────────────────────────────────

type VerboseTableProps = {
  data: TranslationResponse
}

function VerboseTable({ data }: VerboseTableProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const audit = data.audit!

  const toggle = (name: string) =>
    setExpandedField((prev) => (prev === name ? null : name))

  // Build a map: doc_id → field names that retrieved from that document.
  // Used to show "This retrieval also supplied: …" in the disclosure.
  const allFieldNames = Object.keys(audit.field_audit)
  const retrievalFieldMap = new Map<string, string[]>()
  for (const fname of allFieldNames) {
    const fa = audit.field_audit[fname]
    const docId = fa?.retrieval?.top_match.doc_id
    if (docId !== undefined) {
      const existing = retrievalFieldMap.get(docId) ?? []
      existing.push(fname)
      retrievalFieldMap.set(docId, existing)
    }
  }

  // Separate shared (non-step) fields from per-step fields.
  // Shared fields: no _step_N suffix. Per-step: grouped by step number.
  const sharedFields = allFieldNames.filter((k) => extractStepNumber(k) === null)
  const stepNumbers = Array.from(
    new Set(
      allFieldNames
        .map(extractStepNumber)
        .filter((n): n is number => n !== null),
    ),
  ).sort((a, b) => a - b)

  const isEmpty = allFieldNames.length === 0

  if (isEmpty) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}
      >
        {strings.c4.allUserExplicit}
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <VerboseTableHeader />
        <tbody>
          {/* Shared (non-step) fields */}
          {sharedFields.map((fieldName) => {
            const fieldAudit = audit.field_audit[fieldName]
            if (fieldAudit === undefined) return null
            const docId = fieldAudit.retrieval?.top_match.doc_id
            const sharedRetrievalFields = docId !== undefined
              ? (retrievalFieldMap.get(docId) ?? []).filter((f) => f !== fieldName)
              : []
            return (
              <VerboseFieldRow
                key={fieldName}
                fieldName={fieldName}
                data={data}
                audit={fieldAudit}
                expandedField={expandedField}
                onToggle={toggle}
                sharedRetrievalFields={sharedRetrievalFields}
              />
            )
          })}

          {/* Per-step fields grouped under "Step N" sub-headings */}
          {stepNumbers.map((stepNum) => {
            const stepFields = allFieldNames.filter(
              (k) => extractStepNumber(k) === stepNum,
            )
            return (
              <React.Fragment key={`step-${stepNum}`}>
                <tr>
                  <td
                    colSpan={COL_COUNT}
                    style={{
                      paddingTop: '16px',
                      paddingBottom: '4px',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-sans, Inter, sans-serif)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--text-subtle)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Step {stepNum}
                    </p>
                  </td>
                </tr>
                {stepFields.map((fieldName) => {
                  const fieldAudit = audit.field_audit[fieldName]
                  if (fieldAudit === undefined) return null
                  const docId = fieldAudit.retrieval?.top_match.doc_id
                  const sharedRetrievalFields = docId !== undefined
                    ? (retrievalFieldMap.get(docId) ?? []).filter((f) => f !== fieldName)
                    : []
                  return (
                    <VerboseFieldRow
                      key={fieldName}
                      fieldName={fieldName}
                      data={data}
                      audit={fieldAudit}
                      expandedField={expandedField}
                      onToggle={toggle}
                      sharedRetrievalFields={sharedRetrievalFields}
                    />
                  )
                })}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Fallback table — non-verbose responses ────────────────────────────────────
// Preserved for backward compat when the backend is non-verbose.

// Backend notes sometimes end with a trailing method identifier like " (regex)" — strip it.
function cleanNotes(text: string | null): string {
  if (text === null) return ''
  return text.replace(/\s*\([a-z_]+\)\s*$/, '')
}

function FallbackProvenanceRow({ item }: { item: ProvenanceItem }) {
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td style={{ padding: '12px 0', paddingRight: '16px', width: '140px', verticalAlign: 'top' }}>
        <span style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)', fontSize: '14px', color: 'var(--text)' }}>
          {formatFieldName(item.field)}
        </span>
      </td>
      <td style={{ padding: '12px 0', paddingRight: '16px', width: '160px', verticalAlign: 'top' }}>
        {item.value === 'N/A' ? (
          <span style={{ fontFamily: 'var(--font-mono, JetBrains Mono, monospace)', fontSize: '14px', color: 'var(--text-subtle)' }}>—</span>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono, JetBrains Mono, monospace)', fontSize: '14px', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {item.value}
          </span>
        )}
      </td>
      <td style={{ padding: '12px 0', paddingRight: '16px', width: '180px', verticalAlign: 'top' }}>
        <SourceBadge source={item.source} />
      </td>
      <td style={{ padding: '12px 0', verticalAlign: 'top', fontFamily: 'var(--font-sans, Inter, sans-serif)', fontSize: '13px', color: 'var(--text-muted)' }}>
        <NotesWithCitations text={cleanNotes(item.notes)} />
      </td>
    </tr>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

type Props = {
  data: TranslationResponse
}

export function ProvenancePanel({ data }: Props) {
  const isVerbose = data.audit != null

  if (isVerbose) {
    return (
      <PanelChrome heading={strings.c4.heading} subtitle={strings.c4.subtitle}>
        <VerboseTable data={data} />
      </PanelChrome>
    )
  }

  // Fallback: flat provenance[] rendering (no audit block present)
  const { provenance } = data
  return (
    <PanelChrome heading={strings.c4.heading} subtitle={strings.c4.subtitleFallback}>
      {provenance.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}
        >
          {strings.c4.allUserExplicit}
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {[
                  { key: 'field', label: strings.c4.colField, width: '140px' },
                  { key: 'value', label: strings.c4.colValue, width: '160px' },
                  { key: 'source', label: strings.c4.colSource, width: '180px' },
                  { key: 'notes', label: strings.c4.colNotes, width: 'auto' },
                ].map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    style={{
                      width: col.width,
                      textAlign: 'left',
                      padding: '0 0 8px 0',
                      paddingRight: col.key !== 'notes' ? '16px' : '0',
                      fontFamily: 'var(--font-sans, Inter, sans-serif)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {provenance.map((item, idx) => (
                <FallbackProvenanceRow key={`${item.field}-${idx}`} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}

    </PanelChrome>
  )
}
