# TypeDoc + GitHub Pages for tsqtsq

## Goal

Generate navigable API reference docs from TypeScript source, add hand-written guide pages, and publish to GitHub Pages automatically on push to `main`.

## Tool Choice

**TypeDoc** — lightweight, TypeScript-native doc generator. Reads `.ts` source directly, extracts types and JSDoc, outputs a navigable HTML site with built-in search.

Alternatives considered:
- Docusaurus: too heavy for a small library
- Starlight/Astro: TypeDoc integration less mature

## Components

### 1. TypeDoc setup
- Add `typedoc` as a devDependency
- `typedoc.json` config at project root, entry point `src/index.ts`
- HTML output to `docs/` (gitignored)
- `npm run docs` script in package.json

### 2. Custom guide pages
- `docs-src/` directory with markdown files (getting started, examples)
- Included via TypeDoc's `projectDocuments` option

### 3. GitHub Actions workflow
- `.github/workflows/docs.yml`
- Triggers on push to `main`
- Runs `npm ci && npm run docs`
- Deploys to GitHub Pages via `actions/deploy-pages`

## Files changed/added

| File | Action |
|------|--------|
| `package.json` | Add `typedoc` devDep, add `docs` script |
| `typedoc.json` | TypeDoc configuration |
| `.gitignore` | Add `docs/` output directory |
| `.github/workflows/docs.yml` | Pages deployment workflow |
| `docs-src/*.md` | Hand-written guide pages |

## Out of scope
- Custom TypeDoc theme
- Versioned docs
- Search plugins (TypeDoc has built-in search)
