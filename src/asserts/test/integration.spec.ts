/**
 * Integration tests that verify generated YAML structure matches
 * the format used in asserts-yoda repository.
 */

import * as yaml from 'js-yaml';
import { promql } from '../../promql';
import {
  ServiceEntity,
  TopicEntity,
  produces,
  consumes,
  createSchema,
  createStandardScope,
  createAssertsExpression,
} from '../index';

describe('Integration: Generated YAML Structure', () => {
  describe('Kafka-like entities', () => {
    it('should generate Topic entity with correct structure', () => {
      const topicEntity = new TopicEntity()
        .withScope({
          namespace: 'namespace',
          env: 'asserts_env',
          site: 'asserts_site',
        })
        .definedBy({
          query: promql.count({
            expr: 'kafka_topic_partition_replicas{asserts_env!="", topic!=""}',
            by: ['job', 'instance', 'topic', 'namespace', 'asserts_env', 'asserts_site'],
          }),
          labelValues: {
            job: 'job',
            instance: 'instance',
          },
          metricValue: 'partitions',
          literals: {
            asserts_subtype: 'topic',
            service_type: 'topic',
            asserts_broker_type: 'kafka',
          },
        });

      const obj = topicEntity.toObject();

      // Verify entity structure matches asserts-yoda format
      expect(obj.type).toBe('Topic');
      expect(obj.name).toBe('topic');
      expect(obj.scope).toEqual({
        namespace: 'namespace',
        env: 'asserts_env',
        site: 'asserts_site',
      });
      expect(obj.definedBy).toHaveLength(1);
      expect(obj.definedBy[0].query).toContain('count by');
      expect(obj.definedBy[0].labelValues).toEqual({
        job: 'job',
        instance: 'instance',
      });
      expect(obj.definedBy[0].metricValue).toBe('partitions');
      expect(obj.definedBy[0].literals).toEqual({
        asserts_subtype: 'topic',
        service_type: 'topic',
        asserts_broker_type: 'kafka',
      });
    });

    it('should generate Service entity with enrichment', () => {
      const serviceEntity = new ServiceEntity()
        .withScope({
          namespace: 'namespace',
          env: 'asserts_env',
          site: 'asserts_site',
        })
        .withLookup({
          workload: ['workload', 'deployment', 'statefulset'],
          service: ['service'],
          job: ['job'],
        })
        .enrichedBy({
          query: promql.group({
            expr: 'kafka_producer_topic_record_send_total{asserts_env!="", client_id!=""}',
            by: ['job', 'service', 'namespace', 'asserts_env', 'asserts_site'],
          }),
          literals: {
            service_type: 'kafka-client',
          },
        });

      const obj = serviceEntity.toObject();

      // Verify structure matches asserts-yoda format
      expect(obj.type).toBe('Service');
      expect(obj.name).toBe('workload | service | job');
      expect(obj.scope).toEqual({
        namespace: 'namespace',
        env: 'asserts_env',
        site: 'asserts_site',
      });
      expect(obj.lookup).toBeDefined();
      expect(obj.enrichedBy).toHaveLength(1);
      expect(obj.enrichedBy[0].literals).toEqual({
        service_type: 'kafka-client',
      });
    });
  });

  describe('Kafka-like relationships', () => {
    it('should generate PRODUCES relationship with correct structure', () => {
      const serviceEntity = new ServiceEntity().withScope(createStandardScope());
      const topicEntity = new TopicEntity().withScope(createStandardScope());

      const rel = produces(serviceEntity, topicEntity)
        .withPattern(
          promql.group({
            expr: 'kafka_producer_topic_record_send_total{asserts_env!="", topic!=""}',
            by: ['job', 'topic', 'asserts_env', 'asserts_site'],
          })
        )
        .withStaticProperties({
          alertBackPropagate: false,
        });

      const obj = rel.toObject();

      // Verify relationship structure matches asserts-yoda format
      expect(obj.type).toBe('PRODUCES');
      expect(obj.startEntityType).toBe('Service');
      expect(obj.endEntityType).toBe('Topic');
      expect(obj.definedBy).toBeDefined();
      expect(obj.definedBy.source).toBe('AGGREGATION');
      expect(obj.definedBy.pattern).toContain('group by');
      expect(obj.definedBy.pattern).toContain('kafka_producer_topic_record_send_total');
      expect(obj.definedBy.startEntityMatchers).toEqual({
        name: 'workload',
        env: 'asserts_env',
        site: 'asserts_site',
      });
      expect(obj.definedBy.endEntityMatchers).toEqual({
        name: 'topic',
        env: 'asserts_env',
        site: 'asserts_site',
      });
      expect(obj.definedBy.staticProperties).toEqual({
        alertBackPropagate: false,
      });
    });

    it('should generate CONSUMES relationship with correct structure', () => {
      const topicEntity = new TopicEntity().withScope(createStandardScope());
      const serviceEntity = new ServiceEntity().withScope(createStandardScope());

      const rel = consumes(topicEntity, serviceEntity)
        .withPattern(
          promql.group({
            expr: 'kafka_consumer_fetch_manager_records_consumed_total{asserts_env!="", topic!=""}',
            by: ['job', 'topic', 'asserts_env', 'asserts_site'],
          })
        )
        .withStaticProperties({
          alertBackPropagate: false,
        });

      const obj = rel.toObject();

      // Verify relationship structure
      expect(obj.type).toBe('CONSUMES');
      expect(obj.startEntityType).toBe('Topic');
      expect(obj.endEntityType).toBe('Service');
      expect(obj.definedBy.pattern).toContain('kafka_consumer_fetch_manager_records_consumed_total');
      expect(obj.definedBy.startEntityMatchers.name).toBe('topic');
      expect(obj.definedBy.endEntityMatchers.name).toBe('workload');
    });
  });

  describe('Redis-like entities', () => {
    it('should generate Service enrichment for Redis', () => {
      const serviceEntity = new ServiceEntity()
        .withScope({
          namespace: 'namespace',
          env: 'asserts_env',
          site: 'asserts_site',
        })
        .withLookup({
          workload: ['workload', 'deployment', 'statefulset'],
          service: ['service'],
          job: ['job'],
        })
        .enrichedBy({
          query: promql.group({
            expr: 'redis_instance_info{asserts_env!=""}',
            by: ['job', 'service', 'redis_version', 'namespace', 'asserts_env', 'asserts_site'],
          }),
          literals: {
            service_type: 'redis',
          },
          labelValues: {
            version: 'redis_version',
          },
        });

      const obj = serviceEntity.toObject();

      // Verify structure matches asserts-yoda Redis format
      expect(obj.type).toBe('Service');
      expect(obj.enrichedBy).toHaveLength(1);
      expect(obj.enrichedBy[0].query).toContain('redis_instance_info');
      expect(obj.enrichedBy[0].literals).toEqual({
        service_type: 'redis',
      });
      expect(obj.enrichedBy[0].labelValues).toEqual({
        version: 'redis_version',
      });
    });
  });

  describe('Complete schema YAML generation', () => {
    it('should generate valid YAML with correct top-level structure', () => {
      const schema = createSchema(['kafka_server_jmx', 'kafka_producer_jmx']);

      const topicEntity = new TopicEntity().withScope(createStandardScope());
      const serviceEntity = new ServiceEntity().withScope(createStandardScope());
      const rel = produces(serviceEntity, topicEntity);

      schema.addEntity(topicEntity).addEntity(serviceEntity).addRelationship(rel);

      const yamlStr = schema.toYAML();
      const parsed = yaml.load(yamlStr) as any;

      // Verify top-level structure matches asserts-yoda format
      expect(parsed.when).toEqual(['kafka_server_jmx', 'kafka_producer_jmx']);
      expect(parsed.entities).toBeDefined();
      expect(Array.isArray(parsed.entities)).toBe(true);
      expect(parsed.entities.length).toBe(2);
      expect(parsed.relationships).toBeDefined();
      expect(Array.isArray(parsed.relationships)).toBe(true);
      expect(parsed.relationships.length).toBe(1);

      // Verify entities have correct structure
      const topic = parsed.entities.find((e: any) => e.type === 'Topic');
      expect(topic).toBeDefined();
      expect(topic.name).toBe('topic');
      expect(topic.scope).toBeDefined();
      expect(topic.scope.env).toBe('asserts_env');
      expect(topic.scope.site).toBe('asserts_site');

      // Verify relationships have correct structure
      const relationship = parsed.relationships[0];
      expect(relationship.type).toBe('PRODUCES');
      expect(relationship.startEntityType).toBe('Service');
      expect(relationship.endEntityType).toBe('Topic');
      expect(relationship.definedBy).toBeDefined();
      expect(relationship.definedBy.source).toBe('AGGREGATION');
      expect(relationship.definedBy.startEntityMatchers).toBeDefined();
      expect(relationship.definedBy.endEntityMatchers).toBeDefined();
    });

    it('should generate multi-line PromQL queries correctly', () => {
      const schema = createSchema();

      const serviceEntity = new ServiceEntity()
        .withScope(createStandardScope())
        .enrichedBy({
          query: `group by (job, service, namespace, asserts_env, asserts_site) (
  kafka_producer_topic_record_send_total{asserts_env!="", client_id!=""}
)
or
group by (job, service, namespace, asserts_env, asserts_site) (
  kafka_consumer_fetch_manager_bytes_consumed_total{asserts_env!="", client_id!=""}
)`,
          literals: {
            service_type: 'kafka-client',
          },
        });

      schema.addEntity(serviceEntity);

      const yamlStr = schema.toYAML();

      // Verify multi-line query is present in YAML
      expect(yamlStr).toContain('kafka_producer_topic_record_send_total');
      expect(yamlStr).toContain('kafka_consumer_fetch_manager_bytes_consumed_total');
      expect(yamlStr).toContain('or');

      // Parse and verify structure
      const parsed = yaml.load(yamlStr) as any;
      expect(parsed.entities[0].enrichedBy[0].query).toContain('or');
    });
  });

  describe('Automatic matcher inference', () => {
    it('should correctly infer matchers from entity configuration', () => {
      const serviceEntity = new ServiceEntity().withScope({
        namespace: 'namespace',
        env: 'asserts_env',
        site: 'asserts_site',
      });

      const topicEntity = new TopicEntity().withScope({
        env: 'asserts_env',
        site: 'asserts_site',
      });

      const rel = produces(serviceEntity, topicEntity);
      const obj = rel.toObject();

      // Verify matchers match the entity scope
      expect(obj.definedBy.startEntityMatchers).toEqual({
        name: 'workload', // First name label from ServiceEntity
        namespace: 'namespace',
        env: 'asserts_env',
        site: 'asserts_site',
      });

      expect(obj.definedBy.endEntityMatchers).toEqual({
        name: 'topic', // Name label from TopicEntity
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });

    it('should allow overriding auto-inferred matchers', () => {
      const serviceEntity = new ServiceEntity().withScope(createStandardScope());
      const topicEntity = new TopicEntity().withScope(createStandardScope());

      const rel = produces(serviceEntity, topicEntity)
        .withStartEntityMatchers({
          name: 'job', // Override to use 'job' instead of 'workload'
          env: 'asserts_env',
          site: 'asserts_site',
        })
        .withEndEntityMatchers({
          name: 'topic',
          namespace: 'namespace', // Add namespace matcher
          env: 'asserts_env',
          site: 'asserts_site',
        });

      const obj = rel.toObject();

      // Verify custom matchers are used
      expect(obj.definedBy.startEntityMatchers.name).toBe('job');
      expect(obj.definedBy.endEntityMatchers.namespace).toBe('namespace');
    });
  });
});
