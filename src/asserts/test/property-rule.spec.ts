import { PropertyRule, createPropertyRule } from '../property-rule';
import { Expression } from '../../expression';
import { MatchingOperator } from '../../types';

describe('PropertyRule', () => {
  describe('fluent API', () => {
    it('should build rule with query', () => {
      const rule = new PropertyRule().withQuery('up{job!=""}');

      const obj = rule.toObject();
      expect(obj.query).toBe('up{job!=""}');
    });

    it('should build rule with Expression query', () => {
      const expr = new Expression({
        metric: 'up',
        values: { job: '.*' },
        defaultOperator: MatchingOperator.regexMatch,
      });

      const rule = new PropertyRule().withQuery(expr);

      const obj = rule.toObject();
      expect(obj.query).toBe('up{job=~".*"}');
    });

    it('should build rule with label values', () => {
      const rule = new PropertyRule().withLabelValues({
        name: 'job',
        environment: 'env',
      });

      const obj = rule.toObject();
      expect(obj.labelValues).toEqual({
        name: 'job',
        environment: 'env',
      });
    });

    it('should merge multiple label value calls', () => {
      const rule = new PropertyRule()
        .withLabelValues({ name: 'job' })
        .withLabelValues({ env: 'asserts_env' });

      const obj = rule.toObject();
      expect(obj.labelValues).toEqual({
        name: 'job',
        env: 'asserts_env',
      });
    });

    it('should build rule with literals', () => {
      const rule = new PropertyRule().withLiterals({
        service_type: 'kafka',
        port: 9092,
        ssl_enabled: true,
      });

      const obj = rule.toObject();
      expect(obj.literals).toEqual({
        service_type: 'kafka',
        port: 9092,
        ssl_enabled: true,
      });
    });

    it('should merge multiple literal calls', () => {
      const rule = new PropertyRule()
        .withLiterals({ type: 'kafka' })
        .withLiterals({ version: '2.8' });

      const obj = rule.toObject();
      expect(obj.literals).toEqual({
        type: 'kafka',
        version: '2.8',
      });
    });

    it('should build rule with metric value', () => {
      const rule = new PropertyRule().withMetricValue('availability');

      const obj = rule.toObject();
      expect(obj.metricValue).toBe('availability');
    });

    it('should chain all methods', () => {
      const rule = new PropertyRule()
        .withQuery('up{job!=""}')
        .withLabelValues({ name: 'job' })
        .withLiterals({ type: 'service' })
        .withMetricValue('status');

      const obj = rule.toObject();
      expect(obj.query).toBe('up{job!=""}');
      expect(obj.labelValues).toEqual({ name: 'job' });
      expect(obj.literals).toEqual({ type: 'service' });
      expect(obj.metricValue).toBe('status');
    });
  });

  describe('createPropertyRule factory', () => {
    it('should create empty rule', () => {
      const rule = createPropertyRule();
      const obj = rule.toObject();

      expect(obj).toEqual({});
    });

    it('should create rule from definition object', () => {
      const rule = createPropertyRule({
        query: 'up{job!=""}',
        labelValues: { name: 'job' },
        literals: { type: 'http' },
        metricValue: 'status',
      });

      const obj = rule.toObject();
      expect(obj.query).toBe('up{job!=""}');
      expect(obj.labelValues).toEqual({ name: 'job' });
      expect(obj.literals).toEqual({ type: 'http' });
      expect(obj.metricValue).toBe('status');
    });

    it('should create rule from partial definition', () => {
      const rule = createPropertyRule({
        query: 'up',
        labelValues: { name: 'job' },
      });

      const obj = rule.toObject();
      expect(obj.query).toBe('up');
      expect(obj.labelValues).toEqual({ name: 'job' });
      expect(obj.literals).toBeUndefined();
      expect(obj.metricValue).toBeUndefined();
    });

    it('should support Expression in definition', () => {
      const expr = new Expression({
        metric: 'kafka_topic_partitions',
        values: { topic: '.*' },
        defaultOperator: MatchingOperator.regexMatch,
      });

      const rule = createPropertyRule({
        query: expr,
        labelValues: { name: 'topic' },
      });

      const obj = rule.toObject();
      expect(obj.query).toBe('kafka_topic_partitions{topic=~".*"}');
    });
  });

  describe('toObject serialization', () => {
    it('should only include defined fields', () => {
      const rule = new PropertyRule().withQuery('up');
      const obj = rule.toObject();

      expect(obj.query).toBe('up');
      expect(obj.labelValues).toBeUndefined();
      expect(obj.literals).toBeUndefined();
      expect(obj.metricValue).toBeUndefined();
    });

    it('should resolve Expression to string', () => {
      const expr = new Expression({
        metric: 'test_metric',
        values: {},
        defaultOperator: MatchingOperator.regexMatch,
      });

      const rule = new PropertyRule().withQuery(expr);
      const obj = rule.toObject();

      expect(typeof obj.query).toBe('string');
      expect(obj.query).toBe('test_metric{}');
    });
  });
});
