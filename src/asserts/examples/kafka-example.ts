/**
 * Kafka Entity and Relationship Example
 *
 * This example demonstrates how to define Kafka entities (Topics, Services)
 * and relationships (PRODUCES, CONSUMES) using the tsqtsq asserts module.
 *
 * The generated YAML can be used with Grafana Asserts to discover and model
 * Kafka topics and their producer/consumer relationships.
 */

import { promql } from '../../promql';
import {
  ServiceEntity,
  TopicEntity,
  produces,
  consumes,
  createSchema,
  createStandardScope,
  createAssertsExpression,
  sumByWithScope,
} from '../index';

// Create a Kafka Topic entity
const topicEntity = new TopicEntity()
  .withScope(createStandardScope())
  .definedBy({
    // Discover topics from kafka_topic_partitions metric
    query: promql.group({
      expr: createAssertsExpression('kafka_topic_partitions', {
        topic: '.*',
      }).toString(),
      by: ['topic', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'topic',
    },
    literals: {
      service_type: 'kafka',
    },
  })
  .enrichedBy({
    // Add partition count as a property
    query: promql.sum({
      expr: 'kafka_topic_partitions',
      by: ['topic', 'asserts_env', 'asserts_site'],
    }),
    metricValue: 'partition_count',
  });

// Create a Service entity (represents Kafka producers/consumers)
const serviceEntity = new ServiceEntity()
  .withScope(createStandardScope())
  .definedBy({
    // Discover services from up metric
    query: promql.group({
      expr: createAssertsExpression('up', { job: '.*' }).toString(),
      by: ['job', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'job',
    },
  });

// Create PRODUCES relationship (Service -> Topic)
const producesRelationship = produces(serviceEntity, topicEntity).withPattern(
  sumByWithScope('kafka_producer_topic_record_send_total', ['job', 'topic'])
);

// Create CONSUMES relationship (Topic -> Service)
const consumesRelationship = consumes(topicEntity, serviceEntity).withPattern(
  sumByWithScope('kafka_consumer_fetch_manager_records_consumed_total', [
    'job',
    'topic',
  ])
);

// Build the complete schema
const kafkaSchema = createSchema(['kafka_server_jmx', 'kafka_producer_jmx'])
  .addEntity(topicEntity)
  .addEntity(serviceEntity)
  .addRelationship(producesRelationship)
  .addRelationship(consumesRelationship);

// Generate YAML
const yaml = kafkaSchema.toYAML();

console.log('=== Kafka Schema YAML ===\n');
console.log(yaml);

// You can also inspect the intermediate object structure
const schemaObject = kafkaSchema.toObject();
console.log('\n=== Schema Object Structure ===\n');
console.log(JSON.stringify(schemaObject, null, 2));
