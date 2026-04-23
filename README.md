# Problem Translator — Frontend

Single-page React application that translates natural-language food safety queries into auditable, scientifically grounded predictions from ComBase predictive microbiology models.

## Prerequisites

- Node ≥ 20 LTS (see `.nvmrc`)
- A locally running backend: `http://localhost:8000` (separate FastAPI project)

## Install

```
npm install
```

## Development

```
npm run dev
```

Opens at `http://localhost:5173`. Requires the backend to be running at `http://localhost:8000`.

## Build

```
npm run build
```

Type-checks then bundles to `dist/`. Preview the production build with `npm run preview`.

## Tests and linting

```
npm test              # Vitest unit tests
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (zero warnings)
```

All three must pass clean before any checkpoint.

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:8000` | URL of the FastAPI backend |

Copy `.env.example` to `.env.local` and edit as needed. The `.env.development` file sets the localhost defaults for local development.

Every submit and every URL visit fetches from the backend. No client-side cache between requests.

## URL state

Successful submissions update the URL to `?q=<query>`. Sharing that URL causes the recipient's browser to auto-execute the same query on load.
