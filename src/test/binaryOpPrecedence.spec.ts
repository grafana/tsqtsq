import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/operators/#binary-operator-precedence
describe('Operators: Binary Op Precedence', () => {
  it.each([
    {
      actual: () => promql.pow({ left: promql.mul({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a * b) ^ c)',
    },
    {
      actual: () => promql.pow({ left: 'a', right: promql.mul({ left: 'b', right: 'c' }) }),
      expected: '(a ^ (b * c))',
    },
    {
      actual: () => promql.mul({ left: promql.add({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a + b) * c)',
    },
    {
      actual: () => promql.mul({ left: 'a', right: promql.add({ left: 'b', right: 'c' }) }),
      expected: '(a * (b + c))',
    },
    {
      actual: () => promql.add({ left: promql.eq({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a == b) + c)',
    },
    {
      actual: () => promql.add({ left: 'a', right: promql.eq({ left: 'b', right: 'c' }) }),
      expected: '(a + (b == c))',
    },
    {
      actual: () => promql.eq({ left: promql.and({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a and b) == c)',
    },
    {
      actual: () => promql.eq({ left: 'a', right: promql.and({ left: 'b', right: 'c' }) }),
      expected: '(a == (b and c))',
    },
    {
      actual: () => promql.and({ left: promql.or({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a or b) and c)',
    },
    {
      actual: () => promql.and({ left: 'a', right: promql.or({ left: 'b', right: 'c' }) }),
      expected: '(a and (b or c))',
    },
    {
      actual: () => promql.add({ left: promql.mul({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a * b) + c)',
    },
    {
      actual: () => promql.add({ left: 'a', right: promql.mul({ left: 'b', right: 'c' }) }),
      expected: '(a + (b * c))',
    },
  ])('preserves precedence: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });

  it.each([
    {
      actual: () => promql.sub({ left: 'a', right: promql.sub({ left: 'b', right: 'c' }) }),
      expected: '(a - (b - c))',
    },
    {
      actual: () => promql.div({ left: 'a', right: promql.mul({ left: 'b', right: 'c' }) }),
      expected: '(a / (b * c))',
    },
    {
      actual: () => promql.and({ left: 'a', right: promql.unless({ left: 'b', right: 'c' }) }),
      expected: '(a and (b unless c))',
    },
    {
      actual: () => promql.eq({ left: 'a', right: promql.neq({ left: 'b', right: 'c' }) }),
      expected: '(a == (b != c))',
    },
    {
      actual: () => promql.pow({ left: promql.pow({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a ^ b) ^ c)',
    },
    {
      actual: () => promql.sub({ left: promql.sub({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a - b) - c)',
    },
    {
      actual: () => promql.pow({ left: 'a', right: promql.pow({ left: 'b', right: 'c' }) }),
      expected: '(a ^ (b ^ c))',
    },
    {
      actual: () => promql.neq({ left: promql.eq({ left: 'a', right: 'b' }), right: 'c' }),
      expected: '((a == b) != c)',
    },
  ])('preserves associativity: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
