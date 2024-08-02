import { promql } from "../promql";

// https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators
describe("Operators: Aggregations", () => {
  it.each([
    {
      actual: () => promql.sum({ expr: "" }),
      expected: "sum()",
    },
    {
      actual: () => promql.min({ expr: "" }),
      expected: "min()",
    },
    {
      actual: () => promql.max({ expr: "" }),
      expected: "max()",
    },
    {
      actual: () => promql.avg({ expr: "" }),
      expected: "avg()",
    },
    {
      actual: () => promql.group({ expr: "" }),
      expected: "group()",
    },
    {
      actual: () => promql.count({ expr: "" }),
      expected: "count()",
    },
    {
      actual: () => promql.stddev({ expr: "" }),
      expected: "stddev()",
    },
    {
      actual: () => promql.stdvar({ expr: "" }),
      expected: "stdvar()",
    },
    {
      actual: () => promql.count_values(1, { expr: "" }),
      expected: "count_values(1, )",
    },
    {
      actual: () => promql.bottomk(1, { expr: "" }),
      expected: "bottomk(1, )",
    },
    {
      actual: () => promql.topk(1, { expr: "" }),
      expected: "topk(1, )",
    },
    {
      actual: () => promql.quantile(1, { expr: "" }),
      expected: "quantile(1, )",
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}' }),
      expected: 'sum(test_metric{foo="bar"})',
    },
    {
      actual: () =>
        promql.sum({ expr: 'test_metric{foo="bar"}', without: "foo" }),
      expected: 'sum without (foo) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.sum({ expr: 'test_metric{foo="bar"}', by: "foo" }),
      expected: 'sum by (foo) (test_metric{foo="bar"})',
    },
    {
      actual: () =>
        promql.sum({
          expr: 'test_metric{foo="bar"}',
          without: "foo",
          by: "bar",
        }),
      expected: 'sum by (bar) (test_metric{foo="bar"})',
    },
    {
      actual: () => promql.stddev({ expr: 'test_metric{foo="bar"}' }),
      expected: 'stddev(test_metric{foo="bar"})',
    },
    {
      actual: () =>
        promql.stddev({ expr: 'test_metric{foo="bar"}', by: "foo" }),
      expected: 'stddev by (foo) (test_metric{foo="bar"})',
    },
  ])("Generate PromQL query: $expected", ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });
});
