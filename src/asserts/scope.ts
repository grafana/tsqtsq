import { Expression } from '../expression';
import { MatchingOperator } from '../types';
import { ScopeDimension } from './types';
import { promql } from '../promql';

/**
 * Create standard Asserts scope dimensions.
 * Returns env and site scope dimensions mapped to asserts_env and asserts_site labels.
 * @returns Standard scope dimension mapping
 */
export function createStandardScope(): ScopeDimension {
  return {
    env: 'asserts_env',
    site: 'asserts_site',
  };
}

/**
 * Build a label name pattern from multiple alternatives.
 * Joins label names with " | " for use in entity name definitions.
 *
 * @param labels Array of label names
 * @returns Pipe-separated label pattern string
 *
 * @example
 * buildLabelNamePattern(['workload', 'service', 'job'])
 * // Returns: "workload | service | job"
 */
export function buildLabelNamePattern(...labels: string[]): string {
  return labels.join(' | ');
}

/**
 * Create an Expression with default Asserts filter (asserts_env!="").
 * Useful for entity discovery queries that should only match Asserts-instrumented metrics.
 *
 * @param metric Metric name
 * @param values Optional label values
 * @param defaultOperator Optional default matching operator
 * @returns Expression instance with asserts_env filter
 *
 * @example
 * createAssertsExpression('kafka_topic_partitions', { topic: '.*' })
 * // Returns Expression for: kafka_topic_partitions{asserts_env!="",topic=~".*"}
 */
export function createAssertsExpression(
  metric: string,
  values?: { [key: string]: string },
  defaultOperator: MatchingOperator = MatchingOperator.regexMatch
): Expression {
  const expr = new Expression({
    metric,
    values: values || {},
    defaultOperator,
    defaultSelectors: [
      {
        label: 'asserts_env',
        value: '',
        operator: MatchingOperator.notEqual,
      },
    ],
  });

  return expr;
}

/**
 * Generate a group by aggregation with scope labels included.
 * Automatically includes standard scope dimensions (env, site) in the group by clause.
 *
 * @param expr Expression or PromQL query string
 * @param additionalLabels Additional labels to group by
 * @param scope Optional scope dimensions (defaults to standard scope)
 * @returns PromQL group by query string
 *
 * @example
 * groupByWithScope('kafka_topic_partitions{topic!=""}', ['topic'])
 * // Returns: group by (topic, asserts_env, asserts_site) (kafka_topic_partitions{topic!=""})
 */
export function groupByWithScope(
  expr: string | Expression,
  additionalLabels: string[],
  scope: ScopeDimension = createStandardScope()
): string {
  const exprStr = typeof expr === 'string' ? expr : expr.toString();
  const scopeLabels = Object.values(scope);
  const allLabels = [...additionalLabels, ...scopeLabels];

  return promql.group({ expr: exprStr, by: allLabels });
}

/**
 * Generate a count by aggregation pattern.
 * Common pattern for discovering entities by counting unique label combinations.
 *
 * @param expr Expression or PromQL query string
 * @param labels Labels to count by
 * @returns PromQL count query string
 *
 * @example
 * countByPattern('kafka_topic_partitions', ['topic', 'asserts_env'])
 * // Returns: count by (topic, asserts_env) (kafka_topic_partitions)
 */
export function countByPattern(
  expr: string | Expression,
  labels: string[]
): string {
  const exprStr = typeof expr === 'string' ? expr : expr.toString();
  return promql.count({ expr: exprStr, by: labels });
}

/**
 * Generate a sum by aggregation with scope labels included.
 * Automatically includes standard scope dimensions (env, site) in the sum by clause.
 *
 * @param expr Expression or PromQL query string
 * @param additionalLabels Additional labels to sum by
 * @param scope Optional scope dimensions (defaults to standard scope)
 * @returns PromQL sum by query string
 *
 * @example
 * sumByWithScope('kafka_producer_topic_record_send_total', ['job', 'topic'])
 * // Returns: sum by (job, topic, asserts_env, asserts_site) (kafka_producer_topic_record_send_total)
 */
export function sumByWithScope(
  expr: string | Expression,
  additionalLabels: string[],
  scope: ScopeDimension = createStandardScope()
): string {
  const exprStr = typeof expr === 'string' ? expr : expr.toString();
  const scopeLabels = Object.values(scope);
  const allLabels = [...additionalLabels, ...scopeLabels];

  return promql.sum({ expr: exprStr, by: allLabels });
}
