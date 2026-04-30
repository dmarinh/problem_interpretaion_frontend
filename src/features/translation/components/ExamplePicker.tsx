import { useEffect, useRef, useState } from 'react';
import { ACTIVE_GROUPS, DisplayQuery } from '../data/activeExamples';

type Props = {
  onSelect: (fullText: string) => void;
  onClose: () => void;
};

const FLAT_QUERIES: DisplayQuery[] = ACTIVE_GROUPS.flatMap((g) => g.queries);

export function ExamplePicker({ onSelect, onClose }: Props) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus first item on mount.
  useEffect(() => {
    itemRefs.current[0]?.focus();
  }, []);

  // Keep focus synced with keyboard navigation.
  useEffect(() => {
    itemRefs.current[focusedIndex]?.focus();
  }, [focusedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((i) => Math.min(FLAT_QUERIES.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }

  function handleSelect(index: number) {
    const query = FLAT_QUERIES[index];
    if (query) onSelect(query.fullText);
  }

  // Build indexed items per group for keyboard navigation.
  let flatIndex = 0;
  const groups = ACTIVE_GROUPS.map((group) => ({
    label: group.label,
    items: group.queries.map((query) => ({ query, index: flatIndex++ })),
  }));

  return (
    <div
      role="menu"
      aria-label="Example queries"
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 50,
        width: '640px',
        maxHeight: '480px',
        overflowY: 'auto',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      {groups.map(({ label, items }) => (
        <div key={label}>
          {/* Group heading */}
          <div
            style={{
              padding: '10px 16px 4px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans, Inter, sans-serif)',
              letterSpacing: '0.06em',
              color: 'var(--text-subtle)',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {label}
          </div>
          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border)',
              margin: '0 16px 4px',
            }}
          />

          {/* Query entries */}
          {items.map(({ query, index }) => (
            <button
              key={query.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              role="menuitem"
              tabIndex={index === focusedIndex ? 0 : -1}
              onClick={() => handleSelect(index)}
              onFocus={() => setFocusedIndex(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--surface-muted)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '';
              }}
            >
              {/* Summary + optional goal */}
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sans, Inter, sans-serif)',
                    fontSize: '14px',
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {query.summary}
                </span>
                {query.goal && (
                  <span
                    style={{
                      fontFamily: 'var(--font-sans, Inter, sans-serif)',
                      fontSize: '12px',
                      color: 'var(--text-subtle)',
                      whiteSpace: 'normal',
                      lineHeight: '1.4',
                    }}
                  >
                    {query.goal}
                  </span>
                )}
              </span>
            </button>
          ))}

          {/* Group bottom spacer */}
          <div style={{ height: '8px' }} />
        </div>
      ))}
    </div>
  );
}
