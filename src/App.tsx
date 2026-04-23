import packageJson from '../package.json';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      <div className="mx-auto w-full max-w-[1280px] px-8 py-8 flex flex-col flex-1">

        {/* Region A — Header */}
        <header className="h-16 flex items-center" aria-label="Site header">
          <span
            className="font-serif text-2xl font-medium"
            style={{ color: 'var(--text)' }}
          >
            Problem Translator
          </span>
          <div
            className="mx-4 w-px h-6 shrink-0"
            style={{ backgroundColor: 'var(--border-strong)' }}
            aria-hidden="true"
          />
          <span
            className="font-sans text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            Natural-language food safety queries, grounded in predictive microbiology.
          </span>
        </header>

        {/* Separator below header */}
        <hr className="border-0 border-t" style={{ borderColor: 'var(--border)' }} />

        {/* Regions B + C — placeholder until Checkpoint 2 */}
        <main className="flex-1 mt-8 mb-8">
          <div
            className="rounded border p-6"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <p className="font-sans text-sm">
              Query panel and result area — implemented at Checkpoint 2.
            </p>
          </div>
        </main>

        {/* Region D — Footer */}
        <div>
          <hr className="border-0 border-t" style={{ borderColor: 'var(--border)' }} />
          <footer
            className="h-10 flex items-center justify-between font-sans"
            aria-label="Site footer"
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Problem Translator
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: 'var(--text-subtle)' }}
              >
                v{packageJson.version}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              Documentation&nbsp;·&nbsp;Source
            </div>
          </footer>
        </div>

      </div>
    </div>
  );
}
