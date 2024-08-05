import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#rate
describe('Functions: rate', () => {
  it.each([
    {
      actual: () => promql.rate({ expr: 'foo{bar="baz"}', interval: '5m' }),
      expected: 'rate(foo{bar="baz"}[5m])',
    },
  ])('Generate PromQL rate qyert: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
