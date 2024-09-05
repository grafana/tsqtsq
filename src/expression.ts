import { LabelSelector, LabelsWithValues, MatchingOperator } from './types';

export class Expression {
  metric: string;
  selectors = new Map<string, LabelSelector>();

  // keep certain values for cloning purposes
  private readonly values: LabelsWithValues;
  private readonly defaultOperator: MatchingOperator;

  constructor(opts: {
    metric: string;
    values: LabelsWithValues;
    defaultOperator: MatchingOperator;
    defaultSelectors?: LabelSelector[];
  }) {
    this.metric = opts.metric;
    this.values = opts.values;
    this.defaultOperator = opts.defaultOperator;

    // set default selectors first
    opts.defaultSelectors?.forEach((selector) => this.setSelector(selector));

    // override default selectors with actual values
    for (const [label, value] of Object.entries(opts.values)) {
      if (value === undefined) {
        continue;
      }
      this.selectors.set(label, {
        operator: opts.defaultOperator,
        label,
        value,
      });
    }
  }

  setSelector(selector: LabelSelector) {
    this.selectors.set(selector.label, selector);
    return this;
  }

  toString(): string {
    const selectors = Array.from(this.selectors)
      .map(([label, selector]) => `${label}${selector.operator}"${selector.value}"`)
      .join(', ');
    return `${this.metric}{${selectors}}`;
  }

  clone() {
    return new Expression({
      metric: this.metric,
      values: this.values,
      defaultOperator: this.defaultOperator,
      defaultSelectors: [...this.selectors.values()],
    });
  }
}
