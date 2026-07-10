# CLAUDE.md

## Project Overview

tsqtsq is a TypeScript library for creating reusable, type-safe PromQL (Prometheus Query Language) queries. It returns plain strings for backward compatibility.

## Commands

- `pnpm run test` — Run all tests (Jest)
- `pnpm run test:watch` — Run tests in watch mode
- `pnpm run build` — Compile TypeScript to `dist/`
- `pnpm run deploy` — Build and publish to npm

## Architecture

- `src/index.ts` — Public API entry point (re-exports `promql`, `Expression`, `MatchingOperator`)
- `src/promql.ts` — Core query builder object with ~32 methods (aggregations, rates, labels, offsets, logical ops)
- `src/expression.ts` — `Expression` class for composable metric selectors
- `src/types.ts` — All TypeScript type/interface/enum definitions
- `src/utils.ts` — Utility functions (e.g., `buildOffsetString`)
- `jsonnet/promql.libsonnet` — Hand-written Jsonnet port of the same API (for monitoring mixins); kept in sync via the conformance corpus
- `spec/fixtures/conformance.json` — GENERATED conformance corpus (`pnpm run generate:fixtures`); never edit by hand
- `scripts/generate-fixtures.mjs` — Records public API calls made by the jest suite into the conformance corpus
- `scripts/test-jsonnet.sh` — Replays the conformance corpus against the Jsonnet port (needs go-jsonnet + jq)

When changing `src/promql.ts`, `src/expression.ts` or `src/utils.ts` behaviour: update the jest specs, run `pnpm run generate:fixtures`, commit the fixtures diff, and mirror the change in `jsonnet/promql.libsonnet` (CI enforces all of this).

## Code Conventions

- **Formatting**: Prettier — 120 char lines, single quotes, trailing commas (ES5), semicolons, 2-space indent
- **Naming**: camelCase for variables/functions, snake_case for PromQL function names (e.g., `sum_over_time`), PascalCase for classes/enums
- **Parameters**: Named object parameters (destructured), not positional args
- **Defaults**: Grafana template variables as defaults (`$__rate_interval`, `$__range`)
- **Types**: Strict TypeScript enabled; all functions fully typed, all return strings

## Testing

- Framework: Jest 30 with ts-jest
- Pattern: `src/**/*.spec.ts`
- Style: Parameterized tests using `it.each()` mapping inputs to expected PromQL strings
- No mocking — pure unit tests of string generation
- Always add tests for new features

## CI

- GitHub Actions on push to `main` and all PRs
- Node 24, runs `pnpm install --frozen-lockfile && pnpm run test`

## License

AGPL-3.0-only
