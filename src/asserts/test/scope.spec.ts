import {
  createStandardScope,
  buildLabelNamePattern,
  createAssertsExpression,
  groupByWithScope,
  countByPattern,
  sumByWithScope,
} from '../scope';
import { Expression } from '../../expression';
import { MatchingOperator } from '../../types';

describe('Scope utilities', () => {
  describe('createStandardScope', () => {
    it('should return standard env and site scope', () => {
      const scope = createStandardScope();

      expect(scope).toEqual({
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });
  });

  describe('buildLabelNamePattern', () => {
    it('should join single label', () => {
      const pattern = buildLabelNamePattern('job');
      expect(pattern).toBe('job');
    });

    it('should join multiple labels with pipe separator', () => {
      const pattern = buildLabelNamePattern('workload', 'service', 'job');
      expect(pattern).toBe('workload | service | job');
    });

    it('should handle array of labels', () => {
      const labels = ['database', 'db', 'datname'];
      const pattern = buildLabelNamePattern(...labels);
      expect(pattern).toBe('database | db | datname');
    });
  });

  describe('createAssertsExpression', () => {
    it('should create expression with asserts_env filter', () => {
      const expr = createAssertsExpression('up');
      const result = expr.toString();

      expect(result).toContain('asserts_env!=""');
    });

    it('should create expression with metric and labels', () => {
      const expr = createAssertsExpression('kafka_topic_partitions', {
        topic: '.*',
      });
      const result = expr.toString();

      expect(result).toBe('kafka_topic_partitions{asserts_env!="", topic=~".*"}');
    });

    it('should use regex match as default operator', () => {
      const expr = createAssertsExpression('test_metric', { label: 'value' });
      const result = expr.toString();

      expect(result).toContain('label=~"value"');
    });

    it('should support custom operator', () => {
      const expr = createAssertsExpression(
        'test_metric',
        { label: 'value' },
        MatchingOperator.equal
      );
      const result = expr.toString();

      expect(result).toContain('label="value"');
    });

    it('should work with empty values', () => {
      const expr = createAssertsExpression('up');
      const result = expr.toString();

      expect(result).toBe('up{asserts_env!=""}');
    });
  });

  describe('groupByWithScope', () => {
    it('should group by labels with scope dimensions', () => {
      const result = groupByWithScope('up{job!=""}', ['job']);

      expect(result).toBe(
        'group by (job, asserts_env, asserts_site) (up{job!=""})'
      );
    });

    it('should handle multiple labels', () => {
      const result = groupByWithScope('kafka_topic_partitions', [
        'topic',
        'partition',
      ]);

      expect(result).toBe(
        'group by (topic, partition, asserts_env, asserts_site) (kafka_topic_partitions)'
      );
    });

    it('should accept Expression as input', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: { label: 'value' },
        defaultOperator: MatchingOperator.regexMatch,
      });

      const result = groupByWithScope(expr, ['label']);

      expect(result).toBe(
        'group by (label, asserts_env, asserts_site) (test_metric{label=~"value"})'
      );
    });

    it('should support custom scope', () => {
      const customScope = {
        env: 'environment',
        region: 'aws_region',
      };

      const result = groupByWithScope('up', ['job'], customScope);

      expect(result).toBe('group by (job, environment, aws_region) (up)');
    });
  });

  describe('countByPattern', () => {
    it('should generate count by query', () => {
      const result = countByPattern('kafka_topic_partitions', ['topic']);

      expect(result).toBe('count by (topic) (kafka_topic_partitions)');
    });

    it('should handle multiple labels', () => {
      const result = countByPattern('up{job!=""}', ['job', 'instance']);

      expect(result).toBe('count by (job, instance) (up{job!=""})');
    });

    it('should accept Expression as input', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: {},
        defaultOperator: MatchingOperator.regexMatch,
      });

      const result = countByPattern(expr, ['label']);

      expect(result).toBe('count by (label) (test_metric{})');
    });
  });

  describe('sumByWithScope', () => {
    it('should sum by labels with scope dimensions', () => {
      const result = sumByWithScope('kafka_producer_total', ['job']);

      expect(result).toBe(
        'sum by (job, asserts_env, asserts_site) (kafka_producer_total)'
      );
    });

    it('should handle multiple labels', () => {
      const result = sumByWithScope('kafka_producer_topic_record_send_total', [
        'job',
        'topic',
      ]);

      expect(result).toBe(
        'sum by (job, topic, asserts_env, asserts_site) (kafka_producer_topic_record_send_total)'
      );
    });

    it('should accept Expression as input', () => {
      const expr = new Expression({
        metric: 'rate_metric',
        values: { job: '.*' },
        defaultOperator: MatchingOperator.regexMatch,
      });

      const result = sumByWithScope(expr, ['job']);

      expect(result).toBe(
        'sum by (job, asserts_env, asserts_site) (rate_metric{job=~".*"})'
      );
    });

    it('should support custom scope', () => {
      const customScope = {
        namespace: 'k8s_namespace',
        cluster: 'k8s_cluster',
      };

      const result = sumByWithScope('up', ['pod'], customScope);

      expect(result).toBe('sum by (pod, k8s_namespace, k8s_cluster) (up)');
    });
  });

  describe('integration with Expression', () => {
    it('should work seamlessly with Expression and helpers', () => {
      const expr = createAssertsExpression('kafka_topic_partitions', {
        topic: 'test.*',
      });

      const grouped = groupByWithScope(expr, ['topic']);

      expect(grouped).toContain('kafka_topic_partitions');
      expect(grouped).toContain('asserts_env!=""');
      expect(grouped).toContain('topic=~"test.*"');
      expect(grouped).toContain('group by');
    });
  });
});
