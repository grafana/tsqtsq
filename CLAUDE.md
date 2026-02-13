# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

tsqtsq is a TypeScript library for composing type-safe, readable PromQL (Prometheus Query Language) queries. The library wraps PromQL functions with TypeScript types while maintaining backwards compatibility by always returning plain strings.

## Development Commands

Build:
```bash
npm run build  # or: tsc
```

Testing:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
jest                    # Direct jest invocation
jest src/test/rate.spec.ts  # Run single test file
```

## Architecture

### Core Components

**src/promql.ts** (72 lines)
- Default export: single `promql` object containing all PromQL query builder methods
- Functions are organized into groups: aggregation (`sum`, `max`), aggregation over time (`sum_over_time`, `avg_over_time`), rate functions (`rate`, `increase`), label manipulation (`label_replace`, `label_join`), and logical operators (`and`, `or`, `unless`)
- All functions accept named parameter objects and return plain strings
- Helper functions: `by()`, `without()`, `byOrWithout()` for aggregation clauses
- Core pattern: `x_over_time()` is a shared implementation for all `*_over_time` functions

**src/expression.ts**
- `Expression` class for building reusable metric expressions with label selectors
- Constructor accepts: `metric` name, `values` object for labels, `defaultOperator` (MatchingOperator enum), optional `defaultSelectors`
- Internally uses a `Map<string, LabelSelector[]>` to track selectors per label (supports multiple selectors per label)
- `setSelector()` method adds selectors; `toString()` generates the final PromQL string
- Default selectors are applied first, then overridden by explicit values

**src/types.ts**
- Type definitions for all parameter objects used by promql methods
- `MatchingOperator` enum: `=`, `!=`, `=~`, `!~`
- Key types: `AggregationParams`, `AggregateWithParameter`, `AggregateOverTime`, `Rate`, `Increase`, `LabelReplace`, `LabelJoin`, `Offset`, `OffsetUnits`

**src/utils.ts**
- `buildOffsetString()`: Converts `OffsetUnits` object to PromQL offset string (e.g., `{y: 2, d: 1, h: 42}` → `"offset 2y1d42h2m3s"`)

**src/index.ts**
- Entry point that exports: `promql`, `Expression`, `MatchingOperator`, `asserts` module

### Asserts Module Components

The `src/asserts/` directory contains the Grafana Asserts Entity Builder - a type-safe API for defining entities and relationships for the Grafana Asserts Knowledge Graph system.

**src/asserts/types.ts**
- Core interfaces: `Entity`, `Relationship`
- Type definitions: `DiscoverySource` enum, `ScopeDimension`, `EntityMatcher`, `PropertyRuleDefinition`, `RelationshipProperties`
- `DiscoverySource`: AGGREGATION or SAMPLES for relationship discovery

**src/asserts/base-entity.ts**
- `BaseEntity` abstract class implementing `Entity` interface
- Methods: `definedBy()`, `enrichedBy()`, `withScope()`, `withLookup()`
- Key feature: `getEntityMatchers()` auto-generates matchers from entity's name and scope (DRY principle)
- Handles both single label names and pipe-separated alternatives (e.g., "workload | service | job")

**src/asserts/entities/index.ts**
- Concrete entity classes extending `BaseEntity`:
  - `ServiceEntity` (name: "workload | service | job")
  - `ServiceInstanceEntity` (name: "instance")
  - `TopicEntity` (name: "topic") - for Kafka, Pulsar, etc.
  - `DatabaseEntity` (name: "database | db | datname")
  - `QueueEntity` (name: "queue")
  - `NodeEntity` (name: "node | instance")
  - `PodEntity` (name: "pod")
  - `NamespaceEntity` (name: "namespace")
  - `EnvEntity` (name: "env | asserts_env")
  - `SiteEntity` (name: "site | cluster | asserts_site")
- Each class pre-configures standard name labels and scope for that entity type

**src/asserts/base-relationship.ts**
- `BaseRelationship<TStart, TEnd>` generic class implementing `Relationship` interface
- Constructor auto-infers `startEntityMatchers` and `endEntityMatchers` from entities (calls `getEntityMatchers()`)
- Methods: `withPattern()`, `withStaticProperties()`, `withStartEntityMatchers()`, `withEndEntityMatchers()`
- Override methods only needed if auto-inference is insufficient

**src/asserts/relationships/index.ts**
- Typed relationship factory functions:
  - `produces<TStart>(start, end: TopicEntity)` - PRODUCES relationship
  - `consumes<TEnd>(start: TopicEntity, end)` - CONSUMES relationship
  - `dependsOn<TStart, TEnd>(start, end)` - DEPENDS_ON relationship
  - `calls<TStart, TEnd>(start, end)` - CALLS relationship
  - `runsOn<TStart, TEnd>(start, end)` - RUNS_ON relationship
  - `createRelationship<TStart, TEnd>(type, start, end, source)` - Generic relationship creator

**src/asserts/property-rule.ts**
- `PropertyRule` class for building discovery/enrichment rules
- Fluent API: `withQuery()`, `withLabelValues()`, `withLiterals()`, `withMetricValue()`
- Accepts both `string` and `Expression` for queries
- Factory: `createPropertyRule(definition?)`

**src/asserts/schema.ts**
- `AssertsSchema` container class for entities and relationships
- Methods: `addEntity()`, `addEntities()`, `addRelationship()`, `addRelationships()`
- `toObject()`: Converts to plain JavaScript object
- `toYAML()`: Serializes to YAML using js-yaml library
- Supports optional `when` field for exporter activation conditions
- Factory: `createSchema(when?: string[])`

**src/asserts/scope.ts**
- Helper utilities for common patterns:
  - `createStandardScope()`: Returns `{ env: 'asserts_env', site: 'asserts_site' }`
  - `buildLabelNamePattern(...labels)`: Joins labels with " | " separator
  - `createAssertsExpression(metric, values?, operator?)`: Creates Expression with `asserts_env!=""` filter
  - `groupByWithScope(expr, labels, scope?)`: Group by with scope dimensions included
  - `countByPattern(expr, labels)`: Count by aggregation
  - `sumByWithScope(expr, labels, scope?)`: Sum by with scope dimensions included

**src/asserts/index.ts**
- Public API exports all types, classes, and utilities
- Exported via main `src/index.ts` as `asserts` namespace

**src/asserts/test/*.spec.ts**
- Test files: `base-entity.spec.ts`, `base-relationship.spec.ts`, `property-rule.spec.ts`, `schema.spec.ts`, `scope.spec.ts`
- 74 tests covering entity builder, relationship factory, YAML serialization, and helper utilities

**src/asserts/examples/*.ts**
- Working examples:
  - `kafka-example.ts`: Kafka topics and producer/consumer relationships
  - `redis-example.ts`: Redis database entities and service dependencies
  - `kubernetes-example.ts`: K8s pods, nodes, namespaces and relationships

#### Asserts Module Design Patterns

1. **Class-Based Entities**: Entities are TypeScript classes for strong typing and IDE support
2. **Automatic Matcher Inference**: Entity matchers auto-generated from entity config (single source of truth)
3. **Generic Type-Safe Relationships**: Compile-time validation of entity pairings
4. **Query Flexibility**: Accept both raw PromQL strings and `Expression` objects
5. **Two-Stage Serialization**: `toObject()` → `toYAML()` for testability
6. **Fluent API**: Method chaining for readable, declarative code

### Testing Pattern

Tests use Jest with `it.each` pattern:
```typescript
it.each([
  {
    actual: () => promql.rate({ expr: 'foo', interval: '5m' }),
    expected: 'rate(foo[5m])',
  },
])('Generate PromQL rate query: $expected', ({ actual, expected }) => {
  expect(actual()).toStrictEqual(expected);
});
```

Test files are in `src/test/*.spec.ts` (by category: `rate.spec.ts`, `aggregate.spec.ts`, `label.spec.ts`, etc.)

## Design Principles

- **String output**: All functions return plain PromQL strings for backwards compatibility
- **Named parameters**: Use object parameters instead of positional arguments for clarity
- **Type safety**: Leverage TypeScript and IntelliSense to make metrics/labels discoverable
- **Sensible defaults**: Embed best practices (e.g., `interval: '$__rate_interval'` for rate(), `range: '$__range'` for aggregations)
- **Composability**: `Expression` class enables building reusable query snippets

## Adding New PromQL Functions

1. Add type definition in `src/types.ts` (if parameters differ from existing types)
2. Add function to `promql` object in `src/promql.ts`
3. Create or update test file in `src/test/` using the `it.each` pattern
4. Run tests to verify output matches expected PromQL syntax

## Adding New Asserts Entities or Relationships

### Adding a New Entity Type

1. Create a new class in `src/asserts/entities/index.ts` extending `BaseEntity`
2. Set default name labels in the constructor (single string or array of alternatives)
3. Optionally set default scope in the constructor
4. Export the new class from `src/asserts/entities/index.ts`
5. Add export to `src/asserts/index.ts`
6. Add tests in `src/asserts/test/entities.spec.ts`

Example:
```typescript
export class CacheEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Cache', nameLabels || ['cache', 'cache_name']);
  }
}
```

### Adding a New Relationship Type

1. Create a typed factory function in `src/asserts/relationships/index.ts`
2. Use `ConcreteRelationship` class with appropriate generics
3. Set default `DiscoverySource` (AGGREGATION or SAMPLES)
4. Export the factory function
5. Add export to `src/asserts/index.ts`
6. Add tests in `src/asserts/test/base-relationship.spec.ts`

Example:
```typescript
export function stores<TStart extends Entity, TEnd extends Entity>(
  start: TStart,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TEnd> {
  return new ConcreteRelationship('STORES', start, end, source);
}
```

### Adding Helper Utilities

1. Add function to `src/asserts/scope.ts`
2. Keep functions pure and composable
3. Accept both `string` and `Expression` where appropriate
4. Export from `src/asserts/scope.ts` (already re-exported via `src/asserts/index.ts`)
5. Add tests in `src/asserts/test/scope.spec.ts`

Example:
```typescript
export function maxByWithScope(
  expr: string | Expression,
  additionalLabels: string[],
  scope: ScopeDimension = createStandardScope()
): string {
  const exprStr = typeof expr === 'string' ? expr : expr.toString();
  const scopeLabels = Object.values(scope);
  const allLabels = [...additionalLabels, ...scopeLabels];
  return promql.max({ expr: exprStr, by: allLabels });
}
```
