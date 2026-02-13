import { BaseRelationship } from '../base-relationship';
import { ServiceEntity, TopicEntity } from '../entities/index';
import { produces, consumes, dependsOn, calls, createRelationship } from '../relationships/index';
import { DiscoverySource } from '../types';
import { createStandardScope } from '../scope';

describe('BaseRelationship', () => {
  describe('produces relationship', () => {
    it('should create PRODUCES relationship with auto-inferred matchers', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic);

      expect(rel.getType()).toBe('PRODUCES');
      expect(rel.getStartEntityType()).toBe('Service');
      expect(rel.getEndEntityType()).toBe('Topic');
    });

    it('should auto-infer matchers from entities', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic);
      const obj = rel.toObject();

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
    });

    it('should set pattern query', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic).withPattern(
        'sum by (job, topic, asserts_env, asserts_site) (kafka_producer_topic_record_send_total)'
      );

      const obj = rel.toObject();
      expect(obj.definedBy.pattern).toBe(
        'sum by (job, topic, asserts_env, asserts_site) (kafka_producer_topic_record_send_total)'
      );
    });

    it('should allow overriding matchers', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic)
        .withStartEntityMatchers({
          name: 'custom_job',
          env: 'custom_env',
        })
        .withEndEntityMatchers({
          name: 'custom_topic',
        });

      const obj = rel.toObject();

      expect(obj.definedBy.startEntityMatchers).toEqual({
        name: 'custom_job',
        env: 'custom_env',
      });

      expect(obj.definedBy.endEntityMatchers).toEqual({
        name: 'custom_topic',
      });
    });

    it('should set static properties', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic).withStaticProperties({
        protocol: 'kafka',
        async: true,
      });

      const obj = rel.toObject();
      expect(obj.definedBy.staticProperties).toEqual({
        protocol: 'kafka',
        async: true,
      });
    });
  });

  describe('consumes relationship', () => {
    it('should create CONSUMES relationship', () => {
      const topic = new TopicEntity().withScope(createStandardScope());
      const service = new ServiceEntity().withScope(createStandardScope());

      const rel = consumes(topic, service);

      expect(rel.getType()).toBe('CONSUMES');
      expect(rel.getStartEntityType()).toBe('Topic');
      expect(rel.getEndEntityType()).toBe('Service');
    });
  });

  describe('dependsOn relationship', () => {
    it('should create DEPENDS_ON relationship', () => {
      const service1 = new ServiceEntity('service1').withScope(
        createStandardScope()
      );
      const service2 = new ServiceEntity('service2').withScope(
        createStandardScope()
      );

      const rel = dependsOn(service1, service2);

      expect(rel.getType()).toBe('DEPENDS_ON');
      expect(rel.getStartEntityType()).toBe('Service');
      expect(rel.getEndEntityType()).toBe('Service');
    });
  });

  describe('calls relationship', () => {
    it('should create CALLS relationship', () => {
      const caller = new ServiceEntity('caller').withScope(
        createStandardScope()
      );
      const callee = new ServiceEntity('callee').withScope(
        createStandardScope()
      );

      const rel = calls(caller, callee);

      expect(rel.getType()).toBe('CALLS');
      expect(rel.getStartEntityType()).toBe('Service');
      expect(rel.getEndEntityType()).toBe('Service');
    });
  });

  describe('createRelationship with custom type', () => {
    it('should create custom relationship type', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = createRelationship('CUSTOM_TYPE', service, topic);

      expect(rel.getType()).toBe('CUSTOM_TYPE');
      expect(rel.getStartEntityType()).toBe('Service');
      expect(rel.getEndEntityType()).toBe('Topic');
    });

    it('should support custom discovery source', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = createRelationship(
        'CUSTOM_TYPE',
        service,
        topic,
        DiscoverySource.SAMPLES
      );

      const obj = rel.toObject();
      expect(obj.definedBy.source).toBe('SAMPLES');
    });
  });

  describe('toObject serialization', () => {
    it('should serialize complete relationship', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      const rel = produces(service, topic)
        .withPattern('kafka_producer_total{job!=""}')
        .withStaticProperties({ protocol: 'kafka' });

      const obj = rel.toObject();

      expect(obj).toEqual({
        type: 'PRODUCES',
        startEntityType: 'Service',
        endEntityType: 'Topic',
        definedBy: {
          source: 'AGGREGATION',
          pattern: 'kafka_producer_total{job!=""}',
          startEntityMatchers: {
            name: 'workload',
            env: 'asserts_env',
            site: 'asserts_site',
          },
          endEntityMatchers: {
            name: 'topic',
            env: 'asserts_env',
            site: 'asserts_site',
          },
          staticProperties: {
            protocol: 'kafka',
          },
        },
      });
    });

    it('should serialize relationship without optional fields', () => {
      const service = new ServiceEntity();
      const topic = new TopicEntity();

      const rel = produces(service, topic);
      const obj = rel.toObject();

      expect(obj.definedBy.staticProperties).toBeUndefined();
      expect(obj.definedBy.pattern).toBeUndefined();
    });
  });
});
