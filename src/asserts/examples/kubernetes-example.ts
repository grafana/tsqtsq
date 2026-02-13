/**
 * Kubernetes Entity and Relationship Example
 *
 * This example demonstrates how to define Kubernetes entities (Pods, Nodes, Namespaces)
 * and their relationships using the tsqtsq asserts module.
 */

import { promql } from '../../promql';
import {
  PodEntity,
  NodeEntity,
  NamespaceEntity,
  runsOn,
  createRelationship,
  createSchema,
  createStandardScope,
  createAssertsExpression,
  DiscoverySource,
} from '../index';

// Create custom scope with Kubernetes dimensions
const k8sScope = {
  env: 'asserts_env',
  site: 'asserts_site',
  cluster: 'cluster',
};

// Create a Pod entity
const podEntity = new PodEntity()
  .withScope(k8sScope)
  .definedBy({
    query: promql.group({
      expr: createAssertsExpression('kube_pod_info', { pod: '.*' }).toString(),
      by: ['pod', 'namespace', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'pod',
      namespace: 'namespace',
    },
  })
  .enrichedBy({
    // Add pod status
    query: promql.max({
      expr: 'kube_pod_status_phase',
      by: ['pod', 'namespace', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      phase: 'phase',
    },
  });

// Create a Node entity
const nodeEntity = new NodeEntity()
  .withScope(k8sScope)
  .definedBy({
    query: promql.group({
      expr: createAssertsExpression('kube_node_info', { node: '.*' }).toString(),
      by: ['node', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'node',
    },
  })
  .enrichedBy({
    // Add CPU capacity
    query: promql.max({
      expr: 'kube_node_status_capacity{resource="cpu"}',
      by: ['node', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    metricValue: 'cpu_capacity',
  })
  .enrichedBy({
    // Add memory capacity
    query: promql.max({
      expr: 'kube_node_status_capacity{resource="memory"}',
      by: ['node', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    metricValue: 'memory_capacity_bytes',
  });

// Create a Namespace entity
const namespaceEntity = new NamespaceEntity()
  .withScope(k8sScope)
  .definedBy({
    query: promql.group({
      expr: createAssertsExpression('kube_namespace_created').toString(),
      by: ['namespace', 'cluster', 'asserts_env', 'asserts_site'],
    }),
    labelValues: {
      name: 'namespace',
    },
  });

// Create RUNS_ON relationship (Pod -> Node)
const podRunsOnNode = runsOn(podEntity, nodeEntity).withPattern(
  promql.group({
    expr: 'kube_pod_info{asserts_env!=""}',
    by: ['pod', 'node', 'namespace', 'cluster', 'asserts_env', 'asserts_site'],
  })
);

// Create CONTAINS relationship (Namespace -> Pod)
const namespaceContainsPod = createRelationship(
  'CONTAINS',
  namespaceEntity,
  podEntity,
  DiscoverySource.SAMPLES
)
  .withPattern(
    promql.group({
      expr: 'kube_pod_info{asserts_env!=""}',
      by: ['namespace', 'pod', 'cluster', 'asserts_env', 'asserts_site'],
    })
  )
  .withStartEntityMatchers({
    name: 'namespace',
    cluster: 'cluster',
    env: 'asserts_env',
    site: 'asserts_site',
  })
  .withEndEntityMatchers({
    name: 'pod',
    cluster: 'cluster',
    env: 'asserts_env',
    site: 'asserts_site',
  });

// Build the complete schema
const k8sSchema = createSchema(['kube-state-metrics'])
  .addEntities([podEntity, nodeEntity, namespaceEntity])
  .addRelationships([podRunsOnNode, namespaceContainsPod]);

// Generate YAML
const yaml = k8sSchema.toYAML();

console.log('=== Kubernetes Schema YAML ===\n');
console.log(yaml);

// Inspect object structure
const schemaObject = k8sSchema.toObject();
console.log('\n=== Schema Object Structure ===\n');
console.log(JSON.stringify(schemaObject, null, 2));
