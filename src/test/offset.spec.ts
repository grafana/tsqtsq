import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier
describe('Basics: offset modifier', () => {
  it.each([
    {
      actual: () => promql.offset({ offset: 42 }),
      expected: 'offset 42d',
    },
    {
      actual: () => promql.offset({ offset: 42, units: 'h' }),
      expected: 'offset 42h',
    },
  ])('Generate PromQL offset modifier: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
