export enum MatchingOperator {
  equal = '=',
  notEqual = '!=',
  regexMatch = '=~',
  notRegexMatch = '!~',
}

export type LabelSelector = {
  operator: MatchingOperator;
  label: string;
  value: string;
};

export interface LabelsWithValues {
  [key: string]: string;
}

export type AggregateOverTime = {
  expr: string;
  range?: string;
  interval?: string;
};

export type AggregationParams = {
  /** vector expression to aggregate */
  expr: string;

  /** remove these labels from the result vector */
  without?: string[];

  /** drop all labels except these from the result vector */
  by?: string[];
};

export interface AggregateWithParameter extends AggregationParams {
  /** used for count_values, quantile, bottomk and topk */
  parameter: number | string;
}

export type LogicalOpParams = {
  left: string;
  right: string;
};

export interface OffsetUnits {
  y?: number;
  w?: number;
  d?: number;
  h?: number;
  m?: number;
  s?: number;
  ms?: number;
}

export type Offset = {
  units: OffsetUnits;
};

export type Rate = Omit<AggregateOverTime, 'range'>;

export type Increase = {
  expr: string;
  interval?: string;
};

export type LabelReplace = {
  expr: string;
  newLabel: string;
  existingLabel: string;
  replacement?: string;
  regex?: string;
};

export type LabelJoin = {
  expr: string;
  newLabel: string;
  labels: string[];
  separator?: string;
};

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
