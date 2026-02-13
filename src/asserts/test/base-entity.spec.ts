import { BaseEntity } from '../base-entity';
import { ServiceEntity, TopicEntity } from '../entities/index';
import { createStandardScope } from '../scope';

describe('BaseEntity', () => {
  describe('ServiceEntity', () => {
    it('should create entity with default name labels', () => {
      const entity = new ServiceEntity();
      expect(entity.getType()).toBe('Service');
      expect(entity.getName()).toEqual(['workload', 'service', 'job']);
    });

    it('should create entity with custom name labels', () => {
      const entity = new ServiceEntity('custom_job');
      expect(entity.getName()).toBe('custom_job');
    });

    it('should set scope dimensions', () => {
      const entity = new ServiceEntity().withScope(createStandardScope());
      expect(entity.getScope()).toEqual({
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });

    it('should add discovery rules', () => {
      const entity = new ServiceEntity()
        .definedBy({
          query: 'group by (job) (up{job!=""})',
          labelValues: { name: 'job' },
        })
        .definedBy({
          query: 'group by (service) (up{service!=""})',
          labelValues: { name: 'service' },
        });

      const obj = entity.toObject();
      expect(obj.definedBy).toHaveLength(2);
      expect(obj.definedBy[0].query).toBe('group by (job) (up{job!=""})');
      expect(obj.definedBy[1].query).toBe('group by (service) (up{service!=""})');
    });

    it('should add enrichment rules', () => {
      const entity = new ServiceEntity().enrichedBy({
        query: 'max by (job) (up)',
        metricValue: 'availability',
      });

      const obj = entity.toObject();
      expect(obj.enrichedBy).toHaveLength(1);
      expect(obj.enrichedBy[0].metricValue).toBe('availability');
    });

    it('should generate entity matchers with first name label', () => {
      const entity = new ServiceEntity().withScope(createStandardScope());
      const matchers = entity.getEntityMatchers();

      expect(matchers).toEqual({
        name: 'workload',
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });

    it('should serialize to object with pipe-separated name alternatives', () => {
      const entity = new ServiceEntity().withScope(createStandardScope());
      const obj = entity.toObject();

      expect(obj.type).toBe('Service');
      expect(obj.name).toBe('workload | service | job');
      expect(obj.scope).toEqual({
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });
  });

  describe('TopicEntity', () => {
    it('should create entity with single name label', () => {
      const entity = new TopicEntity();
      expect(entity.getType()).toBe('Topic');
      expect(entity.getName()).toBe('topic');
    });

    it('should generate entity matchers for single name label', () => {
      const entity = new TopicEntity().withScope(createStandardScope());
      const matchers = entity.getEntityMatchers();

      expect(matchers).toEqual({
        name: 'topic',
        env: 'asserts_env',
        site: 'asserts_site',
      });
    });

    it('should serialize single name label as string', () => {
      const entity = new TopicEntity();
      const obj = entity.toObject();

      expect(obj.name).toBe('topic');
      expect(typeof obj.name).toBe('string');
    });

    it('should support lookup configuration', () => {
      const entity = new TopicEntity().withLookup({
        Service: ['job', 'topic'],
      });

      const obj = entity.toObject();
      expect(obj.lookup).toEqual({
        Service: ['job', 'topic'],
      });
    });
  });

  describe('toObject serialization', () => {
    it('should only include defined properties', () => {
      const entity = new ServiceEntity();
      const obj = entity.toObject();

      expect(obj.type).toBe('Service');
      expect(obj.name).toBe('workload | service | job');
      expect(obj.scope).toBeUndefined();
      expect(obj.lookup).toBeUndefined();
      expect(obj.definedBy).toBeUndefined();
      expect(obj.enrichedBy).toBeUndefined();
    });

    it('should include all configured properties', () => {
      const entity = new ServiceEntity()
        .withScope(createStandardScope())
        .withLookup({ Node: ['instance'] })
        .definedBy({
          query: 'up',
          labelValues: { name: 'job' },
        })
        .enrichedBy({
          literals: { service_type: 'http' },
        });

      const obj = entity.toObject();

      expect(obj.scope).toBeDefined();
      expect(obj.lookup).toBeDefined();
      expect(obj.definedBy).toBeDefined();
      expect(obj.enrichedBy).toBeDefined();
    });
  });
});
