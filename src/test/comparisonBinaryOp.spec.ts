import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/operators/#comparison-binary-operators
// https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching
//
// Comparison ops currently delegate to the same helper as the arithmetic/logical ops, but they
// must keep honoring the full vector-matching contract on their own merit. So this file asserts
// that contract directly against the comparison ops instead of trusting it to hold transitively.
describe('Operators: Comparison Binary Ops', () => {
  it.each([
    // Basic operators
    {
      actual: () => promql.eq({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a == metric_b',
    },
    {
      actual: () => promql.neq({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a != metric_b',
    },
    {
      actual: () => promql.gt({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a > metric_b',
    },
    {
      actual: () => promql.lt({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a < metric_b',
    },
    {
      actual: () => promql.gte({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a >= metric_b',
    },
    {
      actual: () => promql.lte({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a <= metric_b',
    },

    // bool modifier
    {
      actual: () => promql.eq({ left: 'metric_a', right: '1', bool: true }),
      expected: 'metric_a == bool 1',
    },
    {
      actual: () => promql.neq({ left: 'metric_a', right: '0', bool: true }),
      expected: 'metric_a != bool 0',
    },
    {
      actual: () => promql.gt({ left: 'metric_a', right: '0', bool: true }),
      expected: 'metric_a > bool 0',
    },
    {
      actual: () => promql.lt({ left: 'metric_a', right: '0', bool: true }),
      expected: 'metric_a < bool 0',
    },
    {
      actual: () => promql.gte({ left: 'metric_a', right: '1', bool: true }),
      expected: 'metric_a >= bool 1',
    },
    {
      actual: () => promql.lte({ left: 'metric_a', right: '2', bool: true }),
      expected: 'metric_a <= bool 2',
    },
    // bool: false must not emit the modifier
    {
      actual: () => promql.gt({ left: 'metric_a', right: '0', bool: false }),
      expected: 'metric_a > 0',
    },

    // on matching
    {
      actual: () => promql.gt({ left: 'metric_a', right: 'metric_b', on: ['instance'] }),
      expected: 'metric_a > on (instance) metric_b',
    },
    {
      actual: () => promql.lt({ left: 'metric_a', right: 'metric_b', on: ['instance', 'job'] }),
      expected: 'metric_a < on (instance, job) metric_b',
    },

    // ignoring matching
    {
      actual: () => promql.gte({ left: 'metric_a', right: 'metric_b', ignoring: ['job'] }),
      expected: 'metric_a >= ignoring (job) metric_b',
    },
    {
      actual: () => promql.lte({ left: 'metric_a', right: 'metric_b', ignoring: ['job', 'env'] }),
      expected: 'metric_a <= ignoring (job, env) metric_b',
    },

    // on wins over ignoring when both provided
    {
      actual: () => promql.eq({ left: 'metric_a', right: 'metric_b', on: ['instance'], ignoring: ['job'] }),
      expected: 'metric_a == on (instance) metric_b',
    },

    // bool sits between the operator and the matching clause
    {
      actual: () => promql.eq({ left: 'metric_a', right: 'metric_b', bool: true, on: ['instance'] }),
      expected: 'metric_a == bool on (instance) metric_b',
    },
    {
      actual: () => promql.gte({ left: 'metric_a', right: 'metric_b', bool: true, ignoring: ['job', 'env'] }),
      expected: 'metric_a >= bool ignoring (job, env) metric_b',
    },

    // group_left without labels
    {
      actual: () => promql.gt({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: [] }),
      expected: 'metric_a > on (instance) group_left() metric_b',
    },

    // group_left with labels
    {
      actual: () => promql.gt({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job'] }),
      expected: 'metric_a > on (instance) group_left (job) metric_b',
    },
    {
      actual: () => promql.lt({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job', 'env'] }),
      expected: 'metric_a < on (instance) group_left (job, env) metric_b',
    },

    // group_left() with right-hand side starting with ( — regression: bare group_left would cause PromQL parser ambiguity
    {
      actual: () =>
        promql.gte({
          left: 'kube_pod_info',
          right: '(k8s_pod_phase{phase="Running"} <= bool 2)',
          on: ['pod', 'namespace'],
          groupLeft: [],
        }),
      expected: 'kube_pod_info >= on (pod, namespace) group_left() (k8s_pod_phase{phase="Running"} <= bool 2)',
    },

    // group_right without labels
    {
      actual: () => promql.lt({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupRight: [] }),
      expected: 'metric_a < on (instance) group_right() metric_b',
    },

    // group_right() with right-hand side starting with ( — regression: bare group_right would cause PromQL parser ambiguity
    {
      actual: () =>
        promql.lte({
          left: 'kube_pod_info',
          right: '(k8s_pod_phase{phase="Running"} <= bool 2)',
          on: ['pod', 'namespace'],
          groupRight: [],
        }),
      expected: 'kube_pod_info <= on (pod, namespace) group_right() (k8s_pod_phase{phase="Running"} <= bool 2)',
    },

    // group_right with labels
    {
      actual: () => promql.neq({ left: 'metric_a', right: 'metric_b', ignoring: ['job'], groupRight: ['env'] }),
      expected: 'metric_a != ignoring (job) group_right (env) metric_b',
    },

    // groupLeft wins over groupRight when both provided
    {
      actual: () =>
        promql.gt({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job'], groupRight: ['env'] }),
      expected: 'metric_a > on (instance) group_left (job) metric_b',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });

  it('throws when group_left is used without on/ignoring', () => {
    expect(() => promql.gt({ left: 'a', right: 'b', groupLeft: [] })).toThrow(
      'group_left/group_right require an "on" or "ignoring" clause'
    );
  });

  it('throws when group_right is used without on/ignoring', () => {
    expect(() => promql.lt({ left: 'a', right: 'b', groupRight: ['job'] })).toThrow(
      'group_left/group_right require an "on" or "ignoring" clause'
    );
  });
});
