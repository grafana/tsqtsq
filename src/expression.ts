import { LabelSelector, LabelsWithValues, MatchingOperator } from './types';

export class Expression {
  metric: string;
  selectors = new Map<string, LabelSelector[]>();

  constructor(opts: {
    metric: string;
    values: LabelsWithValues;
    defaultOperator: MatchingOperator;
    defaultSelectors?: LabelSelector[];
  }) {
    this.metric = opts.metric;

    // set default selectors first
    opts.defaultSelectors?.forEach((selector) => this.setSelector(selector));

    // override default selectors with actual values
    for (const [label, value] of Object.entries(opts.values)) {
      if (value === undefined) {
        continue;
      }
      this.selectors.set(label, [{
        operator: opts.defaultOperator,
        label,
        value,
      }]);
    }
  }

  setSelector(selector: LabelSelector) {
    const existing = this.selectors.get(selector.label) || [];
    existing.push(selector);
    this.selectors.set(selector.label, existing);
    return this;
  }

  toString(): string {
    const selectors = Array.from(this.selectors)
      .flatMap(([label, selectorArray]) => 
        selectorArray.map(selector => `${label}${selector.operator}"${selector.value}"`)
      )
      .join(', ');
    return `${this.metric}{${selectors}}`;
  }
}
