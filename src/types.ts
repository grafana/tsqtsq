/** PromQL label matching operators (=, !=, =~, !~). */
export enum MatchingOperator {
  equal = '=',
  notEqual = '!=',
  regexMatch = '=~',
  notRegexMatch = '!~',
}

/** A single label matcher with operator and value. */
export type LabelSelector = {
  operator: MatchingOperator;
  label: string;
  value: string;
};

/** Map of label names to their expected values. */
export interface LabelsWithValues {
  [key: string]: string;
}

/** Parameters for *_over_time aggregation functions. */
export type AggregateOverTime = {
  expr: string;
  range?: string;
  interval?: string;
};

/** Parameters for aggregation operators (sum, avg, count, etc.). */
export type AggregationParams = {
  /** vector expression to aggregate */
  expr: string;

  /** remove these labels from the result vector */
  without?: string[];

  /** drop all labels except these from the result vector */
  by?: string[];
};

/** Parameters for aggregation operators that take an extra parameter (topk, bottomk, quantile, count_values). */
export interface AggregateWithParameter extends AggregationParams {
  /** used for count_values, quantile, bottomk and topk */
  parameter: number | string;
}

/** Parameters for logical set operators (and, or, unless). */
export type LogicalOpParams = {
  left: string;
  right: string;
};

/** Time duration units for PromQL offset modifiers. */
export interface OffsetUnits {
  y?: number;
  w?: number;
  d?: number;
  h?: number;
  m?: number;
  s?: number;
  ms?: number;
}

/** Parameters for the PromQL offset modifier. */
export type Offset = {
  units: OffsetUnits;
};

/** Parameters for the rate() function. */
export type Rate = Omit<AggregateOverTime, 'range'>;

/** Parameters for the increase() function. */
export type Increase = {
  expr: string;
  interval?: string;
};

/** Parameters for the label_replace() function. */
export type LabelReplace = {
  expr: string;
  newLabel: string;
  existingLabel: string;
  replacement?: string;
  regex?: string;
};

/** Parameters for the label_join() function. */
export type LabelJoin = {
  expr: string;
  newLabel: string;
  labels: string[];
  separator?: string;
};

/** Parameters for arithmetic binary operators (+, -, *, /, %, ^) with optional vector matching. */
export type ArithmeticBinaryOpParams = {
  left: string;
  right: string;

  /** match on these labels; takes precedence over ignoring if both provided */
  on?: string[];

  /** match ignoring these labels; only applied when on is not specified */
  ignoring?: string[];

  /** group_left labels for many-to-one matching */
  groupLeft?: string[];

  /** group_right labels for one-to-many matching */
  groupRight?: string[];
};
