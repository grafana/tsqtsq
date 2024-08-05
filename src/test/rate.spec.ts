import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#rate
describe('Functions: rate', () => {
  it.each([
    {
      actual: () => promql.rate(''),
      expected: 'rate([$__rate_interval])',
    },
    {
      actual: () => promql.rate('foo{bar="baz"}', '5m'),
      expected: 'rate(foo{bar="baz"}[5m])',
    },
  ])('Generate PromQL rate qyert: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
