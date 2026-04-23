// C1 — Translation Panel per §8.6.
// "Your words ↔ system's parameters" — bridges natural language and model inputs.

import type { TranslationResponse } from '../api/types'
import { strings } from '../data/strings'
import { formatOrganism, formatModelType, formatTemperature, formatDuration } from '../utils/format'
import { PanelChrome, KeyValueRow, SubHeading } from './primitives'

type Props = {
  data: TranslationResponse
  headingRef: React.RefObject<HTMLHeadingElement>
}

export function TranslationPanel({ data, headingRef }: Props) {
  const p = data.prediction!

  return (
    <PanelChrome heading={strings.c1.heading} headingRef={headingRef}>
      <div
        className="c1-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* Left column — original query (§8.6 "YOUR WORDS") */}
        <div>
          <SubHeading>{strings.c1.yourWords}</SubHeading>
          <div
            style={{
              borderLeft: '2px solid var(--border-strong)',
              paddingLeft: '16px',
              maxHeight: '240px',
              overflowY: data.original_query.length > 500 ? 'auto' : 'visible',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '14px',
                color: 'var(--text)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {data.original_query}
            </p>
          </div>
        </div>

        {/* Right column — grounded parameters (§8.6 "SYSTEM PARAMETERS") */}
        <div>
          <SubHeading>{strings.c1.parameters}</SubHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Organism — italicised binomial per §4.5 */}
            <KeyValueRow
              label="Organism"
              value={<em>{formatOrganism(p.organism)}</em>}
              labelWidth={116}
            />
            <KeyValueRow
              label="Model type"
              value={formatModelType(p.model_type)}
              labelWidth={116}
            />
            <KeyValueRow label="pH" value={p.ph.toFixed(2)} labelWidth={116} />
            <KeyValueRow
              label="Water activity"
              value={p.water_activity.toFixed(2)}
              labelWidth={116}
            />

            {/* Single-step: show temperature + duration (§8.6).
                Multi-step: only show step count — scalars would be misleading (§4.7). */}
            {p.is_multi_step ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, Inter, sans-serif)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    width: '116px',
                  }}
                >
                  Profile
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, Inter, sans-serif)',
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {strings.c1.multiStepNote.replace('{N}', String(p.steps.length))}
                </span>
              </div>
            ) : (
              <>
                <KeyValueRow
                  label="Temperature"
                  value={formatTemperature(p.temperature_celsius)}
                  labelWidth={116}
                />
                <KeyValueRow
                  label="Duration"
                  value={formatDuration(p.duration_minutes)}
                  labelWidth={116}
                />
              </>
            )}
          </div>
        </div>
      </div>

    </PanelChrome>
  )
}
