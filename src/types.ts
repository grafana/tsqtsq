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
  parameter: number;
}

export type LogicalOpParams = {
  left: string;
  right: string;
};

export type OffsetUnits = 'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y';

export type Offset = {
  offset: number;
  units?: OffsetUnits;
};

export type Rate = Omit<AggregateOverTime, 'range'>;
