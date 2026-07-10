# tsqtsq for Jsonnet

A hand-written Jsonnet port of the [tsqtsq](https://github.com/grafana/tsqtsq)
PromQL query library, primarily intended for
[monitoring mixins](https://monitoring.mixins.dev/) and other jsonnet-based
dashboard/alert pipelines.

The API mirrors the TypeScript API one-to-one: every function takes a single
params object with the same field names as the TypeScript types, and returns a
plain string. Consumer code looks nearly identical in both languages, so the
same mental model (and documentation) applies everywhere.

Behavioural equivalence with the TypeScript implementation is enforced in CI
by replaying the conformance corpus in [`../spec/fixtures/`](../spec/fixtures/),
which is generated from the TypeScript jest suite. See
[Keeping implementations in sync](#keeping-implementations-in-sync).

## Install

```console
jb install https://github.com/grafana/tsqtsq/jsonnet@main
```

## Usage

```jsonnet
local tsqtsq = import 'github.com/grafana/tsqtsq/jsonnet/promql.libsonnet';
local promql = tsqtsq.promql;

// sum by (foo, bar, baz) (test_metric{foo="bar"})
promql.sum({ expr: 'test_metric{foo="bar"}', by: ['foo', 'bar', 'baz'] })
```

`Expression` composes reusable metric selectors, exactly like the TypeScript
class:

```jsonnet
local tsqtsq = import 'github.com/grafana/tsqtsq/jsonnet/promql.libsonnet';

// test_metric{baz!="", arg1=~"foo", arg2=~"bar"}
tsqtsq.Expression({
  metric: 'test_metric',
  values: {
    arg1: 'foo',
    arg2: 'bar',
  },
  defaultOperator: tsqtsq.MatchingOperator.regexMatch,
  defaultSelectors: [
    { label: 'baz', operator: tsqtsq.MatchingOperator.notEqual, value: '' },
  ],
}).toString()
```

Because jsonnet values are immutable, `setSelector()` returns a new expression
instead of mutating in place; chain it or reassign:

```jsonnet
expr.setSelector({ label: 'env', operator: tsqtsq.MatchingOperator.equal, value: 'prod' }).toString()
```

## Divergences from the TypeScript implementation

Jsonnet objects have no insertion order, so two ordering behaviours are
defined as deterministic spec decisions:

1. `Expression` applies `values` in lexicographic label order (TypeScript
   applies them in object insertion order). `defaultSelectors` keep their
   declared order and always precede value-only labels, as in TypeScript.
2. `promql.offset` emits units in canonical descending order
   (`y w d h m s ms`). PromQL requires descending order, so callers should
   already be passing units this way.

`prettify` is TypeScript-only (it wraps the lezer PromQL parser) and is not
part of this port.

## Keeping implementations in sync

TypeScript (`src/`) is the source of truth; development, testing and review
happen there, in TypeScript, with jest. The jsonnet port follows via a
recorded conformance corpus:

1. `pnpm run generate:fixtures` runs the real jest spec files with the public
   API wrapped in recording proxies, and writes every call the suite makes as
   a case in `spec/fixtures/conformance.json`.
2. `scripts/test-jsonnet.sh` replays every case against this port and fails on
   any mismatch (including cases that must raise errors).
3. CI regenerates the corpus and fails if the committed fixtures drift from
   TypeScript behaviour, then replays the corpus against this port.

So: a TypeScript behaviour change lands with regenerated fixtures (visible in
review as a fixtures diff), and CI refuses the change until this port matches.
