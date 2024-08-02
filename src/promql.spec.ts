import { promql } from './promql';

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
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}' }),
      expected: 'sum(test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', without: 'foo' }),
      expected: 'sum without (foo) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', by: 'foo' }),
      expected: 'sum by (foo) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', without: 'foo', by: 'bar' }),
      expected: 'sum by (bar) (test_metric{foo="bar"})',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});

// https://prometheus.io/docs/prometheus/latest/querying/functions/#aggregation_over_time
describe('Functions: Aggregation over time', () => {
  it.each([
    {
      actual: () => promql.avg_over_time(''),
      expected: 'avg_over_time(()[$__range:])',
    },
    {
      actual: () => promql.count_over_time(''),
      expected: 'count_over_time(()[$__range:])',
    },
    {
      actual: () => promql.last_over_time(''),
      expected: 'last_over_time(()[$__range:])',
    },
    {
      actual: () => promql.max_over_time(''),
      expected: 'max_over_time(()[$__range:])',
    },
    {
      actual: () => promql.min_over_time(''),
      expected: 'min_over_time(()[$__range:])',
    },
    {
      actual: () => promql.present_over_time(''),
      expected: 'present_over_time(()[$__range:])',
    },
    {
      actual: () => promql.stddev_over_time(''),
      expected: 'stddev_over_time(()[$__range:])',
    },
    {
      actual: () => promql.stdvar_over_time(''),
      expected: 'stdvar_over_time(()[$__range:])',
    },
    {
      actual: () => promql.sum_over_time(''),
      expected: 'sum_over_time(()[$__range:])',
    },
    {
      actual: () => promql.sum_over_time('test_metric{foo="bar"}'),
      expected: 'sum_over_time((test_metric{foo="bar"})[$__range:])',
    },
    {
      actual: () => promql.sum_over_time('test_metric{foo="bar"}', '1h'),
      expected: 'sum_over_time((test_metric{foo="bar"})[1h:])',
    },
    {
      actual: () => promql.sum_over_time('test_metric{foo="bar"}', '1h', '1m'),
      expected: 'sum_over_time((test_metric{foo="bar"})[1h:1m])',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});

// https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier
describe('Basics: offset modifier', () => {
  it.each([
    {
      actual: () => promql.offset(),
      expected: '',
    },
    {
      actual: () => promql.offset(42),
      expected: 'offset 42d',
    },
    {
      actual: () => promql.offset(42, 'h'),
      expected: 'offset 42h',
    },
  ])('Generate PromQL offset modifier: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
