// Shared §7.7 UI primitives used across C1–C6.
// All panels import from here; per-panel reinvention is prohibited.

import React, { useState } from 'react'
import { formatSource, formatConfidence } from '../utils/format'

// ── PanelChrome (§7.6) ───────────────────────────────────────────────────────

type PanelChromeProps = {
  heading: string
  subtitle?: string
  children: React.ReactNode
  headingRef?: React.RefObject<HTMLHeadingElement>
  id?: string
}

/** Container used by every result panel (C1–C6). Keeps chrome consistent. */
export function PanelChrome({ heading, subtitle, children, headingRef, id }: PanelChromeProps) {
  return (
    <section
      id={id}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '24px',
      }}
    >
      <h2
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        style={{
          fontFamily: 'var(--font-serif, Source Serif 4, serif)',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: subtitle ? '4px' : '4px',
          lineHeight: 1.2,
          outline: 'none',
        }}
      >
        {heading}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-subtle)',
            marginBottom: '4px',
          }}
        >
          {subtitle}
        </p>
      )}
      <div
        style={{ height: '1px', backgroundColor: 'var(--border)', marginBottom: '20px' }}
        aria-hidden="true"
      />
      {children}
    </section>
  )
}

// ── ConfidenceIndicator (§7.7) ───────────────────────────────────────────────
// Used only in C3 (prediction headline). Removed from C4 per audit redesign.

type ConfidenceProps = {
  /** 0..1; clamped to range if outside. */
  value: number
}

/** Horizontal bar + numeric percentage. Uses --confidence-* tokens for colour. */
export function ConfidenceIndicator({ value }: ConfidenceProps) {
  const clamped = Math.min(1, Math.max(0, value))
  const pct = Math.round(clamped * 100)

  const barColor =
    clamped >= 0.85
      ? 'var(--confidence-high)'
      : clamped >= 0.6
        ? 'var(--confidence-medium)'
        : 'var(--confidence-low)'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% confidence`}
        style={{
          width: '48px',
          height: '4px',
          backgroundColor: 'var(--border)',
          borderRadius: '2px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
          aria-hidden="true"
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '13px',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatConfidence(value)}
      </span>
    </div>
  )
}

// ── SourceBadge (§7.7) ──────────────────────────────────────────────────────

// Left-stripe colour distinguishes source tier (visual cue, paired with label text).
const SOURCE_STRIPE: Record<string, string> = {
  rag_retrieval: 'var(--accent)',
  rag_retrieval_fallback: 'var(--accent)',
  user_explicit: 'var(--confidence-high)',
  user_inferred: 'var(--confidence-medium)',
  conservative_default: 'var(--confidence-low)',
  default: 'var(--text-subtle)',
}

type SourceBadgeProps = { source: string }

/** Small pill with a 4 px coloured left stripe and the humanised source tier label. */
export function SourceBadge({ source }: SourceBadgeProps) {
  const stripe = SOURCE_STRIPE[source] ?? 'var(--text-subtle)'
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        border: '1px solid var(--border)',
        borderRadius: '3px',
        overflow: 'hidden',
        height: '22px',
      }}
    >
      <div style={{ width: '4px', backgroundColor: stripe, flexShrink: 0 }} aria-hidden="true" />
      <span
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          padding: '0 7px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--surface)',
        }}
      >
        {formatSource(source)}
      </span>
    </div>
  )
}

// ── CitationButton (§7.7) ────────────────────────────────────────────────────

type CitationButtonProps = {
  sourceId: string
  fullCitation: string
}

/**
 * Renders a citation tag as a button that toggles an inline disclosure showing
 * the full bibliographic string. Used wherever full_citations are available.
 */
export function CitationButton({ sourceId, fullCitation }: CitationButtonProps) {
  const [open, setOpen] = useState(false)
  const disclosureId = `citation-${sourceId.replace(/[^a-z0-9]/gi, '-')}`

  return (
    <span style={{ display: 'inline-block' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={disclosureId}
        onClick={() => setOpen((v) => !v)}
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '12px',
          color: 'var(--text-subtle)',
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          textDecoration: open ? 'underline' : 'none',
        }}
      >
        [{sourceId}]
      </button>
      {open && (
        <span
          id={disclosureId}
          role="region"
          aria-label={`Full citation for ${sourceId}`}
          style={{
            display: 'block',
            marginTop: '4px',
            paddingLeft: '16px',
            fontFamily: 'var(--font-sans, Inter, sans-serif)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          {fullCitation}
        </span>
      )}
    </span>
  )
}

// ── NotesWithCitations (§7.7) ────────────────────────────────────────────────

// Splits note text on citation tags like [CDC-2011-T3] and styles them distinctly.
const CITATION_SPLIT = /(\[[A-Z]+-\d+[^\]]*\])/g
const CITATION_TEST = /^\[[A-Z]+-\d+[^\]]*\]$/

type NotesProps = {
  text: string | null
  /** When provided, citation tag matching a key renders as a CitationButton. */
  fullCitations?: Record<string, string>
}

/** Renders notes text with inline citation tags. When fullCitations is provided,
 *  matching source IDs render as CitationButton toggles (§7.7). */
export function NotesWithCitations({ text, fullCitations }: NotesProps) {
  if (!text) return null
  const parts = text.split(CITATION_SPLIT)
  return (
    <>
      {parts.map((part, i) => {
        if (!CITATION_TEST.test(part)) {
          return <span key={i}>{part}</span>
        }
        // Extract source ID from "[SOURCE-ID]" → "SOURCE-ID"
        const sourceId = part.slice(1, -1)
        const fullCitation = fullCitations?.[sourceId]
        if (fullCitation !== undefined) {
          return <CitationButton key={i} sourceId={sourceId} fullCitation={fullCitation} />
        }
        return (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
              fontSize: '12px',
              color: 'var(--text-subtle)',
            }}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}

// ── KeyValueRow (§7.7) ──────────────────────────────────────────────────────

type KVRowProps = {
  label: string
  value: React.ReactNode
  /** Extra label width when more space is needed. Default ~120 px. */
  labelWidth?: number
}

/** Label left, value right, dotted leader line between — scientific report style. */
export function KeyValueRow({ label, value, labelWidth = 120 }: KVRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
      <span
        style={{
          fontFamily: 'var(--font-sans, Inter, sans-serif)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          flexShrink: 0,
          width: `${labelWidth}px`,
        }}
      >
        {label}
      </span>
      <span
        style={{
          flexGrow: 1,
          borderBottom: '1px dotted var(--border-strong)',
          alignSelf: 'end',
          marginBottom: '3px',
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          fontSize: '14px',
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ── SubHeading (used for "YOUR WORDS", "SYSTEM PARAMETERS", group labels) ───

type SubHeadingProps = { children: React.ReactNode }

/** Small uppercase sans sub-heading used inside panels (H2 in the type scale). */
export function SubHeading({ children }: SubHeadingProps) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-sans, Inter, sans-serif)',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-subtle)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '10px',
      }}
    >
      {children}
    </p>
  )
}

/** 1 px horizontal rule used as sub-section divider within panels. */
export function PanelRule() {
  return (
    <div
      style={{ height: '1px', backgroundColor: 'var(--border)', margin: '16px 0' }}
      aria-hidden="true"
    />
  )
}
