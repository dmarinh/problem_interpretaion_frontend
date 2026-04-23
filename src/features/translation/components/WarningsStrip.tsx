// C5 — Warnings Strip per §8.10.
// "What did the system change or flag?"
// Grouped by type; empty groups omitted; panel omitted entirely if no warnings.
// Step-correlated warnings appear here (with an "attached to step N" note) AND in C2.

import { Settings2, AlertCircle, Info } from 'lucide-react'
import type { TranslationResponse, WarningItem } from '../api/types'
import { strings } from '../data/strings'
import { PanelChrome, SubHeading } from './primitives'

type Props = {
  data: TranslationResponse
  /** Lookup map: WarningItem → step_order it's correlated to (from buildWarningStepMap). */
  warningStepMap: Map<WarningItem, number>
}

type WarningGroup = {
  type: 'bias_correction' | 'range_clamp' | 'warning'
  label: string
  icon: React.ReactNode
  warnings: WarningItem[]
}

// Icon per warning type — consistent throughout per §7.8.
function warningIcon(type: string): React.ReactNode {
  const size = 16
  const style = { display: 'block', flexShrink: 0 } as const

  switch (type) {
    case 'bias_correction':
      return <Settings2 size={size} color="var(--correction)" style={style} />
    case 'range_clamp':
      return <AlertCircle size={size} color="var(--warning)" style={style} />
    default:
      return <Info size={size} color="var(--text-muted)" style={style} />
  }
}

function WarningRow({
  warning,
  stepOrder,
  icon,
}: {
  warning: WarningItem
  stepOrder: number | undefined
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Icon */}
      <div style={{ paddingTop: '1px', flexShrink: 0 }}>{icon}</div>

      {/* Field indicator — 120 px column */}
      <div
        style={{
          width: '120px',
          flexShrink: 0,
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '13px',
          color: stepOrder !== undefined ? 'var(--text-subtle)' : 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {stepOrder !== undefined
          ? strings.c5.stepAttached.replace('{N}', String(stepOrder))
          : (warning.field ?? '')}
      </div>

      {/* Message */}
      <div
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          color: 'var(--text)',
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {warning.message}
      </div>
    </div>
  )
}

export function WarningsStrip({ data, warningStepMap }: Props) {
  const { warnings } = data

  // Panel omitted entirely when there are no warnings (§8.10).
  if (warnings.length === 0) return null

  const groups: WarningGroup[] = [
    {
      type: 'bias_correction',
      label: strings.c5.groupCorrections,
      icon: warningIcon('bias_correction'),
      warnings: warnings.filter((w) => w.type === 'bias_correction'),
    },
    {
      type: 'range_clamp',
      label: strings.c5.groupClamps,
      icon: warningIcon('range_clamp'),
      warnings: warnings.filter((w) => w.type === 'range_clamp'),
    },
    {
      type: 'warning',
      label: strings.c5.groupNotes,
      icon: warningIcon('warning'),
      warnings: warnings.filter((w) => w.type === 'warning'),
    },
  ]

  // Any warnings with an unknown type land in the Notes group via the filter above
  // (they don't match 'bias_correction' or 'range_clamp', so they don't appear twice).
  // But if the type is truly unknown, none of the filters catch it — add a catch-all.
  const coveredTypes = new Set<string>(['bias_correction', 'range_clamp', 'warning'])
  const unknownWarnings = warnings.filter((w) => !coveredTypes.has(w.type))
  if (unknownWarnings.length > 0) {
    groups[2]!.warnings = [...groups[2]!.warnings, ...unknownWarnings]
  }

  return (
    <PanelChrome heading={strings.c5.heading}>
      {groups.map((group) => {
        if (group.warnings.length === 0) return null // empty group omitted
        return (
          <div key={group.type} style={{ marginBottom: '20px' }}>
            <SubHeading>{group.label}</SubHeading>
            <div>
              {group.warnings.map((w, idx) => (
                <WarningRow
                  key={idx}
                  warning={w}
                  stepOrder={warningStepMap.get(w)}
                  icon={group.icon}
                />
              ))}
            </div>
          </div>
        )
      })}
    </PanelChrome>
  )
}
