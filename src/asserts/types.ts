import { Expression } from '../expression';

/**
 * Discovery source for entities and relationships.
 * Determines how the entity or relationship is discovered in the metrics data.
 */
export enum DiscoverySource {
  /** Discovery via PromQL aggregation query */
  AGGREGATION = 'AGGREGATION',
  /** Discovery via metric samples */
  SAMPLES = 'SAMPLES',
}

/**
 * Scope dimension definition for filtering and grouping entities.
 * Maps dimension names to label names in the metrics.
 */
export interface ScopeDimension {
  [dimensionName: string]: string;
}

/**
 * Label value mapping for property rule definitions.
 * Maps property names to label names from which to extract values.
 */
export interface LabelValueMapping {
  [propertyName: string]: string;
}

/**
 * Literal property values for entity enrichment.
 * Maps property names to static values.
 */
export interface LiteralProperties {
  [propertyName: string]: string | number | boolean;
}

/**
 * Lookup configuration for entity relationships.
 * Defines label-based lookup strategies for finding related entities.
 */
export interface LookupLabels {
  [entityType: string]: string[];
}

/**
 * Entity matcher configuration for relationships.
 * Defines how to match entities by name and additional dimensions.
 */
export interface EntityMatcher {
  /** Primary label name for entity identification */
  name: string;
  /** Additional dimensions for entity matching (e.g., env, site, namespace) */
  [dimension: string]: string;
}

/**
 * Property rule definition for entity discovery or enrichment.
 * Can specify queries, label value extractions, literals, or metric values.
 */
export interface PropertyRuleDefinition {
  /** PromQL query (string or Expression) */
  query?: string | Expression;
  /** Map property names to metric label names */
  labelValues?: LabelValueMapping;
  /** Static property values */
  literals?: LiteralProperties;
  /** Property name to populate with metric value */
  metricValue?: string;
}

/**
 * Relationship properties configuration.
 * Defines static properties that should be added to discovered relationships.
 */
export interface RelationshipProperties {
  [propertyName: string]: string | number | boolean;
}

/**
 * Entity definition interface.
 * All entity classes must implement this interface.
 */
export interface Entity {
  /**
   * Get the entity type (e.g., "Service", "Topic", "Database")
   */
  getType(): string;

  /**
   * Get the entity name label(s).
   * Can be a single label or multiple alternatives (pipe-separated in YAML).
   */
  getName(): string | string[];

  /**
   * Get the entity scope dimensions.
   */
  getScope(): ScopeDimension | undefined;

  /**
   * Add a discovery rule that defines how to find entities of this type.
   * @param rule Property rule definition
   * @returns this for method chaining
   */
  definedBy(rule: PropertyRuleDefinition): this;

  /**
   * Add an enrichment rule that adds properties to discovered entities.
   * @param rule Property rule definition
   * @returns this for method chaining
   */
  enrichedBy(rule: PropertyRuleDefinition): this;

  /**
   * Generate entity matchers for use in relationships.
   * Extracts the first name label and includes all scope dimensions.
   * @returns EntityMatcher configuration
   */
  getEntityMatchers(): EntityMatcher;

  /**
   * Convert entity to plain object for YAML serialization.
   */
  toObject(): any;
}

/**
 * Relationship definition interface.
 * All relationship classes must implement this interface.
 */
export interface Relationship {
  /**
   * Get the relationship type (e.g., "PRODUCES", "CONSUMES", "CALLS")
   */
  getType(): string;

  /**
   * Get the start entity type.
   */
  getStartEntityType(): string;

  /**
   * Get the end entity type.
   */
  getEndEntityType(): string;

  /**
   * Convert relationship to plain object for YAML serialization.
   */
  toObject(): any;
}
