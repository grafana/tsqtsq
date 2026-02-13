import {
  Entity,
  ScopeDimension,
  LookupLabels,
  PropertyRuleDefinition,
  EntityMatcher,
} from './types';
import { createPropertyRule, PropertyRule } from './property-rule';

/**
 * Abstract base class for entity definitions.
 * Provides common functionality for all entity types.
 */
export abstract class BaseEntity implements Entity {
  protected entityType: string;
  protected nameLabels: string | string[];
  protected scope?: ScopeDimension;
  protected lookup?: LookupLabels;
  protected definedByRules: PropertyRule[] = [];
  protected enrichedByRules: PropertyRule[] = [];

  /**
   * Create a new entity.
   * @param entityType The entity type (e.g., "Service", "Topic")
   * @param nameLabels Single label name or array of alternative label names
   */
  constructor(entityType: string, nameLabels: string | string[]) {
    this.entityType = entityType;
    this.nameLabels = nameLabels;
  }

  /**
   * Get the entity type.
   */
  getType(): string {
    return this.entityType;
  }

  /**
   * Get the entity name label(s).
   */
  getName(): string | string[] {
    return this.nameLabels;
  }

  /**
   * Get the entity scope dimensions.
   */
  getScope(): ScopeDimension | undefined {
    return this.scope;
  }

  /**
   * Set the scope dimensions for this entity.
   * @param scope Scope dimension mapping
   * @returns this for method chaining
   */
  withScope(scope: ScopeDimension): this {
    this.scope = scope;
    return this;
  }

  /**
   * Set lookup configuration for finding related entities.
   * @param lookup Lookup labels configuration
   * @returns this for method chaining
   */
  withLookup(lookup: LookupLabels): this {
    this.lookup = lookup;
    return this;
  }

  /**
   * Add a discovery rule for this entity.
   * Discovery rules define how to find entities of this type in the metrics.
   * @param rule Property rule definition
   * @returns this for method chaining
   */
  definedBy(rule: PropertyRuleDefinition): this {
    this.definedByRules.push(createPropertyRule(rule));
    return this;
  }

  /**
   * Add an enrichment rule for this entity.
   * Enrichment rules add additional properties to discovered entities.
   * @param rule Property rule definition
   * @returns this for method chaining
   */
  enrichedBy(rule: PropertyRuleDefinition): this {
    this.enrichedByRules.push(createPropertyRule(rule));
    return this;
  }

  /**
   * Generate entity matchers for use in relationships.
   * Automatically extracts the first name label and includes all scope dimensions.
   * @returns EntityMatcher configuration
   */
  getEntityMatchers(): EntityMatcher {
    // Extract first name label (e.g., "workload | service | job" -> "job")
    const nameLabel = Array.isArray(this.nameLabels)
      ? this.nameLabels[0]
      : this.nameLabels;

    const matcher: EntityMatcher = {
      name: nameLabel,
    };

    // Include all scope dimensions
    if (this.scope) {
      Object.assign(matcher, this.scope);
    }

    return matcher;
  }

  /**
   * Convert entity to plain object for YAML serialization.
   */
  toObject(): any {
    const obj: any = {
      type: this.entityType,
    };

    // Handle name as string or pipe-separated alternatives
    if (Array.isArray(this.nameLabels)) {
      obj.name = this.nameLabels.join(' | ');
    } else {
      obj.name = this.nameLabels;
    }

    // Add scope if defined
    if (this.scope) {
      obj.scope = this.scope;
    }

    // Add lookup if defined
    if (this.lookup) {
      obj.lookup = this.lookup;
    }

    // Add definedBy rules
    if (this.definedByRules.length > 0) {
      obj.definedBy = this.definedByRules.map((rule) => rule.toObject());
    }

    // Add enrichedBy rules
    if (this.enrichedByRules.length > 0) {
      obj.enrichedBy = this.enrichedByRules.map((rule) => rule.toObject());
    }

    return obj;
  }
}
