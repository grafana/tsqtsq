import { SyntaxNode, SyntaxNodeRef, Tree } from '@lezer/common';
import {
  EqlRegex,
  EqlSingle,
  Identifier,
  LabelMatchers,
  LabelName,
  MatchOp,
  MatrixSelector,
  Neq,
  NeqRegex,
  ParenExpr,
  QuotedLabelMatcher,
  QuotedLabelName,
  StepInvariantExpr,
  StringLiteral,
  SubqueryExpr,
  UnaryExpr,
  UnquotedLabelMatcher,
  VectorSelector,
} from '@prometheus-io/lezer-promql';
import { Expression } from '../expression';
import { LabelSelector, LabelsWithValues, MatchingOperator } from '../types';

export enum LanguageType {
  PromQL = 'PromQL',
  MetricName = 'MetricName',
}

export class Migration {
  private tree: Tree;
  private statement: string;
  private expressions: Expression[];

  constructor(statement: string, tree: Tree) {
    this.tree = tree;
    this.statement = statement;
    this.expressions = [];
  }

  toStrings(): string[] {
    return this.expressions.map((expr) => expr.toString());
  }

  analyze() {
    this.checkAST(this.tree.topNode.firstChild);
  }

  checkAST(node: SyntaxNode | null) {
    if (!node) {
      return;
    }

    switch (node.type.id) {
      case ParenExpr:
      case UnaryExpr:
      case SubqueryExpr:
      case MatrixSelector:
      case StepInvariantExpr:
        this.checkAST(node.getChild('Expr'));
        break;

      case VectorSelector:
        this.handleVectorSelector(node);
        break;

      default:
        console.error('not implemented', node?.type.name);
        break;
    }
  }

  private print(ref: SyntaxNodeRef) {
    return this.statement.slice(ref.from, ref.to);
  }

  private handleVectorSelector(node: SyntaxNode) {
    const expressionOpts = {
      metric: '',
      values: {} as LabelsWithValues,
      defaultOperator: MatchingOperator.equal,
    };

    const name = node.getChild(Identifier);
    if (name) {
      expressionOpts.metric = this.print(name);
    }

    const expression = new Expression(expressionOpts);

    const matchList = node.getChild(LabelMatchers);
    [QuotedLabelName, QuotedLabelMatcher, UnquotedLabelMatcher].map((opt) => {
      matchList?.getChildren(opt).map((labelMatcher) => {
        const selector = {} as LabelSelector;

        const cursor = labelMatcher.cursor();
        switch (cursor.type.id) {
          case QuotedLabelName:
            selector.label = this.print(cursor).slice(1, -1);
            break;

          case QuotedLabelMatcher:
          case UnquotedLabelMatcher:
            if (!cursor.next()) {
              return;
            }
            do {
              switch (cursor.type.id) {
                case LabelName:
                  selector.label = this.print(cursor);
                  break;

                case QuotedLabelName:
                  selector.label = this.print(cursor).slice(1, -1);
                  break;

                case MatchOp:
                  const operator = cursor.node.firstChild;
                  if (operator) {
                    switch (operator.type.id) {
                      case EqlSingle:
                        selector.operator = MatchingOperator.equal;
                        break;

                      case Neq:
                        selector.operator = MatchingOperator.notEqual;
                        break;

                      case EqlRegex:
                        selector.operator = MatchingOperator.regexMatch;
                        break;

                      case NeqRegex:
                        selector.operator = MatchingOperator.notRegexMatch;
                        break;
                    }
                  }
                  break;

                case StringLiteral:
                  selector.value = this.print(cursor).slice(1, -1);
                  break;
              }
            } while (cursor.nextSibling());
            break;
        }

        // selector is ready
        expression.setSelector(selector);
      });
    });

    // expression is ready
    this.expressions.push(expression);
  }
}
