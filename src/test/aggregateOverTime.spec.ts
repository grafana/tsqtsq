import { promql } from '../promql';

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
