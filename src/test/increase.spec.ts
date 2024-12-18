import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#increase
describe('Functions: increase', () => {
  it.each([
    {
      actual: () => promql.increase({ expr: 'foo{bar="baz"}'}),
      expected: 'increase(foo{bar="baz"}[$__range])',
    },
    {
      actual: () => promql.increase({ expr: 'foo{bar="baz"}', interval: '5m' }),
      expected: 'increase(foo{bar="baz"}[5m])',
    },
  ])('Generate PromQL increase query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
