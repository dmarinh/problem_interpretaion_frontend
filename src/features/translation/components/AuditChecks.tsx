// C5 — Safety Flags per §8.10.
// "What was checked and changed?"
//
// Always rendered — never omitted, even when all categories are empty.
// An empty category shows "(none applied)" which is explicit information for regulators.
//
// Two rendering modes:
//   verbose mode  — three categories from audit.{range_clamps, defaults_imputed, warnings}
//   fallback mode — three categories from response.warnings[] grouped by type
//                   (legacy non-verbose responses)

import { ArrowLeftRight, Info, AlertCircle } from 'lucide-react'
import type { TranslationResponse, WarningItem, DefaultImputedInfo } from '../api/types'
import { strings } from '../data/strings'
import { formatFieldName, formatImputedValue } from '../utils/format'
import { PanelChrome, SubHeading } from './primitives'

// ── Shared entry row ─────────────────────────────────────────────────────────

type EntryRowProps = {
  icon: React.ReactNode
  field?: string | null
  description: string
  stepLabel?: string
}

function EntryRow({ icon, field, description, stepLabel }: EntryRowProps) {
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
      <div style={{ paddingTop: '1px', flexShrink: 0 }}>{icon}</div>
      <div
        style={{
          width: '120px',
          flexShrink: 0,
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '13px',
          color: stepLabel !== undefined ? 'var(--text-subtle)' : 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {stepLabel ?? (field ?? '')}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '14px',
          color: 'var(--text)',
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  )
}

// ── "None applied" placeholder ────────────────────────────────────────────────

function NoneApplied() {
  return (
    <p
      style={{
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
        fontSize: '13px',
        color: 'var(--text-subtle)',
        fontStyle: 'italic',
        padding: '8px 0',
      }}
    >
      {strings.c5.noneApplied}
    </p>
  )
}

// ── Verbose mode — three fixed categories ────────────────────────────────────

// String categories (range_clamps, warnings): backend now sends truly empty arrays.
// No sentinel filtering needed — length === 0 means empty.
type VerboseCategoryProps = {
  label: string
  items: string[]
  icon: React.ReactNode
}

function VerboseCategory({ label, items, icon }: VerboseCategoryProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SubHeading>{label}</SubHeading>
      {items.length === 0 ? (
        <NoneApplied />
      ) : (
        <div>
          {items.map((description, idx) => (
            <EntryRow
              key={idx}
              icon={icon}
              field={null}
              description={description}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// defaults_imputed is a structured list. Renders field+value as primary info and
// reason as supporting detail so regulators can scan "what was defaulted and to what".
function DefaultImputedRow({ item }: { item: DefaultImputedInfo }) {
  const fieldLabel = formatFieldName(item.field_name)
  const valueStr = formatImputedValue(item.field_name, item.default_value)
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
      <div style={{ paddingTop: '2px', flexShrink: 0 }}>
        <Info size={16} color="var(--text-muted)" style={{ display: 'block' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
            fontSize: '13px',
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fieldLabel} = {valueStr}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '13px',
            color: 'var(--text-subtle)',
            marginTop: '3px',
            lineHeight: 1.45,
          }}
        >
          {item.reason}
        </div>
      </div>
    </div>
  )
}

function DefaultsImputedCategory({ items }: { items: DefaultImputedInfo[] }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SubHeading>{strings.c5.groupDefaultsImputed}</SubHeading>
      {items.length === 0 ? (
        <NoneApplied />
      ) : (
        <div>
          {items.map((item, idx) => (
            <DefaultImputedRow key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function VerboseChecks({ data }: { data: TranslationResponse }) {
  const { audit } = data
  if (!audit) return null
  // Categories are nested under audit.audit in the real API response
  const categories = audit.audit

  return (
    <>
      <VerboseCategory
        label={strings.c5.groupRangeClamps}
        items={categories.range_clamps}
        icon={<ArrowLeftRight size={16} color="var(--warning)" style={{ display: 'block', flexShrink: 0 }} />}
      />
      <DefaultsImputedCategory items={categories.defaults_imputed} />
      <VerboseCategory
        label={strings.c5.groupWarnings}
        items={categories.warnings}
        icon={<AlertCircle size={16} color="var(--warning)" style={{ display: 'block', flexShrink: 0 }} />}
      />
    </>
  )
}

// ── Fallback mode — legacy warnings[] grouped by type ────────────────────────

type FallbackCategoryProps = {
  label: string
  icon: React.ReactNode
  warnings: WarningItem[]
  warningStepMap: Map<WarningItem, number>
}

function FallbackCategory({ label, icon, warnings, warningStepMap }: FallbackCategoryProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <SubHeading>{label}</SubHeading>
      {warnings.length === 0 ? (
        <NoneApplied />
      ) : (
        <div>
          {warnings.map((w, idx) => {
            const stepOrder = warningStepMap.get(w)
            const stepLabel =
              stepOrder !== undefined
                ? strings.c5.stepAttached.replace('{N}', String(stepOrder))
                : undefined
            return (
              <EntryRow
                key={idx}
                icon={icon}
                field={w.field}
                description={w.message}
                {...(stepLabel !== undefined ? { stepLabel } : {})}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function FallbackChecks({
  data,
  warningStepMap,
}: {
  data: TranslationResponse
  warningStepMap: Map<WarningItem, number>
}) {
  const { warnings } = data

  const rangeClamps = warnings.filter((w) => w.type === 'range_clamp')
  // All remaining types → system notes (including any legacy bias_correction entries)
  const systemNotes = warnings.filter((w) => w.type !== 'range_clamp')

  return (
    <>
      <FallbackCategory
        label={strings.c5.groupRangeClamps}
        icon={<ArrowLeftRight size={16} color="var(--warning)" style={{ display: 'block', flexShrink: 0 }} />}
        warnings={rangeClamps}
        warningStepMap={warningStepMap}
      />
      {/* Defaults imputed has no fallback data — always "(none applied)" */}
      <div style={{ marginBottom: '20px' }}>
        <SubHeading>{strings.c5.groupDefaultsImputed}</SubHeading>
        <NoneApplied />
      </div>
      <FallbackCategory
        label={strings.c5.groupWarnings}
        icon={<AlertCircle size={16} color="var(--warning)" style={{ display: 'block', flexShrink: 0 }} />}
        warnings={systemNotes}
        warningStepMap={warningStepMap}
      />
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

type Props = {
  data: TranslationResponse
  warningStepMap: Map<WarningItem, number>
}

/** C5 — always rendered, even when all categories are empty (§8.10). */
export function AuditChecks({ data, warningStepMap }: Props) {
  const isVerbose = data.audit != null

  return (
    <PanelChrome heading={strings.c5.heading}>
      {isVerbose ? (
        <VerboseChecks data={data} />
      ) : (
        <FallbackChecks data={data} warningStepMap={warningStepMap} />
      )}
    </PanelChrome>
  )
}
