import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/operators/#arithmetic-binary-operators
// https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching
describe('Operators: Arithmetic Binary Ops with Vector Matching', () => {
  it.each([
    // Basic operators
    {
      actual: () => promql.add({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a + metric_b',
    },
    {
      actual: () => promql.sub({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a - metric_b',
    },
    {
      actual: () => promql.mul({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a * metric_b',
    },
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a / metric_b',
    },
    {
      actual: () => promql.mod({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a % metric_b',
    },
    {
      actual: () => promql.pow({ left: 'metric_a', right: 'metric_b' }),
      expected: 'metric_a ^ metric_b',
    },

    // on matching
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'] }),
      expected: 'metric_a / on (instance) metric_b',
    },
    {
      actual: () => promql.mul({ left: 'metric_a', right: 'metric_b', on: ['instance', 'job'] }),
      expected: 'metric_a * on (instance, job) metric_b',
    },

    // ignoring matching
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', ignoring: ['job'] }),
      expected: 'metric_a / ignoring (job) metric_b',
    },
    {
      actual: () => promql.sub({ left: 'metric_a', right: 'metric_b', ignoring: ['job', 'env'] }),
      expected: 'metric_a - ignoring (job, env) metric_b',
    },

    // on wins over ignoring when both provided
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'], ignoring: ['job'] }),
      expected: 'metric_a / on (instance) metric_b',
    },

    // group_left without labels
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: [] }),
      expected: 'metric_a / on (instance) group_left metric_b',
    },

    // group_left with labels
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job'] }),
      expected: 'metric_a / on (instance) group_left (job) metric_b',
    },
    {
      actual: () =>
        promql.mul({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job', 'env'] }),
      expected: 'metric_a * on (instance) group_left (job, env) metric_b',
    },

    // group_right without labels
    {
      actual: () => promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupRight: [] }),
      expected: 'metric_a / on (instance) group_right metric_b',
    },

    // group_right with labels
    {
      actual: () => promql.add({ left: 'metric_a', right: 'metric_b', ignoring: ['job'], groupRight: ['env'] }),
      expected: 'metric_a + ignoring (job) group_right (env) metric_b',
    },

    // groupLeft wins over groupRight when both provided
    {
      actual: () =>
        promql.div({ left: 'metric_a', right: 'metric_b', on: ['instance'], groupLeft: ['job'], groupRight: ['env'] }),
      expected: 'metric_a / on (instance) group_left (job) metric_b',
    },

    // Composable with other promql functions
    {
      actual: () =>
        promql.div({
          left: promql.rate({ expr: 'http_requests_total{code="200"}' }),
          right: promql.rate({ expr: 'http_requests_total' }),
          on: ['instance'],
          groupLeft: [],
        }),
      expected:
        'rate(http_requests_total{code="200"}[$__rate_interval]) / on (instance) group_left rate(http_requests_total[$__rate_interval])',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
