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
