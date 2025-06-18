import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators
describe('Operators: Aggregations', () => {
  it.each([
    {
      actual: () => promql.sum({ expr: '' }),
      expected: 'sum()',
    },
    {
      actual: () => promql.min({ expr: '' }),
      expected: 'min()',
    },
    {
      actual: () => promql.max({ expr: '' }),
      expected: 'max()',
    },
    {
      actual: () => promql.avg({ expr: '' }),
      expected: 'avg()',
    },
    {
      actual: () => promql.group({ expr: '' }),
      expected: 'group()',
    },
    {
      actual: () => promql.count({ expr: '' }),
      expected: 'count()',
    },
    {
      actual: () => promql.stddev({ expr: '' }),
      expected: 'stddev()',
    },
    {
      actual: () => promql.stdvar({ expr: '' }),
      expected: 'stdvar()',
    },
    {
      actual: () => promql.count_values({ parameter: 1, expr: '' }),
      expected: 'count_values(1, )',
    },
    {
      actual: () => promql.count_values({ parameter: '$limit', expr: '' }),
      expected: 'count_values($limit, )',
    },
    {
      actual: () => promql.bottomk({ parameter: 1, expr: '' }),
      expected: 'bottomk(1, )',
    },
    {
      actual: () => promql.bottomk({ parameter: '$limit', expr: '' }),
      expected: 'bottomk($limit, )',
    },
    {
      actual: () => promql.topk({ parameter: 1, expr: '' }),
      expected: 'topk(1, )',
    },
    {
      actual: () => promql.topk({ parameter: '$limit', expr: '' }),
      expected: 'topk($limit, )',
    },
    {
      actual: () => promql.quantile({ parameter: 1, expr: '' }),
      expected: 'quantile(1, )',
    },
    {
      actual: () => promql.quantile({ parameter: '$limit', expr: '' }),
      expected: 'quantile($limit, )',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}' }),
      expected: 'sum(test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', without: ['foo'] }),
      expected: 'sum without (foo) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', by: ['foo', 'bar', 'baz'] }),
      expected: 'sum by (foo, bar, baz) (test_metric{foo="bar"})',
    },
    {
      actual: () =>
        promql.sum({
          expr: 'test_metric{foo="bar"}',
          without: ['foo'],
          by: ['bar'],
        }),
      expected: 'sum by (bar) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.stddev({ expr: 'test_metric{foo="bar"}' }),
      expected: 'stddev(test_metric{foo="bar"})',
    },
    {
      actual: () => promql.stddev({ expr: 'test_metric{foo="bar"}', by: ['foo'] }),
      expected: 'stddev by (foo) (test_metric{foo="bar"})',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
