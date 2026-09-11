import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/functions/#clamp
describe('Functions: clamp', () => {
  it.each([
    {
      actual: () => promql.clamp_min({ expr: 'foo{bar="baz"}', min: 0 }),
      expected: 'clamp_min(foo{bar="baz"}, 0)',
    },
    {
      actual: () => promql.clamp_min({ expr: 'foo{bar="baz"}', min: '$min' }),
      expected: 'clamp_min(foo{bar="baz"}, $min)',
    },
    {
      actual: () => promql.clamp_max({ expr: 'foo{bar="baz"}', max: 100 }),
      expected: 'clamp_max(foo{bar="baz"}, 100)',
    },
    {
      actual: () => promql.clamp_max({ expr: 'foo{bar="baz"}', max: '$max' }),
      expected: 'clamp_max(foo{bar="baz"}, $max)',
    },
    {
      actual: () => promql.clamp({ expr: 'foo{bar="baz"}', min: -10, max: 100 }),
      expected: 'clamp(foo{bar="baz"}, -10, 100)',
    },
    {
      actual: () => promql.clamp({ expr: 'foo{bar="baz"}', min: '$min', max: '$max' }),
      expected: 'clamp(foo{bar="baz"}, $min, $max)',
    },
    {
      actual: () => promql.clamp({ expr: 'foo{bar="baz"}', min: '0', max: 'NaN' }),
      expected: 'clamp(foo{bar="baz"}, 0, NaN)',
    },
    {
      actual: () => promql.clamp({ expr: 'foo{bar="baz"}', min: 0.001, max: 0.1 }),
      expected: 'clamp(foo{bar="baz"}, 0.001, 0.1)',
    },
  ])('Generate PromQL clamp query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
