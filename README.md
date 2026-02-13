# tsqtsq - A PromQL Query Library

`tsqtsq` aims to make hard-coded PromQL queries easier to read and maintain. Wide-ranging changes and common "query snippets" have varying approaches and often impact query readability. By introducing typed, templated queries, changing common expressions and debugging becomes much easier.

Consider the following use cases:

- Implement de-duplication of all existing queries
- Establish patterns for writing new queries
- Create reusable snippets that accept arguments for metric labels

The library in this directory is an effort to reduce the potential toil involved in refactoring tasks like those mentioned above.

## Principles

- Maintain "backwards compatibilty" by returning PromQL queries as a simple `string` - just like the string literals and template strings we used before.
- Re-usability of "query snippets" is a priority.
- Avoid verbose library usage and syntax wherever possible, prefer ease of use over type purity.
- Aim to make metrics and labels "discoverable" through IntelliSense, to aid query writing in the editor.
- Embed "sensible defaults" and tribal knowledge using query abstraction - e.g. using `container!=""` as a default matcher for requests/limits but only if the `container` label is not passed a value (this avoids matching against the confusing pod-level cgroup metrics).
- Prefer named object/property parameters over ordered/implicit arguments - because who can remember whether the labels or the query comes first.

## Examples

```ts
import { promql, Expression } from 'tsqtsq';
```

`sum`

```ts
promql.sum({ expr: 'test_metric{foo="bar"}', by: ['foo', 'bar', 'baz'] });
```

becomes

```
sum by (foo, bar, baz) (test_metric{foo="bar"})
```

`rate`

```ts
promql.rate({ expr: 'test_metric{bar="baz"}', interval: '5m' });
```

becomes

```
test_metric(foo{bar="baz"}[5m])
```

`label manipulation`

```ts
promql.label_replace({ expr: 'test_metric{foo="bar"}', newLabel: 'baz', existingLabel: 'foo' });
```

becomes

```
label_replace(test_metric{foo="bar"}, "baz", "$1", "foo", "(.*)")
```

`aggregation over time`

```ts
promql.sum_over_time({ expr: 'test_metric{foo="bar"}' });
```

becomes

```
sum_over_time((test_metric{foo="bar"})[$__range:])
```

`simple offset`

```ts
promql.offset({ units: { d: 42 } });
```

becomes

```
offset 42d
```

`complex offset`

```ts
promql.offset({ units: { y: 2, d: 1, h: 42, m: 2, s: 3 } });
```

becomes

```
offset 2y1d42h2m3s
```

### Using the `Expression` class

The `Expression` class can be used to compose reusable PromQL expressions to be further used with the `promql` library.

```ts
new Expression({
  metric: 'test_metric',
  values: {
    arg1: 'foo',
    arg2: 'bar'
  },
  defaultOperator: MatchingOperator.regexMatch,
  defaultSelectors: [{ label: 'baz', operator: MatchingOperator.notEqual, value: '' }],
}).toString(),
```

becomes

```
test_metric{baz!="", arg1=~"foo", arg2=~"bar"}
```

which can then be used with a `promql` method

```ts
promql.max({
  by: 'baz',
  expr: new Expression({
    metric: 'test_metric',
    values: {
      arg1: 'foo',
      arg2: 'bar',
    },
    defaultOperator: MatchingOperator.regexMatch,
    defaultSelectors: [{ label: 'baz', operator: MatchingOperator.notEqual, value: '' }],
  }).toString(),
});
```

becomes

```
max by (baz) (test_metric{baz!="", arg1=~"foo", arg2=~"bar"})
```

see [promql.ts](./src/promql.ts) for all available methods.

## Grafana Asserts Entity Builder

The `asserts` module provides a type-safe API for defining entities and relationships for the Grafana Asserts Knowledge Graph system. This enables programmatic generation of entity definitions with IDE autocomplete support and compile-time validation.

### Features

- **Type-safe entity and relationship definitions** - Define entities as TypeScript classes with strong typing
- **Automatic matcher inference** - Entity matchers are automatically generated from entity configuration
- **Integration with promql** - Use existing `promql` functions and `Expression` class for queries
- **YAML serialization** - Export definitions to YAML format compatible with asserts-yoda
- **Helper utilities** - Common patterns for scope, aggregations, and filtering
- **Fluent API** - Method chaining for readable, declarative code

### Quick Example

```ts
import { asserts, promql } from 'tsqtsq';

// Define a Kafka Topic entity
const topicEntity = new asserts.TopicEntity()
  .withScope(asserts.createStandardScope())
  .definedBy({
    query: promql.group({
      expr: asserts.createAssertsExpression('kafka_topic_partitions', { topic: '.*' }).toString(),
      by: ['topic', 'asserts_env', 'asserts_site'],
    }),
    labelValues: { name: 'topic' },
    literals: { service_type: 'kafka' },
  });

// Define a Service entity
const serviceEntity = new asserts.ServiceEntity()
  .withScope(asserts.createStandardScope())
  .definedBy({
    query: promql.group({
      expr: asserts.createAssertsExpression('up', { job: '.*' }).toString(),
      by: ['job', 'asserts_env', 'asserts_site'],
    }),
    labelValues: { name: 'job' },
  });

// Create a type-safe PRODUCES relationship
const relationship = asserts.produces(serviceEntity, topicEntity)
  .withPattern(
    asserts.sumByWithScope('kafka_producer_topic_record_send_total', ['job', 'topic'])
  );

// Build and serialize to YAML
const schema = asserts.createSchema(['kafka_server_jmx'])
  .addEntity(topicEntity)
  .addEntity(serviceEntity)
  .addRelationship(relationship);

console.log(schema.toYAML());
```

### Available Entity Types

- `ServiceEntity` - Services, workloads, or jobs
- `ServiceInstanceEntity` - Individual service instances
- `TopicEntity` - Message queue topics (Kafka, Pulsar, etc.)
- `DatabaseEntity` - Databases
- `QueueEntity` - Message queues
- `NodeEntity` - Compute nodes or hosts
- `PodEntity` - Kubernetes pods
- `NamespaceEntity` - Kubernetes namespaces
- `EnvEntity` - Environments (dev, staging, prod)
- `SiteEntity` - Sites or clusters

### Relationship Factory Functions

- `produces(start, end)` - Service produces messages to a topic
- `consumes(start, end)` - Service consumes messages from a topic
- `dependsOn(start, end)` - Service depends on another entity
- `calls(start, end)` - Service calls another service
- `runsOn(start, end)` - Service runs on a node
- `createRelationship(type, start, end)` - Create custom relationship type

### Helper Utilities

```ts
// Create standard env/site scope
asserts.createStandardScope()
// Returns: { env: 'asserts_env', site: 'asserts_site' }

// Create expression with asserts_env filter
asserts.createAssertsExpression('metric_name', { label: 'value' })
// Returns: Expression for metric_name{asserts_env!="", label=~"value"}

// Group by with scope dimensions
asserts.groupByWithScope('up{job!=""}', ['job'])
// Returns: group by (job, asserts_env, asserts_site) (up{job!=""})

// Sum by with scope dimensions
asserts.sumByWithScope('kafka_producer_total', ['job', 'topic'])
// Returns: sum by (job, topic, asserts_env, asserts_site) (kafka_producer_total)
```

### Examples

See the [examples directory](./src/asserts/examples) for complete working examples:

- [kafka-example.ts](./src/asserts/examples/kafka-example.ts) - Kafka topics and producer/consumer relationships
- [redis-example.ts](./src/asserts/examples/redis-example.ts) - Redis database entities and dependencies
- [kubernetes-example.ts](./src/asserts/examples/kubernetes-example.ts) - Kubernetes pods, nodes, and namespaces

### API Documentation

For detailed API documentation, see the inline JSDoc comments in the source code or explore the [asserts module](./src/asserts).
