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
