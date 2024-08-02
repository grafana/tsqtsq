import { Expression } from "./expression";
import { LabelSelector, LabelsWithValues, MatchingOperator } from "./types";

describe("Expression", () => {
  it.each([
    {
      metric: "",
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [],
      additionalSelectors: [],
      expected: "{}",
    },
    {
      metric: "test_metric",
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [],
      additionalSelectors: [],
      expected: "test_metric{}",
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster" },
      defaultOperator: MatchingOperator.equal,
      expected: 'test_metric{cluster="test/cluster"}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster" },
      defaultOperator: MatchingOperator.notEqual,
      expected: 'test_metric{cluster!="test/cluster"}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster" },
      defaultOperator: MatchingOperator.regexMatch,
      expected: 'test_metric{cluster=~"test/cluster"}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster" },
      defaultOperator: MatchingOperator.notRegexMatch,
      expected: 'test_metric{cluster!~"test/cluster"}',
    },
    {
      metric: "test_metric",
      values: {},
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [
        { operator: MatchingOperator.notEqual, label: "container", value: "" },
      ],
      additionalSelectors: [],
      expected: 'test_metric{container!=""}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster" },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [
        { operator: MatchingOperator.notEqual, label: "container", value: "" },
      ],
      additionalSelectors: [],
      expected: 'test_metric{container!="", cluster="test/cluster"}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster", container: undefined },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [
        { operator: MatchingOperator.notEqual, label: "container", value: "" },
      ],
      additionalSelectors: [],
      expected: 'test_metric{container!="", cluster="test/cluster"}',
    },
    {
      metric: "test_metric",
      values: { cluster: "test/cluster", container: "test-container" },
      defaultOperator: MatchingOperator.equal,
      defaultSelectors: [
        { operator: MatchingOperator.notEqual, label: "container", value: "" },
      ],
      additionalSelectors: [],
      expected:
        'test_metric{container="test-container", cluster="test/cluster"}',
    },
  ])(
    "Generate PromQL query: $expected",
    ({
      metric,
      values,
      defaultOperator,
      defaultSelectors,
      additionalSelectors,
      expected,
    }) => {
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
});
