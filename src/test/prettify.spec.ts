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
    {
      name: 'preserves the $__rate_interval template variable in a range selector',
      actual: () => prettify({ expr: promql.rate({ expr: 'foo{bar="baz"}' }) }),
      expected: 'rate(foo{bar="baz"}[$__rate_interval])',
    },
    {
      name: 'preserves template variables in subquery ranges',
      actual: () => prettify({ expr: promql.avg_over_time({ expr: 'up' }) }),
      expected: 'avg_over_time((up)[$__range:])',
    },
    {
      name: 'preserves template variables after offset',
      actual: () => prettify({ expr: 'sum(foo offset $__interval)' }),
      expected: 'sum(foo offset $__interval)',
    },
    {
      name: 'preserves ${...} and dashboard variables in vector and label positions',
      actual: () => prettify({ expr: 'sum by (pod) (rate(${metric}{cluster="$cluster"}[$__rate_interval]))' }),
      expected: 'sum by (pod) (rate(${metric}{cluster="$cluster"}[$__rate_interval]))',
    },
    {
      name: 'breaks expressions containing template variables onto indented lines',
      actual: () =>
        prettify({
          expr: promql.sum({
            by: ['cluster', 'namespace', 'workload', 'workload_type', 'pod'],
            expr: promql.rate({ expr: 'network_transmit_dropped_total{job="$job"}' }),
          }),
        }),
      expected: [
        'sum by (cluster, namespace, workload, workload_type, pod) (',
        '  rate(network_transmit_dropped_total{job="$job"}[$__rate_interval])',
        ')',
      ].join('\n'),
    },
  ])('$name', ({ actual, expected }) => {
    expect(actual()).toStrictEqual(expected);
  });

  it.each([
    { expr: 'sum(foo', name: 'missing closing parenthesis' },
    { expr: 'sum foo)', name: 'missing opening parenthesis' },
    { expr: 'sum by (foo) (}', name: 'stray closing brace' },
  ])('throws on invalid PromQL: $name', ({ expr }) => {
    expect(() => prettify({ expr })).toThrow('Unable to parse PromQL expression');
  });

  it.each([
    { options: { expr: 'up', indent: -1 }, message: 'indent must be a non-negative integer', name: 'negative indent' },
    { options: { expr: 'up', indent: 1.5 }, message: 'indent must be a non-negative integer', name: 'fractional indent' },
    { options: { expr: 'up', maxWidth: 0 }, message: 'maxWidth must be a positive integer', name: 'zero maxWidth' },
  ])('throws on invalid options: $name', ({ options, message }) => {
    expect(() => prettify(options)).toThrow(message);
  });
});
