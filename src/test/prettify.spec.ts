import { prettify } from '../prettify';
import { promql } from '../promql';

describe('prettify', () => {
  it.each([
    {
      name: 'leaves short expressions unchanged',
      actual: () => prettify({ expr: promql.rate({ expr: 'foo{bar="baz"}', interval: '5m' }) }),
      expected: 'rate(foo{bar="baz"}[5m])',
    },
    {
      name: 'leaves short aggregations unchanged',
      actual: () => prettify({ expr: promql.sum({ expr: 'test_metric{foo="bar"}', by: ['foo'] }) }),
      expected: 'sum by (foo) (test_metric{foo="bar"})',
    },
    {
      name: 'breaks nested aggregations onto indented lines',
      actual: () =>
        prettify({
          expr: promql.sum({
            by: ['cluster', 'namespace', 'workload', 'workload_type', 'pod'],
            expr: promql.max({
              by: ['cluster', 'namespace', 'pod', 'interface'],
              expr: promql.rate({ expr: 'container_network_transmit_packets_dropped_total{}', interval: '$__rate' }),
            }),
          }),
        }),
      expected: [
        'sum by (cluster, namespace, workload, workload_type, pod) (',
        '  max by (cluster, namespace, pod, interface) (',
        '    rate(container_network_transmit_packets_dropped_total{}[$__rate])',
        '  )',
        ')',
      ].join('\n'),
    },
    {
      name: 'honors a custom indent width',
      actual: () =>
        prettify({
          expr: promql.sum({
            by: ['cluster', 'namespace', 'workload'],
            expr: promql.rate({ expr: 'container_network_transmit_packets_dropped_total{}' }),
          }),
          indent: 4,
        }),
      expected: [
        'sum by (cluster, namespace, workload) (',
        '    rate(container_network_transmit_packets_dropped_total{}[$__rate_interval])',
        ')',
      ].join('\n'),
    },
    {
      name: 'honors a custom maxWidth',
      actual: () => prettify({ expr: promql.sum({ expr: 'test_metric{foo="bar"}', by: ['foo'] }), maxWidth: 20 }),
      expected: ['sum by (foo) (', '  test_metric{foo="bar"}', ')'].join('\n'),
    },
    {
      name: 'splits function arguments on top-level commas when broken',
      actual: () =>
        prettify({
          expr: promql.label_replace({
            expr: 'really_long_test_metric_name{foo="bar", baz="qux"}',
            newLabel: 'destination_label',
            existingLabel: 'source_label',
          }),
          maxWidth: 60,
        }),
      expected: [
        'label_replace(',
        '  really_long_test_metric_name{foo="bar", baz="qux"},',
        '  "destination_label",',
        '  "$1",',
        '  "source_label",',
        '  "(.*)"',
        ')',
      ].join('\n'),
    },
    {
      name: 'ignores parentheses and commas inside quoted strings',
      actual: () =>
        prettify({
          expr: 'label_replace(metric, "dst", "$1", "src", "(a,b)")',
        }),
      expected: 'label_replace(metric, "dst", "$1", "src", "(a,b)")',
    },
    {
      name: 'keeps binary operations inline when they fit',
      actual: () =>
        prettify({
          expr: promql.div({ left: 'http_requests_total', right: 'http_requests_duration_seconds' }),
        }),
      expected: 'http_requests_total / http_requests_duration_seconds',
    },
  ])('$name', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });

  it.each([
    { expr: 'sum(foo', name: 'missing closing parenthesis' },
    { expr: 'sum foo)', name: 'missing opening parenthesis' },
  ])('throws on unbalanced parentheses: $name', ({ expr }) => {
    expect(() => prettify({ expr })).toThrow('Unbalanced parentheses');
  });
});
