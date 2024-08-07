import { parser } from '@prometheus-io/lezer-promql';
import { LanguageType, Migration } from './migration';

describe('Migration', () => {
  it.each([
    {
      q: 'foo',
      expected: ['foo{}'],
    },
    {
      q: 'foo{"bar"="baz"}',
      expected: ['foo{bar="baz"}'],
    },
    {
      q: 'foo{bar="baz"}',
      expected: ['foo{bar="baz"}'],
    },
    {
      q: 'foo{bar!="baz"}',
      expected: ['foo{bar!="baz"}'],
    },
    {
      q: 'foo{bar=~"baz"}',
      expected: ['foo{bar=~"baz"}'],
    },
    {
      q: 'foo{bar!~"baz"}',
      expected: ['foo{bar!~"baz"}'],
    },
    {
      q: 'foo{bar="baz",qux="quux"}',
      expected: ['foo{bar="baz", qux="quux"}'],
    },
    {
      q: 'foo{bar="baz", qux="quux"}',
      expected: ['foo{bar="baz", qux="quux"}'],
    },
  ])('Migrate: $q', ({ q, expected }) => {
    const p = parser.configure({
      top: LanguageType.PromQL,
    });

    const m = new Migration(q, p.parse(q));
    m.analyze();
    expect(m.toStrings()).toStrictEqual(expected);
  });
});
