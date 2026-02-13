import { Expression } from '../expression';
import {
  Relationship,
  Entity,
  DiscoverySource,
  EntityMatcher,
  RelationshipProperties,
} from './types';

/**
 * Abstract base class for relationship definitions.
 * Provides common functionality for all relationship types with automatic matcher inference.
 *
 * @template TStart The start entity type
 * @template TEnd The end entity type
 */
export abstract class BaseRelationship<
  TStart extends Entity = Entity,
  TEnd extends Entity = Entity
> implements Relationship
{
  protected type: string;
  protected startEntity: TStart;
  protected endEntity: TEnd;
  protected source: DiscoverySource;
  protected pattern?: string | Expression;
  protected startEntityMatchers: EntityMatcher;
  protected endEntityMatchers: EntityMatcher;
  protected staticProperties?: RelationshipProperties;

  /**
   * Create a new relationship.
   * Automatically infers entity matchers from start and end entities.
   *
   * @param type Relationship type (e.g., "PRODUCES", "CONSUMES", "CALLS")
   * @param startEntity Start entity instance
   * @param endEntity End entity instance
   * @param source Discovery source (AGGREGATION or SAMPLES)
   */
  constructor(
    type: string,
    startEntity: TStart,
    endEntity: TEnd,
    source: DiscoverySource
  ) {
    this.type = type;
    this.startEntity = startEntity;
    this.endEntity = endEntity;
    this.source = source;

    // Auto-infer matchers from entities
    this.startEntityMatchers = startEntity.getEntityMatchers();
    this.endEntityMatchers = endEntity.getEntityMatchers();
  }

  /**
   * Get the relationship type.
   */
  getType(): string {
    return this.type;
  }

  /**
   * Get the start entity type.
   */
  getStartEntityType(): string {
    return this.startEntity.getType();
  }

  /**
   * Get the end entity type.
   */
  getEndEntityType(): string {
    return this.endEntity.getType();
  }

  /**
   * Set the pattern query for discovering relationships.
   * @param pattern PromQL query string or Expression
   * @returns this for method chaining
   */
  withPattern(pattern: string | Expression): this {
    this.pattern = pattern;
    return this;
  }

  /**
   * Override the automatically inferred start entity matchers.
   * Use this only if the automatic inference is insufficient.
   * @param matchers Custom start entity matchers
   * @returns this for method chaining
   */
  withStartEntityMatchers(matchers: EntityMatcher): this {
    this.startEntityMatchers = matchers;
    return this;
  }

  /**
   * Override the automatically inferred end entity matchers.
   * Use this only if the automatic inference is insufficient.
   * @param matchers Custom end entity matchers
   * @returns this for method chaining
   */
  withEndEntityMatchers(matchers: EntityMatcher): this {
    this.endEntityMatchers = matchers;
    return this;
  }

  /**
   * Set static properties to add to discovered relationships.
   * @param properties Static property values
   * @returns this for method chaining
   */
  withStaticProperties(properties: RelationshipProperties): this {
    this.staticProperties = { ...this.staticProperties, ...properties };
    return this;
  }

  /**
   * Convert relationship to plain object for YAML serialization.
   */
  toObject(): any {
    const obj: any = {
      type: this.type,
      startEntityType: this.getStartEntityType(),
      endEntityType: this.getEndEntityType(),
      definedBy: {
        source: this.source,
      },
    };

    // Add pattern if defined
    if (this.pattern !== undefined) {
      obj.definedBy.pattern =
        typeof this.pattern === 'string' ? this.pattern : this.pattern.toString();
    }

    // Add start entity matchers
    obj.definedBy.startEntityMatchers = this.startEntityMatchers;

    // Add end entity matchers
    obj.definedBy.endEntityMatchers = this.endEntityMatchers;

    // Add static properties if defined
    if (this.staticProperties) {
      obj.definedBy.staticProperties = this.staticProperties;
    }

    return obj;
  }
}
