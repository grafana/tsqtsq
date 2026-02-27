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
