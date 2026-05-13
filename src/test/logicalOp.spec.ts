import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/operators/#logical-set-binary-operators
// Vector matching behavior (on/ignoring, precedence, empty arrays, composability) is fully
// covered in arithmeticBinaryOp.spec.ts since and/or/unless delegate to the same helper.
describe('Operators: Logical Set Binary Ops', () => {
  it.each([
    {
      actual: () => promql.and({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a and metric_b',
    },
    {
      actual: () => promql.or({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a or metric_b',
    },
    {
      actual: () => promql.unless({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a unless metric_b',
    },
    // Sanity check that vector matching flows through to logical ops
    {
      actual: () => promql.or({ left: 'metric_a', right: 'metric_b', on: ['cluster', 'namespace'] }),
      expected: 'metric_a or on (cluster, namespace) metric_b',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
