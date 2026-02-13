// Core types and interfaces
export {
  Entity,
  Relationship,
  DiscoverySource,
  ScopeDimension,
  LookupLabels,
  LabelValueMapping,
  LiteralProperties,
  EntityMatcher,
  PropertyRuleDefinition,
  RelationshipProperties,
} from './types';

// Property rule builder
export { PropertyRule, createPropertyRule } from './property-rule';

// Base classes
export { BaseEntity } from './base-entity';
export { BaseRelationship } from './base-relationship';

// Concrete entity classes
export {
  ServiceEntity,
  ServiceInstanceEntity,
  TopicEntity,
  DatabaseEntity,
  QueueEntity,
  NodeEntity,
  PodEntity,
  NamespaceEntity,
  EnvEntity,
  SiteEntity,
} from './entities/index';

// Relationship factory functions
export {
  produces,
  consumes,
  dependsOn,
  calls,
  runsOn,
  createRelationship,
} from './relationships/index';

// Schema container
export { AssertsSchema, createSchema } from './schema';

// Helper utilities
export {
  createStandardScope,
  buildLabelNamePattern,
  createAssertsExpression,
  groupByWithScope,
  countByPattern,
  sumByWithScope,
} from './scope';
