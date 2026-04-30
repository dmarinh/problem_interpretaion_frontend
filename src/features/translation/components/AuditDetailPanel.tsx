// C6 — ComBase Model & Audit Detail Panel per §8.15.
// "Which model was selected, on what basis, and what system versions produced this result?"
//
// Rendered only when data.audit is present (verbose responses).
// Model section is always expanded; system provenance is collapsed by default.

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TranslationResponse } from '../api/types'
import { strings } from '../data/strings'
import {
  formatOrganism,
  formatModelType,
  formatFieldName,
  formatValidRange,
  formatCoefficientsPreview,
  formatAuditDatetime,
  formatHash,
} from '../utils/format'
import { PanelChrome, SubHeading, KeyValueRow, PanelRule } from './primitives'

// ── Selected model subsection ─────────────────────────────────────────────────

function ModelSection({ data }: { data: TranslationResponse }) {
  const model = data.audit!.combase_model

  return (
    <div>
      <SubHeading>{strings.c6.modelSubheading}</SubHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <KeyValueRow
          label={strings.c6.fieldOrganism}
          value={<em>{formatOrganism(model.organism)}</em>}
          labelWidth={140}
        />
        <KeyValueRow
          label={strings.c6.fieldModelType}
          value={formatModelType(model.model_type)}
          labelWidth={140}
        />
        <KeyValueRow
          label={strings.c6.fieldModelId}
          value={model.model_id}
          labelWidth={140}
        />
      </div>
      {/* Selection reason — sentence text, not mono */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          {strings.c6.fieldSelectionReason}
        </span>
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '13px',
            color: 'var(--text)',
            lineHeight: 1.5,
            marginTop: '4px',
          }}
        >
          {model.selection_reason}
        </p>
      </div>
    </div>
  )
}

// ── Valid parameter ranges subsection ─────────────────────────────────────────

// Deterministic rendering order: temperature, ph, water_activity, then alphabetical.
const RANGE_ORDER = ['temperature_celsius', 'ph', 'water_activity']

function RangesSection({ data }: { data: TranslationResponse }) {
  const ranges = data.audit!.combase_model.valid_ranges
  const keys = Object.keys(ranges)
  const ordered = [
    ...RANGE_ORDER.filter((k) => k in ranges),
    ...keys.filter((k) => !RANGE_ORDER.includes(k)).sort(),
  ]

  return (
    <div style={{ marginBottom: '16px' }}>
      <SubHeading>{strings.c6.rangesSubheading}</SubHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ordered.map((key) => {
          const range = ranges[key]
          if (range === undefined) return null
          return (
            <KeyValueRow
              key={key}
              label={formatFieldName(key)}
              value={formatValidRange(range[0], range[1])}
              labelWidth={140}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Coefficients row ──────────────────────────────────────────────────────────

function CoefficientsRow({ data }: { data: TranslationResponse }) {
  const [showFull, setShowFull] = useState(false)
  const raw = data.audit!.combase_model.coefficients_str

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            flexShrink: 0,
            width: '140px',
          }}
        >
          {strings.c6.coefficientsLabel}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
            fontSize: '12px',
            color: 'var(--text-subtle)',
            flex: 1,
            wordBreak: 'break-all',
          }}
        >
          {showFull ? raw : formatCoefficientsPreview(raw)}
        </span>
        {raw.length > 80 && (
          <button
            type="button"
            onClick={() => setShowFull((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '12px',
              color: 'var(--accent)',
              textDecoration: 'underline',
              padding: '0',
              flexShrink: 0,
            }}
          >
            {showFull ? strings.c6.hideFullCoefficients : strings.c6.showFullCoefficients}
          </button>
        )}
      </div>
    </div>
  )
}

// ── System provenance subsection (collapsible) ────────────────────────────────

const SYSTEM_PROVENANCE_ID = 'c6-system-provenance'

function SystemProvenanceSection({ data }: { data: TranslationResponse }) {
  const [open, setOpen] = useState(false)
  const sys = data.audit!.system

  return (
    <div>
      {/* Toggle button row */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={SYSTEM_PROVENANCE_ID}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          width: '100%',
          textAlign: 'left',
        }}
      >
        {open ? (
          <ChevronUp size={14} color="var(--text-subtle)" />
        ) : (
          <ChevronDown size={14} color="var(--text-subtle)" />
        )}
        <span
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {strings.c6.systemSubheading}
        </span>
      </button>

      {/* Collapsible content */}
      {open && (
        <div
          id={SYSTEM_PROVENANCE_ID}
          role="region"
          aria-label={strings.c6.systemSubheading}
          style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <KeyValueRow
            label={strings.c6.fieldPtmVersion}
            value={sys.ptm_version}
            labelWidth={160}
          />
          <KeyValueRow
            label={strings.c6.fieldCombaseHash}
            value={
              <span title={sys.combase_model_table_hash ?? undefined}>
                {formatHash(sys.combase_model_table_hash)}
              </span>
            }
            labelWidth={160}
          />
          <KeyValueRow
            label={strings.c6.fieldRagHash}
            value={
              <span title={sys.rag_store_hash ?? undefined}>
                {formatHash(sys.rag_store_hash)}
              </span>
            }
            labelWidth={160}
          />
          <KeyValueRow
            label={strings.c6.fieldRagIngested}
            value={formatAuditDatetime(sys.rag_ingested_at)}
            labelWidth={160}
          />
          <KeyValueRow
            label={strings.c6.fieldSourceCsv}
            value={formatAuditDatetime(sys.source_csv_audit_date)}
            labelWidth={160}
          />
        </div>
      )}
    </div>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

type Props = {
  data: TranslationResponse
}

/**
 * C6 — ComBase model & audit detail. Rendered only when data.audit is present.
 * Model section is always expanded; system provenance is collapsed by default.
 */
export function AuditDetailPanel({ data }: Props) {
  if (!data.audit) return null

  return (
    <PanelChrome heading={strings.c6.heading}>
      <ModelSection data={data} />
      <RangesSection data={data} />
      <CoefficientsRow data={data} />
      <PanelRule />
      <SystemProvenanceSection data={data} />
    </PanelChrome>
  )
}
