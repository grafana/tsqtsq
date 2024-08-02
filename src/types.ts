export enum MatchingOperator {
  equal = "=",
  notEqual = "!=",
  regexMatch = "=~",
  notRegexMatch = "!~",
}

export type LabelSelector = {
  operator: MatchingOperator;
  label: string;
  value: string;
};

export interface LabelsWithValues {
  [key: string]: string;
}

export type AggregationParams = {
  /** vector expression to aggregate */
  expr: string;

  /** remove these labels from the result vector */
  without?: string;

  /** drop these labels from the result vector */
  by?: string;
};

export type LogicalOpParams = {
  left: string;
  right: string;
};
