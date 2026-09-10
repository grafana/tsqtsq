import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile
describe('Functions: histogram', () => {
  const histogramExpr = 'rate(http_request_duration_seconds[5m])';

  it.each([
    {
      actual: () => promql.histogram_quantile({ expr: histogramExpr, quantile: 0.99 }),
      expected: 'histogram_quantile(0.99, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_quantile({ expr: histogramExpr, quantile: '0.999999' }),
      expected: 'histogram_quantile(0.999999, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_fraction({ expr: histogramExpr, lower: 0.1, upper: 0.9 }),
      expected: 'histogram_fraction(0.1, 0.9, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_fraction({ expr: histogramExpr, lower: '-Inf', upper: 0 }),
      expected: 'histogram_fraction(-Inf, 0, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_fraction({ expr: histogramExpr, lower: 0, upper: '+Inf' }),
      expected: 'histogram_fraction(0, +Inf, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_fraction({ expr: histogramExpr, lower: '-Inf', upper: '+Inf' }),
      expected: 'histogram_fraction(-Inf, +Inf, rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_avg({ expr: histogramExpr }),
      expected: 'histogram_avg(rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_sum({ expr: histogramExpr }),
      expected: 'histogram_sum(rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_count({ expr: histogramExpr }),
      expected: 'histogram_count(rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_stddev({ expr: histogramExpr }),
      expected: 'histogram_stddev(rate(http_request_duration_seconds[5m]))',
    },
    {
      actual: () => promql.histogram_stdvar({ expr: histogramExpr }),
      expected: 'histogram_stdvar(rate(http_request_duration_seconds[5m]))',
    },
  ])('Generate PromQL histogram query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
