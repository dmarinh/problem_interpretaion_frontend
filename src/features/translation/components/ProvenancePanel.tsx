// C4 — Provenance Panel per §8.9.
// "Where did each number come from, and how sure are we?" — the auditability story.

import type { TranslationResponse, ProvenanceItem } from '../api/types'
import { strings } from '../data/strings'
import { formatFieldName } from '../utils/format'
import { PanelChrome, ConfidenceIndicator, SourceBadge, NotesWithCitations } from './primitives'

type Props = {
  data: TranslationResponse
}

// "N/A" raw value renders as an em-dash — not the literal text (§4.7).
function ProvenanceValue({ raw }: { raw: string }) {
  if (raw === 'N/A') {
    return (
      <span
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '14px',
          color: 'var(--text-subtle)',
        }}
      >
        —
      </span>
    )
  }
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
        fontSize: '14px',
        color: 'var(--text)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {raw}
    </span>
  )
}

function ProvenanceRow({ item }: { item: ProvenanceItem }) {
  return (
    <tr
      style={{
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Field */}
      <td
        style={{
          padding: '12px 0',
          paddingRight: '16px',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          color: 'var(--text)',
          width: '140px',
          verticalAlign: 'top',
        }}
      >
        {formatFieldName(item.field)}
      </td>

      {/* Value */}
      <td
        style={{
          padding: '12px 0',
          paddingRight: '16px',
          width: '160px',
          verticalAlign: 'top',
        }}
      >
        <ProvenanceValue raw={item.value} />
      </td>

      {/* Source */}
      <td
        style={{
          padding: '12px 0',
          paddingRight: '16px',
          width: '180px',
          verticalAlign: 'top',
        }}
      >
        <SourceBadge source={item.source} />
      </td>

      {/* Confidence */}
      <td
        style={{
          padding: '12px 0',
          paddingRight: '16px',
          width: '180px',
          verticalAlign: 'top',
        }}
      >
        <ConfidenceIndicator value={item.confidence} />
      </td>

      {/* Notes */}
      <td
        style={{
          padding: '12px 0',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          verticalAlign: 'top',
        }}
      >
        <NotesWithCitations text={item.notes} />
      </td>
    </tr>
  )
}

export function ProvenancePanel({ data }: Props) {
  const { provenance, overall_confidence } = data

  return (
    <PanelChrome heading={strings.c4.heading} subtitle={strings.c4.subtitle}>
      {provenance.length === 0 ? (
        /* Empty provenance — all values were user-explicit (§8.9) */
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
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            {/* Column header row */}
            <thead>
              <tr>
                {[
                  { key: 'field', label: strings.c4.colField, width: '140px' },
                  { key: 'value', label: strings.c4.colValue, width: '160px' },
                  { key: 'source', label: strings.c4.colSource, width: '180px' },
                  { key: 'conf', label: strings.c4.colConfidence, width: '180px' },
                  { key: 'notes', label: strings.c4.colNotes, width: 'auto' },
                ].map((col) => (
                  <th
                    key={col.key}
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
                <ProvenanceRow key={`${item.field}-${idx}`} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: overall confidence (§8.9) */}
      {overall_confidence !== null && (
        <div
          style={{
            borderTop: '1px solid var(--border-strong)',
            paddingTop: '12px',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '14px',
              color: 'var(--text)',
            }}
          >
            {strings.c4.overallConfidence}
          </span>
          <ConfidenceIndicator value={overall_confidence} />
        </div>
      )}
    </PanelChrome>
  )
}
