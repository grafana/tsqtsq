import {
  AggregateOverTime,
  AggregateWithParameter,
  AggregationParams,
  LabelJoin,
  LabelReplace,
  LogicalOpParams,
  Offset,
  Rate,
  Increase
} from './types';
import { buildOffsetString } from './utils';

export const promql = {
  x_over_time: (x: string, q: string, range = '$__range', interval = '') => {
    return `${x}_over_time((${q})[${range}:${interval}])`;
  },

  // Aggregation over time
  avg_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('avg', expr, range, interval),
  count_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('count', expr, range, interval),
  last_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('last', expr, range, interval),
  max_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('max', expr, range, interval),
  min_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('min', expr, range, interval),
  present_over_time: ({ expr, range, interval }: AggregateOverTime) =>
    promql.x_over_time('present', expr, range, interval),
  stddev_over_time: ({ expr, range, interval }: AggregateOverTime) =>
    promql.x_over_time('stddev', expr, range, interval),
  stdvar_over_time: ({ expr, range, interval }: AggregateOverTime) =>
    promql.x_over_time('stdvar', expr, range, interval),
  sum_over_time: ({ expr, range, interval }: AggregateOverTime) => promql.x_over_time('sum', expr, range, interval),
  quantile_over_time: ({ expr, range, interval }: AggregateOverTime) =>
    promql.x_over_time('quantile', expr, range, interval),

  offset: ({ units }: Offset) => buildOffsetString(units),

  by: (labels?: string[]) => (labels ? ` by (${labels.join(', ')}) ` : ''),
  without: (labels?: string[]) => (labels ? ` without (${labels.join(', ')}) ` : ''),
  byOrWithout: ({ by, without }: Omit<AggregationParams, 'expr'>) => (by ? promql.by(by) : promql.without(without)),

  // Aggregation
  sum: ({ expr, by, without }: AggregationParams) => `sum${promql.byOrWithout({ by, without })}(${expr})`,
  min: ({ expr, by, without }: AggregationParams) => `min${promql.byOrWithout({ by, without })}(${expr})`,
  max: ({ expr, by, without }: AggregationParams) => `max${promql.byOrWithout({ by, without })}(${expr})`,
  avg: ({ expr, by, without }: AggregationParams) => `avg${promql.byOrWithout({ by, without })}(${expr})`,
  group: ({ expr, by, without }: AggregationParams) => `group${promql.byOrWithout({ by, without })}(${expr})`,
  count: ({ expr, by, without }: AggregationParams) => `count${promql.byOrWithout({ by, without })}(${expr})`,
  stddev: ({ expr, by, without }: AggregationParams) => `stddev${promql.byOrWithout({ by, without })}(${expr})`,
  stdvar: ({ expr, by, without }: AggregationParams) => `stdvar${promql.byOrWithout({ by, without })}(${expr})`,
  count_values: ({ expr, by, without, parameter }: AggregateWithParameter) =>
    `count_values${promql.byOrWithout({ by, without })}(${parameter}, ${expr})`,
  bottomk: ({ expr, by, without, parameter }: AggregateWithParameter) =>
    `bottomk${promql.byOrWithout({ by, without })}(${parameter}, ${expr})`,
  topk: ({ expr, by, without, parameter }: AggregateWithParameter) =>
    `topk${promql.byOrWithout({ by, without })}(${parameter}, ${expr})`,
  quantile: ({ expr, by, without, parameter }: AggregateWithParameter) =>
    `quantile${promql.byOrWithout({ by, without })}(${parameter}, ${expr})`,

  and: ({ left, right }: LogicalOpParams) => `${left} and ${right}`,
  or: ({ left, right }: LogicalOpParams) => `${left} or ${right}`,
  unless: ({ left, right }: LogicalOpParams) => `${left} unless ${right}`,

  rate: ({ expr, interval = '$__rate_interval' }: Rate) => `rate(${expr}[${interval}])`,
  increase: ({ expr, interval = '$__range' }: Increase) => `increase(${expr}[${interval}])`,

  // Labels
  label_replace: ({ expr, newLabel, existingLabel, replacement = '$1', regex = '(.*)' }: LabelReplace) =>
    `label_replace(${expr}, "${newLabel}", "${replacement}", "${existingLabel}", "${regex}")`,

  label_join: ({ expr, newLabel, separator = ',', labels }: LabelJoin) =>
    `label_join(${expr}, "${newLabel}", "${separator}", ${labels.map((label) => `"${label}"`).join(', ')})`,
};
