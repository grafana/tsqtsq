import { AssertsSchema, createSchema } from '../schema';
import { ServiceEntity, TopicEntity } from '../entities/index';
import { produces } from '../relationships/index';
import { createStandardScope } from '../scope';

describe('AssertsSchema', () => {
  describe('schema creation', () => {
    it('should create empty schema', () => {
      const schema = new AssertsSchema();
      const obj = schema.toObject();

      expect(obj).toEqual({});
    });

    it('should create schema with when conditions', () => {
      const schema = new AssertsSchema(['kafka_server_jmx', 'kafka_producer_jmx']);
      const obj = schema.toObject();

      expect(obj.when).toEqual(['kafka_server_jmx', 'kafka_producer_jmx']);
    });

    it('should create schema using factory', () => {
      const schema = createSchema(['redis_exporter']);
      const obj = schema.toObject();

      expect(obj.when).toEqual(['redis_exporter']);
    });
  });

  describe('adding entities', () => {
    it('should add single entity', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());

      schema.addEntity(service);
      const obj = schema.toObject();

      expect(obj.entities).toHaveLength(1);
      expect(obj.entities[0].type).toBe('Service');
    });

    it('should add multiple entities individually', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      schema.addEntity(service).addEntity(topic);
      const obj = schema.toObject();

      expect(obj.entities).toHaveLength(2);
      expect(obj.entities[0].type).toBe('Service');
      expect(obj.entities[1].type).toBe('Topic');
    });

    it('should add multiple entities at once', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());

      schema.addEntities([service, topic]);
      const obj = schema.toObject();

      expect(obj.entities).toHaveLength(2);
    });
  });

  describe('adding relationships', () => {
    it('should add single relationship', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());
      const rel = produces(service, topic);

      schema.addRelationship(rel);
      const obj = schema.toObject();

      expect(obj.relationships).toHaveLength(1);
      expect(obj.relationships[0].type).toBe('PRODUCES');
    });

    it('should add multiple relationships individually', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());
      const rel1 = produces(service, topic);
      const rel2 = produces(service, topic);

      schema.addRelationship(rel1).addRelationship(rel2);
      const obj = schema.toObject();

      expect(obj.relationships).toHaveLength(2);
    });

    it('should add multiple relationships at once', () => {
      const schema = new AssertsSchema();
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());
      const rel1 = produces(service, topic);
      const rel2 = produces(service, topic);

      schema.addRelationships([rel1, rel2]);
      const obj = schema.toObject();

      expect(obj.relationships).toHaveLength(2);
    });
  });

  describe('complete schema', () => {
    it('should build complete schema with entities and relationships', () => {
      const schema = createSchema(['kafka_server_jmx']);

      const service = new ServiceEntity()
        .withScope(createStandardScope())
        .definedBy({
          query: 'up{job!=""}',
          labelValues: { name: 'job' },
        });

      const topic = new TopicEntity()
        .withScope(createStandardScope())
        .definedBy({
          query: 'kafka_topic_partitions',
          labelValues: { name: 'topic' },
          literals: { service_type: 'kafka' },
        });

      const rel = produces(service, topic).withPattern(
        'kafka_producer_topic_record_send_total'
      );

      schema.addEntity(service).addEntity(topic).addRelationship(rel);

      const obj = schema.toObject();

      expect(obj.when).toEqual(['kafka_server_jmx']);
      expect(obj.entities).toHaveLength(2);
      expect(obj.relationships).toHaveLength(1);

      expect(obj.entities[0].type).toBe('Service');
      expect(obj.entities[0].definedBy).toBeDefined();

      expect(obj.entities[1].type).toBe('Topic');
      expect(obj.entities[1].definedBy[0].literals).toEqual({
        service_type: 'kafka',
      });

      expect(obj.relationships[0].type).toBe('PRODUCES');
      expect(obj.relationships[0].startEntityType).toBe('Service');
      expect(obj.relationships[0].endEntityType).toBe('Topic');
    });
  });

  describe('YAML serialization', () => {
    it('should serialize to valid YAML', () => {
      const schema = createSchema(['test_exporter']);

      const service = new ServiceEntity()
        .withScope(createStandardScope())
        .definedBy({
          query: 'up{job!=""}',
          labelValues: { name: 'job' },
        });

      schema.addEntity(service);

      const yaml = schema.toYAML();

      expect(yaml).toContain('when:');
      expect(yaml).toContain('- test_exporter');
      expect(yaml).toContain('entities:');
      expect(yaml).toContain('type: Service');
      expect(yaml).toContain('name: workload | service | job');
      expect(yaml).toContain('scope:');
      expect(yaml).toContain('env: asserts_env');
      expect(yaml).toContain('site: asserts_site');
    });

    it('should handle empty schema', () => {
      const schema = new AssertsSchema();
      const yaml = schema.toYAML();

      expect(yaml).toBe('{}\n');
    });

    it('should serialize complete schema', () => {
      const schema = createSchema(['kafka_jmx']);

      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());
      const rel = produces(service, topic);

      schema.addEntity(service).addEntity(topic).addRelationship(rel);

      const yaml = schema.toYAML();

      // Verify structure
      expect(yaml).toContain('when:');
      expect(yaml).toContain('entities:');
      expect(yaml).toContain('relationships:');
      expect(yaml).toContain('type: PRODUCES');
      expect(yaml).toContain('startEntityType: Service');
      expect(yaml).toContain('endEntityType: Topic');
    });
  });

  describe('method chaining', () => {
    it('should support fluent API for building schema', () => {
      const service = new ServiceEntity().withScope(createStandardScope());
      const topic = new TopicEntity().withScope(createStandardScope());
      const rel = produces(service, topic);

      const schema = createSchema(['test'])
        .addEntity(service)
        .addEntity(topic)
        .addRelationship(rel);

      const obj = schema.toObject();

      expect(obj.when).toEqual(['test']);
      expect(obj.entities).toHaveLength(2);
      expect(obj.relationships).toHaveLength(1);
    });
  });
});
