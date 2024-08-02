import { AggregationParams, LogicalOpParams } from "./types";

export const promql = {
  x_over_time: (x: string, q: string, range = "$__range", interval = "") => {
    return `${x}_over_time((${q})[${range}:${interval}])`;
  },

  // Aggregation over time
  avg_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("avg", q, range, interval),
  count_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("count", q, range, interval),
  last_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("last", q, range, interval),
  max_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("max", q, range, interval),
  min_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("min", q, range, interval),
  present_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("present", q, range, interval),
  stddev_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("stddev", q, range, interval),
  stdvar_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("stdvar", q, range, interval),
  sum_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("sum", q, range, interval),
  quantile_over_time: (q: string, range?: string, interval?: string) =>
    promql.x_over_time("quantile", q, range, interval),

  offset: (offset?: number, units?: string) => {
    // implicit cast because syntax checker only generates string args
    offset = offset ? +offset : 0;
    units = units || "d";
    return offset && units ? `offset ${offset}${units}` : "";
  },

  by: (labels?: string) => (labels ? ` by (${labels}) ` : ""),
  without: (labels?: string) => (labels ? ` without (${labels}) ` : ""),
  byOrWithout: ({ by, without }: AggregationParams) =>
    by ? promql.by(by) : promql.without(without),

  // Aggregation
  sum: (params: AggregationParams) =>
    `sum${promql.byOrWithout(params)}(${params.expr})`,
  min: (params: AggregationParams) =>
    `min${promql.byOrWithout(params)}(${params.expr})`,
  max: (params: AggregationParams) =>
    `max${promql.byOrWithout(params)}(${params.expr})`,
  avg: (params: AggregationParams) =>
    `avg${promql.byOrWithout(params)}(${params.expr})`,
  group: (params: AggregationParams) =>
    `group${promql.byOrWithout(params)}(${params.expr})`,
  count: (params: AggregationParams) =>
    `count${promql.byOrWithout(params)}(${params.expr})`,
  stddev: (params: AggregationParams) =>
    `stddev${promql.byOrWithout(params)}(${params.expr})`,
  stdvar: (params: AggregationParams) =>
    `stdvar${promql.byOrWithout(params)}(${params.expr})`,
  count_values: (parameter: number, params: AggregationParams) =>
    `count_values${promql.byOrWithout(params)}(${parameter}, ${params.expr})`,
  bottomk: (parameter: number, params: AggregationParams) =>
    `bottomk${promql.byOrWithout(params)}(${parameter}, ${params.expr})`,
  topk: (parameter: number, params: AggregationParams) =>
    `topk${promql.byOrWithout(params)}(${parameter}, ${params.expr})`,
  quantile: (parameter: number, params: AggregationParams) =>
    `quantile${promql.byOrWithout(params)}(${parameter}, ${params.expr})`,

  and: (params: LogicalOpParams) => `${params.left} and ${params.right}`,
  or: (params: LogicalOpParams) => `${params.left} or ${params.right}`,
  unless: (params: LogicalOpParams) => `${params.left} unless ${params.right}`,
};
