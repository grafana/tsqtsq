# TypeDoc + GitHub Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auto-generated API docs with hand-written guides, deployed to GitHub Pages via GitHub Actions.

**Architecture:** TypeDoc reads `src/index.ts` exports and generates HTML docs. Custom markdown guides live in `docs-src/` and are included via `projectDocuments`. A GitHub Actions workflow builds and deploys to Pages on push to `main`.

**Tech Stack:** TypeDoc 0.28.x, GitHub Actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`)

---

### Task 1: Install TypeDoc and add npm script

**Files:**
- Modify: `package.json`

**Step 1: Install typedoc**

Run: `npm install --save-dev typedoc`

**Step 2: Add docs script to package.json**

In the `"scripts"` section of `package.json`, add:
```json
"docs": "typedoc"
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add typedoc dependency and docs script"
```

---

### Task 2: Configure TypeDoc

**Files:**
- Create: `typedoc.json`

**Step 1: Create typedoc.json**

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "name": "tsqtsq",
  "projectDocuments": ["docs-src/*.md"],
  "includeVersion": true,
  "excludePrivate": true,
  "excludeInternal": true
}
```

**Step 2: Add docs/ to .gitignore**

Append to `.gitignore`:
```
# TypeDoc generated docs
docs/
!docs/plans/
```

Note: `!docs/plans/` ensures the design docs we already committed remain tracked.

**Step 3: Verify TypeDoc generates docs**

Run: `npx typedoc`
Expected: TypeDoc outputs HTML to `docs/` with no errors. Open `docs/index.html` in a browser to verify.

**Step 4: Commit**

```bash
git add typedoc.json .gitignore
git commit -m "chore: add typedoc configuration"
```

---

### Task 3: Add hand-written guide pages

**Files:**
- Create: `docs-src/getting-started.md`
- Create: `docs-src/examples.md`

**Step 1: Create docs-src/getting-started.md**

```markdown
# Getting Started

## Installation

```bash
npm install tsqtsq
```

## Basic Usage

Import the `promql` query builder and the `Expression` class:

```typescript
import { promql, Expression, MatchingOperator } from 'tsqtsq';
```

### Building expressions

Use `Expression` to create metric selectors with label matching:

```typescript
const expr = new Expression({
  metric: 'http_requests_total',
  values: { job: 'api-server', handler: '/api/v1/query' },
  defaultOperator: MatchingOperator.equal,
});

String(expr);
// => http_requests_total{job="api-server", handler="/api/v1/query"}
```

### Composing queries

Pass expressions into `promql` functions to build full PromQL queries:

```typescript
const expr = new Expression({
  metric: 'http_requests_total',
  values: { job: 'api-server' },
  defaultOperator: MatchingOperator.equal,
});

promql.rate({ expr: String(expr) });
// => rate(http_requests_total{job="api-server"}[$__rate_interval])

promql.sum({ expr: promql.rate({ expr: String(expr) }), by: ['handler'] });
// => sum by (handler) (rate(http_requests_total{job="api-server"}[$__rate_interval]))
```

All functions return plain strings, so they compose naturally.
```

**Step 2: Create docs-src/examples.md**

```markdown
# Examples

## Aggregations

```typescript
import { promql, Expression, MatchingOperator } from 'tsqtsq';

const cpu = new Expression({
  metric: 'node_cpu_seconds_total',
  values: { mode: 'idle' },
  defaultOperator: MatchingOperator.equal,
});

// Sum by instance
promql.sum({ expr: promql.rate({ expr: String(cpu) }), by: ['instance'] });
// => sum by (instance) (rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))

// Top 5 by CPU usage
promql.topk({ expr: promql.rate({ expr: String(cpu) }), parameter: 5 });
// => topk(5, rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))
```

## Aggregation Over Time

```typescript
promql.avg_over_time({ expr: 'up{job="prometheus"}' });
// => avg_over_time((up{job="prometheus"})[$__range:])
```

## Arithmetic Binary Operators

```typescript
promql.div({
  left: 'node_memory_MemAvailable_bytes',
  right: 'node_memory_MemTotal_bytes',
  on: ['instance'],
});
// => node_memory_MemAvailable_bytes / on (instance) node_memory_MemTotal_bytes
```

## Label Operations

```typescript
promql.label_replace({
  expr: 'up{job="api-server"}',
  newLabel: 'service',
  existingLabel: 'job',
});
// => label_replace(up{job="api-server"}, "service", "$1", "job", "(.*)")
```

## Offsets

```typescript
promql.offset({ units: { h: 1 } });
// => offset 1h

promql.offset({ units: { d: 7, h: 12 } });
// => offset 7d12h
```
```

**Step 3: Verify docs build with guide pages**

Run: `npx typedoc`
Expected: No errors. The generated site at `docs/index.html` now includes "Getting Started" and "Examples" pages in the navigation.

**Step 4: Commit**

```bash
git add docs-src/
git commit -m "docs: add getting started and examples guides"
```

---

### Task 4: Add GitHub Actions workflow for Pages deployment

**Files:**
- Create: `.github/workflows/docs.yml`

**Step 1: Create the workflow file**

```yaml
name: Deploy docs to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4

      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 24
          cache: npm

      - run: npm ci

      - run: npm run docs

      - uses: actions/configure-pages@983d7736d9b0ae728b81ab479565c72886d7745b # v5

      - uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3
        with:
          path: docs

      - id: deployment
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac2b3c603fc # v4
```

**Step 2: Commit**

```bash
git add .github/workflows/docs.yml
git commit -m "ci: add GitHub Pages deployment workflow for docs"
```

---

### Task 5: Improve JSDoc coverage on public API

**Files:**
- Modify: `src/types.ts`
- Modify: `src/promql.ts`
- Modify: `src/expression.ts`

TypeDoc generates better docs when exports have JSDoc comments. Add short descriptions to the main public surface. Focus on types and the `promql` object — these are what users look up.

**Step 1: Add JSDoc to types.ts**

Add a comment above each exported type/interface/enum that doesn't already have one. For example:

- `MatchingOperator` — describe the enum
- `LabelSelector` — describe the type
- `AggregateOverTime` — describe the type
- `Offset`, `OffsetUnits` — describe the types
- `Rate`, `Increase` — describe the types
- `LabelReplace`, `LabelJoin` — describe the types
- `ArithmeticBinaryOpParams` — already has field-level JSDoc, add a type-level description

Keep each comment to one line (e.g., `/** PromQL label matching operators (=, !=, =~, !~). */`).

**Step 2: Add JSDoc to promql.ts**

Add a top-level `/** ... */` comment above `export const promql` describing the query builder object. Add short JSDoc comments to the main method categories:
- Above the `x_over_time` helper
- Above the aggregation methods (`sum`, `avg`, etc.)
- Above `rate` and `increase`
- Above `label_replace` and `label_join`
- Above `arithmeticBinaryOp`

**Step 3: Add JSDoc to expression.ts**

Add a class-level JSDoc comment on `Expression` describing what it does (composable metric selector with label matching).

**Step 4: Verify docs look good**

Run: `npx typedoc`
Expected: No warnings about missing documentation. Open `docs/index.html` and verify the API reference pages show descriptions.

**Step 5: Commit**

```bash
git add src/types.ts src/promql.ts src/expression.ts
git commit -m "docs: add JSDoc comments to public API for TypeDoc"
```

---

### Task 6: Run tests and verify everything works

**Step 1: Run tests**

Run: `npm test`
Expected: All tests pass. Adding JSDoc and config files should not break anything.

**Step 2: Final docs build**

Run: `npx typedoc`
Expected: Clean build, no errors or warnings. Site looks complete with API reference + guide pages.
