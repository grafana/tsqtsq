/**
 * Redis Entity and Relationship Example
 *
 * This example demonstrates how to define Redis database entities
 * and service-to-database relationships using the tsqtsq asserts module.
 */

import { promql } from '../../promql';
import {
  ServiceEntity,
  DatabaseEntity,
  dependsOn,
  createSchema,
  createStandardScope,
  createAssertsExpression,
} from '../index';

// Create a Redis Database entity
const redisEntity = new DatabaseEntity(['redis_database', 'database'])
  .withScope(createStandardScope())
  .definedBy({
    // Discover Redis databases from redis_connected_clients metric
    query: promql.group({
      expr: createAssertsExpression('redis_connected_clients').toString(),
      by: ['addr', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'addr',
    },
    literals: {
      service_type: 'redis',
      database_type: 'cache',
    },
  })
  .enrichedBy({
    // Add connected clients count
    query: promql.max({
      expr: 'redis_connected_clients',
      by: ['addr', 'asserts_env', 'asserts_site'],
    }),
    metricValue: 'connected_clients',
  })
  .enrichedBy({
    // Add memory usage
    query: promql.max({
      expr: 'redis_memory_used_bytes',
      by: ['addr', 'asserts_env', 'asserts_site'],
    }),
    metricValue: 'memory_used_bytes',
  });

// Create a Service entity
const serviceEntity = new ServiceEntity()
  .withScope(createStandardScope())
  .definedBy({
    query: promql.group({
      expr: createAssertsExpression('up', { job: '.*' }).toString(),
      by: ['job', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'job',
    },
  });

// Create DEPENDS_ON relationship (Service -> Redis Database)
const dependsOnRelationship = dependsOn(serviceEntity, redisEntity)
  .withPattern(
    promql.sum({
      expr: 'redis_commands_total{asserts_env!=""}',
      by: ['job', 'addr', 'asserts_env', 'asserts_site'],
    })
  )
  .withStaticProperties({
    connection_type: 'tcp',
  });

// Build the complete schema
const redisSchema = createSchema(['redis_exporter'])
  .addEntity(redisEntity)
  .addEntity(serviceEntity)
  .addRelationship(dependsOnRelationship);

// Generate YAML
const yaml = redisSchema.toYAML();

console.log('=== Redis Schema YAML ===\n');
console.log(yaml);

// Inspect object structure
const schemaObject = redisSchema.toObject();
console.log('\n=== Schema Object Structure ===\n');
console.log(JSON.stringify(schemaObject, null, 2));
