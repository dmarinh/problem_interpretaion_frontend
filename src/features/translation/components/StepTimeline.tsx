// C2 — Step Timeline per §8.7.
// "Where in the scenario did the interesting thing happen?"
// Always rendered; single-step scenarios produce one full-width segment.

import { AlertCircle } from 'lucide-react'
import type { TranslationResponse, WarningItem } from '../api/types'
import { strings } from '../data/strings'
import { formatTemperature, formatDuration, formatLogIncrease } from '../utils/format'
import { PanelChrome } from './primitives'

type Props = {
  data: TranslationResponse
  /** step_order → warnings correlated to that step (from correlateWarnings). */
  perStepWarnings: Map<number, WarningItem[]>
}

/** Linear interpolation of fill opacity (10%–70%) based on relative Δlog magnitude. */
function segmentOpacity(logMag: number, maxLogMag: number): number {
  if (maxLogMag === 0) return 0.3
  return 0.1 + (logMag / maxLogMag) * 0.6
}

export function StepTimeline({ data, perStepWarnings }: Props) {
  const p = data.prediction!
  const { steps, step_predictions: stepPreds, duration_minutes: totalDuration } = p

  const isInactivation = p.total_log_increase < 0
  // Solid color without opacity — opacity applied to background div only (text stays full opacity).
  const fillHex = isInactivation ? '#2E6080' : '#8B6914'

  const logMags = stepPreds.map((sp) => Math.abs(sp.log_increase))
  const maxLogMag = Math.max(...logMags, 0)

  // Accessible label describing the full profile.
  const profileLabel = (() => {
    const parts = steps.map(
      (s) =>
        `${formatTemperature(s.temperature_celsius)} for ${formatDuration(s.duration_minutes)}`,
    )
    const organism = p.organism.toLowerCase().replace(/_/g, ' ')
    return (
      `${steps.length}-step profile: ${parts.join(', ')}. ` +
      `Total ${formatDuration(totalDuration)}, ` +
      `${formatLogIncrease(p.total_log_increase)} ${organism}.`
    )
  })()

  return (
    <PanelChrome heading={strings.c2.heading}>
      {/* Timeline bar: role="img" on the container, segments as <button> for keyboard access */}
      <div
        role="img"
        aria-label={profileLabel}
        style={{
          display: 'flex',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          overflow: 'hidden',
          height: '120px',
        }}
      >
        {steps.map((step, idx) => {
          const stepPred = stepPreds.find((sp) => sp.step_order === step.step_order)
          const logMag = stepPred ? Math.abs(stepPred.log_increase) : 0
          const opacity = segmentOpacity(logMag, maxLogMag)
          const warnings = perStepWarnings.get(step.step_order) ?? []
          const isLast = idx === steps.length - 1

          const flexValue = totalDuration > 0 ? step.duration_minutes : 1
          const pct = totalDuration > 0 ? (step.duration_minutes / totalDuration) * 100 : 100
          const isNarrow = pct < 10   // approx < 100 px at 1000 px container
          const isVeryNarrow = pct < 6 // approx < 60 px — show only temperature

          return (
            <button
              key={step.step_order}
              aria-label={
                `Step ${step.step_order}: ${formatTemperature(step.temperature_celsius)}, ` +
                `${formatDuration(step.duration_minutes)}` +
                (stepPred ? `, ${formatLogIncrease(stepPred.log_increase)}` : '') +
                (warnings.length > 0
                  ? `. Warning: ${warnings.map((w) => w.message).join('; ')}`
                  : '')
              }
              style={{
                flex: flexValue,
                minWidth: '60px',
                position: 'relative',
                border: 'none',
                borderRight: isLast ? 'none' : '1px solid var(--border-strong)',
                padding: isVeryNarrow ? '6px 4px' : '8px 10px',
                cursor: warnings.length > 0 ? 'pointer' : 'default',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'left',
                font: 'inherit',
                overflow: 'hidden',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid var(--accent)'
                e.currentTarget.style.outlineOffset = '-2px'
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none'
              }}
            >
              {/* Background fill with per-step opacity (text sits on top) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: fillHex,
                  opacity,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />

              {/* Step-scoped warning indicator (top-right corner, §8.7) */}
              {warnings.length > 0 && (
                <div
                  style={{ position: 'absolute', top: '4px', right: '4px' }}
                  title={warnings.map((w) => w.message).join('\n')}
                >
                  <AlertCircle size={12} color="var(--warning)" aria-hidden="true" />
                </div>
              )}

              {/* Content above background */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
              >
                {/* Top: temperature */}
                {!isVeryNarrow && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                        fontSize: isNarrow ? '14px' : '18px',
                        fontWeight: 500,
                        color: 'var(--text)',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                    >
                      {step.temperature_celsius % 1 === 0
                        ? step.temperature_celsius
                        : step.temperature_celsius.toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans, Inter, sans-serif)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      °C
                    </span>
                  </div>
                )}

                {/* Very narrow: temperature only, squeezed */}
                {isVeryNarrow && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '12px',
                      color: 'var(--text)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {step.temperature_celsius % 1 === 0
                      ? step.temperature_celsius
                      : step.temperature_celsius.toFixed(1)}
                    °
                  </span>
                )}

                {/* Centre: Δlog contribution */}
                {!isNarrow && stepPred && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                        fontSize: '14px',
                        color: 'var(--text-muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stepPred.log_increase >= 0 ? '+' : ''}
                      {stepPred.log_increase.toFixed(2)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans, Inter, sans-serif)',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      log₁₀
                    </span>
                  </div>
                )}

                {/* Bottom: duration */}
                {!isVeryNarrow && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatDuration(step.duration_minutes)}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Step labels below the bar */}
      <div style={{ display: 'flex', marginTop: '6px' }}>
        {steps.map((step) => (
          <div
            key={step.step_order}
            style={{
              flex: totalDuration > 0 ? step.duration_minutes : 1,
              minWidth: '60px',
              textAlign: 'center',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              fontSize: '12px',
              color: 'var(--text-subtle)',
            }}
          >
            step {step.step_order}
          </div>
        ))}
      </div>

      {/* Footer: total duration + total log (§8.7) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          {strings.c2.totalDuration}{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
              color: 'var(--text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatDuration(totalDuration)}
          </span>
        </span>
        <span>
          {strings.c2.totalLog}{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
              color: isInactivation ? 'var(--inactivation)' : 'var(--growth)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatLogIncrease(p.total_log_increase)}
          </span>
        </span>
      </div>
    </PanelChrome>
  )
}
