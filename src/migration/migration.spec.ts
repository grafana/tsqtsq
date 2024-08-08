import { parser } from '@prometheus-io/lezer-promql';
import { LanguageType, Migration } from './migration';

describe('Migration', () => {
  it.each([
    {
      q: 'foo',
      expected: 'foo{}',
    },
    {
      q: 'foo{"bar"="baz"}',
      expected: 'foo{bar="baz"}',
    },
    {
      q: 'foo{bar="baz"}',
      expected: 'foo{bar="baz"}',
    },
    {
      q: 'foo{bar!="baz"}',
      expected: 'foo{bar!="baz"}',
    },
    {
      q: 'foo{bar=~"baz"}',
      expected: 'foo{bar=~"baz"}',
    },
    {
      q: 'foo{bar!~"baz"}',
      expected: 'foo{bar!~"baz"}',
    },
    {
      q: 'foo{bar="baz",qux="quux"}',
      expected: 'foo{bar="baz", qux="quux"}',
    },
    {
      q: 'foo{bar="baz", qux="quux"}',
      expected: 'foo{bar="baz", qux="quux"}',
    },
    {
      q: 'count(kube_node_info{cluster!=""})',
      expected: 'count(kube_node_info{cluster!=""})',
    },
    {
      q: 'count(kube_node_info{cluster!=""}) by (cluster, node)',
      expected: 'count by (cluster, node) (kube_node_info{cluster!=""})',
    },
    {
      q: 'count without (node) (kube_node_info{cluster!=""})',
      expected: 'count without (node) (kube_node_info{cluster!=""})',
    },
    // {
    //   q: 'sum(kube_namespace_status_phase{cluster=~"my-cluster", namespace=~"my-namespace"} == 1) by (phase, namespace)',
    //   expected:
    //     'sum by (phase, namespace) (kube_namespace_status_phase{cluster=~"my-cluster", namespace=~"my-namespace"} == 1)',
    // },
  ])('Migrate: $q', ({ q, expected }) => {
    const p = parser.configure({
      top: LanguageType.PromQL,
    });

    const m = new Migration(q, p.parse(q));
    m.analyze();
    expect(m.toString()).toStrictEqual(expected);
  });
});
