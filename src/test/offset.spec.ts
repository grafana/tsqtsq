import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier
describe('Basics: offset modifier', () => {
  it.each([
    {
      actual: () => promql.offset({ units: {} }),
      expected: '',
    },
    {
      actual: () => promql.offset({ units: { d: 42 } }),
      expected: 'offset 42d',
    },
    {
      actual: () => promql.offset({ units: { h: 42 } }),
      expected: 'offset 42h',
    },
    {
      actual: () => promql.offset({ units: { d: 1, h: 42 } }),
      expected: 'offset 1d42h',
    },
    {
      actual: () => promql.offset({ units: { y: 2, d: 1, h: 42 } }),
      expected: 'offset 2y1d42h',
    },
    {
      actual: () => promql.offset({ units: { y: 2, d: 1, h: 42, m: 2, s: 3 } }),
      expected: 'offset 2y1d42h2m3s',
    },
  ])('Generate PromQL offset modifier: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
