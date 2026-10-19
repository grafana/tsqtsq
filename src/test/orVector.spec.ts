import { promql } from '../promql';

describe('Functions: orVector', () => {
  it.each([
    {
      actual: () => promql.orVector({ expr: 'foo{bar="baz"}' }),
      expected: '(foo{bar="baz"} or on() vector(0))',
    },
    {
      actual: () => promql.orVector({ expr: 'foo{bar="baz"}', fallback: 1 }),
      expected: '(foo{bar="baz"} or on() vector(1))',
    },
    {
      actual: () => promql.orVector({ expr: 'foo', fallback: '$default' }),
      expected: '(foo or on() vector($default))',
    },
    {
      actual: () => promql.orVector({ expr: promql.sum({ expr: promql.rate({ expr: 'foo' }) }) }),
      expected: '(sum(rate(foo[$__rate_interval])) or on() vector(0))',
    },
  ])('Generate PromQL orVector query: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
