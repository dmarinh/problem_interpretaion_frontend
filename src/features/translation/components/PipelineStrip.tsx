// Pipeline strip — §8.5.4.
// Thin navigable band between the query panel and C1.
// Pure navigation + count display — no state, no animation on the strip itself.

import { useMemo } from 'react'
import type { TranslationResponse } from '../api/types'
import { strings } from '../data/strings'
import { derivePipelineStatus } from '../utils/pipelineStrip'

type Props = {
  data: TranslationResponse
}

// Static stage list: label, destination panel id.
// Intent and Extraction share result-c1; Grounding and Standardization share result-c4.
const STAGES = [
  { key: 'intent',          label: strings.pipeline.intent,         panelId: 'result-c1' },
  { key: 'extraction',      label: strings.pipeline.extraction,      panelId: 'result-c1' },
  { key: 'grounding',       label: strings.pipeline.grounding,       panelId: 'result-c4' },
  { key: 'standardization', label: strings.pipeline.standardization, panelId: 'result-c4' },
  { key: 'execution',       label: strings.pipeline.execution,       panelId: 'result-c3' },
] as const

function navigateTo(panelId: string) {
  const el = document.getElementById(panelId)
  if (el == null) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // Brief highlight on the destination panel; CSS animation handles the fade.
  el.classList.add('pipeline-highlight')
  setTimeout(() => el.classList.remove('pipeline-highlight'), 800)
}

export function PipelineStrip({ data }: Props) {
  const status = useMemo(() => derivePipelineStatus(data), [data])

  const stageStatus: Record<string, { count: number | null; hasWarning: boolean }> = {
    intent:          { count: null,                        hasWarning: false },
    extraction:      { count: status.extractionCount,      hasWarning: false },
    grounding:       { count: status.groundingCount,       hasWarning: status.groundingWarning },
    standardization: { count: status.standardizationCount, hasWarning: status.standardizationWarning },
    execution:       { count: null,                        hasWarning: status.executionWarning },
  }

  return (
    <div
      role="navigation"
      aria-label="Processing stages"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: '1px solid var(--border)',
        marginBottom: '-8px', // pull the next panel slightly closer — strip is not a full panel
      }}
    >
      {STAGES.map((stage, idx) => {
        const s = stageStatus[stage.key]!
        return (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'baseline' }}>
            {idx > 0 && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                  fontSize: '12px',
                  color: 'var(--text-subtle)',
                  padding: '0 8px',
                  userSelect: 'none',
                }}
              >
                ›
              </span>
            )}

            <button
              type="button"
              className="pipeline-stage-btn"
              onClick={() => navigateTo(stage.panelId)}
            >
              <span className="pipeline-stage-label">{stage.label}</span>

              {s.count !== null && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                    fontSize: '11px',
                    color: 'var(--text-subtle)',
                  }}
                >
                  ({s.count})
                </span>
              )}

              {s.hasWarning && (
                <span
                  aria-label="safety flag"
                  style={{
                    fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                    fontSize: '11px',
                    color: 'var(--warning)',
                  }}
                >
                  ⚠
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
