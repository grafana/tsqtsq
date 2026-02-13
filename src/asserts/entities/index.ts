import { BaseEntity } from '../base-entity';

/**
 * Service entity representing a service or workload.
 * Default name labels: "workload | service | job"
 */
export class ServiceEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Service', nameLabels || ['workload', 'service', 'job']);
  }
}

/**
 * ServiceInstance entity representing an instance of a service.
 * Default name labels: "instance"
 */
export class ServiceInstanceEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('ServiceInstance', nameLabels || 'instance');
  }
}

/**
 * Topic entity representing a message queue topic (Kafka, Pulsar, etc.).
 * Default name labels: "topic"
 */
export class TopicEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Topic', nameLabels || 'topic');
  }
}

/**
 * Database entity representing a database.
 * Default name labels: "database | db | datname"
 */
export class DatabaseEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Database', nameLabels || ['database', 'db', 'datname']);
  }
}

/**
 * Queue entity representing a message queue.
 * Default name labels: "queue"
 */
export class QueueEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Queue', nameLabels || 'queue');
  }
}

/**
 * Node entity representing a compute node (VM, host, etc.).
 * Default name labels: "node | instance"
 */
export class NodeEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Node', nameLabels || ['node', 'instance']);
  }
}

/**
 * Pod entity representing a Kubernetes pod.
 * Default name labels: "pod"
 */
export class PodEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Pod', nameLabels || 'pod');
  }
}

/**
 * Namespace entity representing a Kubernetes namespace.
 * Default name labels: "namespace"
 */
export class NamespaceEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Namespace', nameLabels || 'namespace');
  }
}

/**
 * Env entity representing an environment (dev, staging, prod, etc.).
 * Default name labels: "env | asserts_env"
 */
export class EnvEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Env', nameLabels || ['env', 'asserts_env']);
  }
}

/**
 * Site entity representing a site or cluster.
 * Default name labels: "site | cluster | asserts_site"
 */
export class SiteEntity extends BaseEntity {
  constructor(nameLabels?: string | string[]) {
    super('Site', nameLabels || ['site', 'cluster', 'asserts_site']);
  }
}
