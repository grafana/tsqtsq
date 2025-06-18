import { Expression } from './expression';
import { LabelSelector, LabelsWithValues, MatchingOperator } from './types';

describe('Expression', () => {
  it.each([
    {
      metric: '',
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [],
      additionalSelectors: [],
      expected: '{}',
    },
    {
      metric: 'test_metric',
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [],
      additionalSelectors: [],
      expected: 'test_metric{}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster' },
      defaultOperator: MatchingOperator.equal,
      expected: 'test_metric{cluster="test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster' },
      defaultOperator: MatchingOperator.notEqual,
      expected: 'test_metric{cluster!="test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster' },
      defaultOperator: MatchingOperator.regexMatch,
      expected: 'test_metric{cluster=~"test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster' },
      defaultOperator: MatchingOperator.notRegexMatch,
      expected: 'test_metric{cluster!~"test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [{ operator: MatchingOperator.notEqual, label: 'container', value: '' }],
      additionalSelectors: [],
      expected: 'test_metric{container!=""}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster' },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [{ operator: MatchingOperator.notEqual, label: 'container', value: '' }],
      additionalSelectors: [],
      expected: 'test_metric{container!="", cluster="test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster', container: undefined },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [{ operator: MatchingOperator.notEqual, label: 'container', value: '' }],
      additionalSelectors: [],
      expected: 'test_metric{container!="", cluster="test/cluster"}',
    },
    {
      metric: 'test_metric',
      values: { cluster: 'test/cluster', container: 'test-container' },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [{ operator: MatchingOperator.notEqual, label: 'container', value: '' }],
      additionalSelectors: [],
      expected: 'test_metric{container="test-container", cluster="test/cluster"}',
    },
  ])(
    'Generate PromQL query: $expected',
    ({ metric, values, defaultOperator, defaultSelectors, additionalSelectors, expected }) => {
      const expr = new Expression({
        metric,
        values: values as LabelsWithValues,
        defaultOperator,
        defaultSelectors: defaultSelectors as LabelSelector[],
      });

      additionalSelectors?.forEach((selector) => expr.setSelector(selector));

      expect(expr.toString()).toStrictEqual(expected);
    }
  );

  describe('Multiple default selectors with same label', () => {
    it('should support multiple default selectors with the same label', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: {},
        defaultOperator: MatchingOperator.equal,
        defaultSelectors: [
          { operator: MatchingOperator.equal, label: 'env', value: 'prod' },
          { operator: MatchingOperator.notEqual, label: 'env', value: 'staging' },
        ],
      });

      expect(expr.toString()).toStrictEqual('test_metric{env="prod", env!="staging"}');
    });

    it('should support adding multiple selectors with same label via setSelector', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: {},
        defaultOperator: MatchingOperator.equal,
        defaultSelectors: [
          { operator: MatchingOperator.equal, label: 'env', value: 'prod' },
        ],
      });

      expr.setSelector({ operator: MatchingOperator.notEqual, label: 'env', value: 'staging' });
      expr.setSelector({ operator: MatchingOperator.regexMatch, label: 'env', value: 'test.*' });

      expect(expr.toString()).toStrictEqual('test_metric{env="prod", env!="staging", env=~"test.*"}');
    });

    it('should handle values overriding all default selectors for same label', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: { env: 'development' },
        defaultOperator: MatchingOperator.equal,
        defaultSelectors: [
          { operator: MatchingOperator.equal, label: 'env', value: 'prod' },
          { operator: MatchingOperator.notEqual, label: 'env', value: 'staging' },
        ],
      });

      expect(expr.toString()).toStrictEqual('test_metric{env="development"}');
    });

    it('should support mixed labels with multiple selectors', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: { cluster: 'prod-cluster' },
        defaultOperator: MatchingOperator.equal,
        defaultSelectors: [
          { operator: MatchingOperator.equal, label: 'env', value: 'prod' },
          { operator: MatchingOperator.notEqual, label: 'env', value: 'staging' },
          { operator: MatchingOperator.notEqual, label: 'container', value: '' },
        ],
      });

      expect(expr.toString()).toStrictEqual('test_metric{env="prod", env!="staging", container!="", cluster="prod-cluster"}');
    });
  });
});
