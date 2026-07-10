// Recording wrapper around the real Expression class. The fixture generator
// aliases the spec files' `import { Expression } from './expression'` to this
// module. Construction options and setSelector() calls are captured, and the
// case is recorded when toString() is called (which is when the output that
// the spec asserts on is produced).
import { Expression as RealExpression } from '../../src/expression';
import { LabelSelector, LabelsWithValues, MatchingOperator } from '../../src/types';
import { record } from './recorder-state';

type ExpressionOpts = {
  metric: string;
  values: LabelsWithValues;
  defaultOperator: MatchingOperator;
  defaultSelectors?: LabelSelector[];
};

export class Expression extends RealExpression {
  private readonly opts: ExpressionOpts;
  private readonly extraSelectors: LabelSelector[] = [];

  constructor(opts: ExpressionOpts) {
    super(opts);
    this.opts = opts;
  }

  setSelector(selector: LabelSelector) {
    // The base constructor applies defaultSelectors through setSelector before
    // this subclass's fields initialize; those are already captured via opts.
    if (this.extraSelectors !== undefined) {
      this.extraSelectors.push(selector);
    }
    return super.setSelector(selector);
  }

  toString(): string {
    const result = super.toString();
    record({
      fn: 'Expression',
      params: {
        ...this.opts,
        ...(this.extraSelectors.length > 0 ? { setSelectors: this.extraSelectors } : {}),
      },
      expected: result,
    });
    return result;
  }
}
