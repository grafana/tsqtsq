import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#aggregation_over_time
describe('Functions: Aggregation over time', () => {
  it.each([
    {
      actual: () => promql.avg_over_time({ expr: '' }),
      expected: 'avg_over_time(()[$__range:])',
    },
    {
      actual: () => promql.count_over_time({ expr: '' }),
      expected: 'count_over_time(()[$__range:])',
    },
    {
      actual: () => promql.last_over_time({ expr: '' }),
      expected: 'last_over_time(()[$__range:])',
    },
    {
      actual: () => promql.max_over_time({ expr: '' }),
      expected: 'max_over_time(()[$__range:])',
    },
    {
      actual: () => promql.min_over_time({ expr: '' }),
      expected: 'min_over_time(()[$__range:])',
    },
    {
      actual: () => promql.present_over_time({ expr: '' }),
      expected: 'present_over_time(()[$__range:])',
    },
    {
      actual: () => promql.stddev_over_time({ expr: '' }),
      expected: 'stddev_over_time(()[$__range:])',
    },
    {
      actual: () => promql.stdvar_over_time({ expr: '' }),
      expected: 'stdvar_over_time(()[$__range:])',
    },
    {
      actual: () => promql.sum_over_time({ expr: '' }),
      expected: 'sum_over_time(()[$__range:])',
    },
    {
      actual: () => promql.sum_over_time({ expr: 'test_metric{foo="bar"}' }),
      expected: 'sum_over_time((test_metric{foo="bar"})[$__range:])',
    },
    {
      actual: () => promql.sum_over_time({ expr: 'test_metric{foo="bar"}', range: '1h' }),
      expected: 'sum_over_time((test_metric{foo="bar"})[1h:])',
    },
    {
      actual: () => promql.sum_over_time({ expr: 'test_metric{foo="bar"}', range: '1h', interval: '1m' }),
      expected: 'sum_over_time((test_metric{foo="bar"})[1h:1m])',
    },
  ])('Generate PromQL query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
