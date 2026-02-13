import { BaseRelationship } from '../base-relationship';
import { Entity, DiscoverySource } from '../types';
import { TopicEntity } from '../entities/index';

/**
 * Concrete relationship class implementation.
 * Used by factory functions to create typed relationships.
 */
class ConcreteRelationship<
  TStart extends Entity = Entity,
  TEnd extends Entity = Entity
> extends BaseRelationship<TStart, TEnd> {}

/**
 * Create a PRODUCES relationship from a service to a topic.
 * Represents a service that produces messages to a topic.
 *
 * @param start Start entity (typically a Service)
 * @param end End entity (must be a Topic)
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function produces<TStart extends Entity>(
  start: TStart,
  end: TopicEntity,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TopicEntity> {
  return new ConcreteRelationship('PRODUCES', start, end, source);
}

/**
 * Create a CONSUMES relationship from a topic to a service.
 * Represents a service that consumes messages from a topic.
 *
 * @param start Start entity (must be a Topic)
 * @param end End entity (typically a Service)
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function consumes<TEnd extends Entity>(
  start: TopicEntity,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TopicEntity, TEnd> {
  return new ConcreteRelationship('CONSUMES', start, end, source);
}

/**
 * Create a DEPENDS_ON relationship between two entities.
 * Represents a dependency from one entity to another.
 *
 * @param start Start entity
 * @param end End entity
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function dependsOn<TStart extends Entity, TEnd extends Entity>(
  start: TStart,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TEnd> {
  return new ConcreteRelationship('DEPENDS_ON', start, end, source);
}

/**
 * Create a CALLS relationship between two services.
 * Represents a service calling another service.
 *
 * @param start Start entity (caller service)
 * @param end End entity (callee service)
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function calls<TStart extends Entity, TEnd extends Entity>(
  start: TStart,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TEnd> {
  return new ConcreteRelationship('CALLS', start, end, source);
}

/**
 * Create a RUNS_ON relationship from a service to a node.
 * Represents a service running on a node/host.
 *
 * @param start Start entity (typically a Service or Pod)
 * @param end End entity (typically a Node)
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function runsOn<TStart extends Entity, TEnd extends Entity>(
  start: TStart,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TEnd> {
  return new ConcreteRelationship('RUNS_ON', start, end, source);
}

/**
 * Create a custom relationship with a specified type.
 * Use this for relationship types not covered by the specific factory functions.
 *
 * @param type Relationship type (e.g., "CUSTOM_TYPE")
 * @param start Start entity
 * @param end End entity
 * @param source Discovery source (defaults to AGGREGATION)
 * @returns Relationship instance
 */
export function createRelationship<TStart extends Entity, TEnd extends Entity>(
  type: string,
  start: TStart,
  end: TEnd,
  source: DiscoverySource = DiscoverySource.AGGREGATION
): BaseRelationship<TStart, TEnd> {
  return new ConcreteRelationship(type, start, end, source);
}
