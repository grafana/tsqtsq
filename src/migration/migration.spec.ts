import { parser } from '@prometheus-io/lezer-promql';
import { LanguageType, Migration } from './migration';

describe('Migration', () => {
  it.each([
    {
      q: 'foo',
      expected: {
        promql: 'foo{}',
        ts: `
const foo = () => new Expression({
    metric: \"foo\",
    values: {},
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{"bar"="baz"}',
      expected: {
        promql: 'foo{bar="baz"}',
        ts: `
const foo = (values: {
    bar?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.equal, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar="baz"}',
      expected: {
        promql: 'foo{bar="baz"}',
        ts: `
const foo = (values: {
    bar?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.equal, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar!="baz"}',
      expected: {
        promql: 'foo{bar!="baz"}',
        ts: `
const foo = (values: {
    bar?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.notEqual, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar=~"baz"}',
      expected: {
        promql: 'foo{bar=~"baz"}',
        ts: `
const foo = (values: {
    bar?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.regexMatch, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar!~"baz"}',
      expected: {
        promql: 'foo{bar!~"baz"}',
        ts: `
const foo = (values: {
    bar?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.notRegexMatch, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar="baz",qux!~"quux"}',
      expected: {
        promql: 'foo{bar="baz", qux!~"quux"}',
        ts: `
const foo = (values: {
    bar?: string;
    qux?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.equal, value: "" }, { label: "qux", operator: MatchingOperator.notRegexMatch, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'foo{bar="baz", qux!="quux"}',
      expected: {
        promql: 'foo{bar="baz", qux!="quux"}',
        ts: `
const foo = (values: {
    bar?: string;
    qux?: string;
}) => new Expression({
    metric: \"foo\",
    values,
    defaultOperator: MatchingOperator.equal,
    defaultSelectors: [{ label: "bar", operator: MatchingOperator.equal, value: "" }, { label: "qux", operator: MatchingOperator.notEqual, value: "" }],
}).toString();
`.trimStart(),
      },
    },
    {
      q: 'count(kube_node_info{cluster!=""})',
      expected: {
        promql: 'count(kube_node_info{cluster!=""})',
        //         ts: `
        // const foo = (values: {
        //     bar?: string;
        //     qux?: string;
        // }) => promql.count({expr: new Expression({
        //     metric: \"kube_node_info\",
        //     values,
        //     defaultOperator: MatchingOperator.equal,
        //     defaultSelectors: [{ label: "cluster", operator: MatchingOperator.notEqual, value: "" }],
        // }).toString()});
        // `.trimStart(),
      },
    },
    {
      q: 'count(kube_node_info{cluster!=""}) by (cluster, node)',
      expected: {
        promql: 'count by (cluster, node) (kube_node_info{cluster!=""})',
      },
    },
    {
      q: 'count without (node) (kube_node_info{cluster!=""})',
      expected: {
        promql: 'count without (node) (kube_node_info{cluster!=""})',
      },
    },
    // {
    //   q: 'sum(kube_namespace_status_phase{cluster=~"my-cluster", namespace=~"my-namespace"} == 1) by (phase, namespace)',
    //   expected: {
    //     promql:
    //       'sum by (phase, namespace) (kube_namespace_status_phase{cluster=~"my-cluster", namespace=~"my-namespace"} == 1)',
    //   },
    // },
  ])('Migrate: $q', ({ q, expected }) => {
    const p = parser.configure({
      top: LanguageType.PromQL,
    });

    const m = new Migration(q, p.parse(q));
    m.analyze();

    if (expected.promql !== undefined) {
      expect(m.toString()).toStrictEqual(expected.promql);
    }

    if (expected.ts !== undefined) {
      expect(m.toString(true)).toStrictEqual(expected.ts);
    }
  });
});
