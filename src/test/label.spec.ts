import { promql } from '../promql';

// https://prometheus.io/docs/prometheus/latest/querying/basics/#offset-modifier
describe('Functions: label manipulation', () => {
  it.each([
    {
      actual: () => promql.label_replace({ expr: 'test_metric{foo="bar"}', newLabel: 'baz', existingLabel: 'foo' }),
      expected: 'label_replace(test_metric{foo="bar"}, "baz", "$1", "foo", "(.*)")',
    },
    {
      actual: () => promql.label_join({ expr: 'test_metric{foo="bar"}', labels: ['foo', 'bar'] }),
      expected: 'label_join(test_metric{foo="bar"}, ", ", "foo", "bar")',
    },
  ])('Generate PromQL offset modifier: $expected', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
