import { SyntaxNode, SyntaxNodeRef, Tree } from '@lezer/common';
import {
  AggregateExpr,
  AggregateModifier,
  Bottomk,
  By,
  Count,
  CountValues,
  EqlRegex,
  EqlSingle,
  FunctionCallBody,
  GroupingLabels,
  Identifier,
  LabelMatchers,
  LabelName,
  LimitK,
  LimitRatio,
  MatchOp,
  MatrixSelector,
  Neq,
  NeqRegex,
  ParenExpr,
  Quantile,
  QuotedLabelMatcher,
  QuotedLabelName,
  StepInvariantExpr,
  StringLiteral,
  SubqueryExpr,
  Topk,
  UnaryExpr,
  UnquotedLabelMatcher,
  VectorSelector,
  Without,
} from '@prometheus-io/lezer-promql';
import { Expression } from '../expression';
import { AggregationParams, LabelSelector, LabelsWithValues, MatchingOperator } from '../types';
import { promql } from '../promql';

export enum LanguageType {
  PromQL = 'PromQL',
  MetricName = 'MetricName',
}

type item = {
  id: number;
  parent?: number;
  children: item[];
  func?: any;
  args?: any;
  expression?: Expression;
};

export class Migration {
  private tree: Tree;
  private statement: string;
  private items: Map<number, item>;

  constructor(statement: string, tree: Tree) {
    this.tree = tree;
    this.statement = statement;
    this.items = new Map();
  }

  toString(): string {
    if (!this.items.has(0)) {
      return '';
    }

    const root = this.items.get(0)!;
    if (root.children.length === 0) {
      return root?.expression?.toString() || root?.func?.(root?.args);
    }

    const renderedChildren = root.children.map((child) => {
      if (child.expression) {
        return child.expression.toString();
      }

      if (child.func) {
        return child.func(child.args);
      }
    });

    if (root.expression !== undefined) {
      console.error('expression has children', renderedChildren);
    }

    if (root.func !== undefined) {
      if (root.args?.expr === '') {
        // replace expr arg placeholder with rendered children
        root.args.expr = renderedChildren.join(' ');
      } else {
        console.error('orhaned children', renderedChildren);
      }
      return root.func(root.args);
    }

    console.error('got to the end without doing anything');
    return '';
  }

  analyze() {
    const entryNode = this.tree.topNode.firstChild;
    if (!entryNode) {
      return;
    }
    this.checkAST(entryNode);
    this.optimize();
  }

  private optimize() {
    let itemsWithParents: number;
    do {
      itemsWithParents = 0;
      this.items.forEach((item, key) => {
        if (item.parent === undefined) {
          // root node, id 0
          return;
        }

        ++itemsWithParents;
        const updatedParent = this.items.get(item.parent)!;
        updatedParent.children.push(item);
        this.items.set(item.parent, updatedParent);
        this.items.delete(key);
      });
    } while (itemsWithParents);
  }

  checkAST(node: SyntaxNode | null, parent?: number) {
    if (!node) {
      return;
    }

    switch (node.type.id) {
      case ParenExpr:
      case UnaryExpr:
      case SubqueryExpr:
      case MatrixSelector:
      case StepInvariantExpr:
        this.checkAST(node.getChild('Expr'), node.cursor().from);
        break;

      case VectorSelector:
        this.handleVectorSelector(node, parent);
        break;

      case AggregateExpr:
        this.handleAggregateExpr(node, parent);
        break;

      default:
        console.error('not implemented', node?.type.name);
        break;
    }
  }

  private print(ref: SyntaxNodeRef) {
    return this.statement.slice(ref.from, ref.to);
  }

  private handleVectorSelector(node: SyntaxNode, parent?: number) {
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
    // this.expressions.push(expression);
    // create promql.expression item, parent is?
    const item = {
      id: node.cursor().from,
      parent,
      children: [],
      expression,
    };

    if (parent && this.items.has(parent)) {
      const parentItem = this.items.get(parent)!;
      parentItem?.children.push(item);
      this.items.set(parent, parentItem);
    } else {
      this.items.set(node.cursor().from, item);
    }
  }

  private handleAggregateExpr(node: SyntaxNode, parent?: number) {
    const aggregateOp = node.firstChild?.firstChild;
    if (!aggregateOp) {
      return;
    }

    switch (aggregateOp.type.id) {
      case Topk:
      case Bottomk:
      case LimitK:
      case LimitRatio:
      case Quantile:
        // scalar parameter required
        console.error('not implemented', aggregateOp.type.name);
        break;

      case CountValues:
        // string parameter required
        console.error('not implemented', aggregateOp.type.name);
        break;

      case Count:
        // create promql.count item
        const item = {
          id: aggregateOp.cursor().from,
          parent: parent,
          children: [],
          func: promql.count,
          args: {
            expr: '', // will be populated by optimize() later
          } as AggregationParams,
        };

        // 'by (foo)' or 'without (bar)'
        const modifier = node.getChild(AggregateModifier);
        if (modifier) {
          const labels = modifier.getChild(GroupingLabels);
          if (labels) {
            const labelArray = [
              ...labels.getChildren(LabelName).map((label) => this.print(label)),
              ...labels.getChildren(QuotedLabelName).map((label) => this.print(label).slice(1, -1)),
            ];
            switch (modifier.firstChild?.type.id) {
              case By:
                item.args.by = labelArray;
                break;

              case Without:
                item.args.without = labelArray;
                break;
            }
          }
        }

        if (parent && this.items.has(parent)) {
          const parentItem = this.items.get(parent)!;
          parentItem?.children.push(item);
          this.items.set(parent, parentItem);
        } else {
          this.items.set(aggregateOp.cursor().from, item);
        }
        break;
    }
    node
      .getChild(FunctionCallBody)
      ?.getChildren('Expr')
      ?.map((child) => {
        this.checkAST(child, aggregateOp.cursor().from); // parent is the promql.count item above
      });
  }
}
