// C3 — Prediction Panel per §8.8.
// "What does the model predict?" — headline numbers + growth curve.

import type { TranslationResponse } from '../api/types'
import { strings } from '../data/strings'
import {
  formatOrganism,
  formatModelType,
  formatMuMax,
  formatDoublingTime,
  formatDuration,
} from '../utils/format'
import { PanelChrome, ConfidenceIndicator, KeyValueRow, PanelRule } from './primitives'
import { GrowthCurve } from './GrowthCurve'

type Props = {
  data: TranslationResponse
}

export function PredictionPanel({ data }: Props) {
  const p = data.prediction!
  const isInactivation = p.total_log_increase < 0

  // Headline: "+0.69" large mono, then "log₁₀" below in muted sans.
  const signedLog = p.total_log_increase
  const logSign = signedLog >= 0 ? '+' : ''
  const logMagnitude = `${logSign}${signedLog.toFixed(2)}`

  // "S. aureus growth" or "S. aureus inactivation"
  const headlineLabel = `${formatOrganism(p.organism)} ${formatModelType(p.model_type).toLowerCase()}`

  return (
    <PanelChrome heading={strings.c3.heading}>
      <div
        className="c3-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '5fr 8fr', // ~4-8 split (narrower headline, wider curve)
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left column — headline numbers */}
        <div>
          {/* Primary number: log₁₀ change */}
          <div style={{ marginBottom: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                fontSize: '40px',
                fontWeight: 500,
                color: isInactivation ? 'var(--inactivation)' : 'var(--growth)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                display: 'block',
              }}
            >
              {logMagnitude}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '14px',
                color: 'var(--text-muted)',
                display: 'block',
                marginTop: '2px',
              }}
            >
              log₁₀
            </span>
          </div>

          {/* Organism + model type label */}
          <p
            style={{
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '14px',
              color: 'var(--text-muted)',
              marginBottom: '16px',
              marginTop: '8px',
            }}
          >
            <em>{headlineLabel}</em>
          </p>

          {/* Confidence row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans, Inter, sans-serif)',
                fontSize: '13px',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {strings.c3.confidence}
            </span>
            {data.overall_confidence !== null && (
              <ConfidenceIndicator value={data.overall_confidence} />
            )}
          </div>

          <PanelRule />

          {/* Supporting stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <KeyValueRow
              label={
                p.is_multi_step
                  ? `μ_max ${strings.c3.muMaxStep1Suffix}`
                  : 'μ_max'
              }
              value={formatMuMax(p.mu_max)}
              labelWidth={100}
            />
            {p.doubling_time_hours !== null && (
              <KeyValueRow
                label="Doubling time"
                value={formatDoublingTime(p.doubling_time_hours)}
                labelWidth={100}
              />
            )}
            <KeyValueRow
              label="Total duration"
              value={formatDuration(p.duration_minutes)}
              labelWidth={100}
            />
          </div>
        </div>

        {/* Right column — growth curve */}
        <div>
          <GrowthCurve prediction={p} />
        </div>
      </div>

    </PanelChrome>
  )
}
