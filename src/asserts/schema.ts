import * as yaml from 'js-yaml';
import { Entity, Relationship } from './types';

/**
 * Container class for Asserts entity and relationship definitions.
 * Manages collections of entities and relationships and provides YAML serialization.
 */
export class AssertsSchema {
  private entities: Entity[] = [];
  private relationships: Relationship[] = [];
  private when?: string[];

  /**
   * Create a new schema container.
   * @param when Optional activation conditions (exporter names)
   */
  constructor(when?: string[]) {
    this.when = when;
  }

  /**
   * Add an entity to the schema.
   * @param entity Entity to add
   * @returns this for method chaining
   */
  addEntity(entity: Entity): this {
    this.entities.push(entity);
    return this;
  }

  /**
   * Add multiple entities to the schema.
   * @param entities Array of entities to add
   * @returns this for method chaining
   */
  addEntities(entities: Entity[]): this {
    this.entities.push(...entities);
    return this;
  }

  /**
   * Add a relationship to the schema.
   * @param relationship Relationship to add
   * @returns this for method chaining
   */
  addRelationship(relationship: Relationship): this {
    this.relationships.push(relationship);
    return this;
  }

  /**
   * Add multiple relationships to the schema.
   * @param relationships Array of relationships to add
   * @returns this for method chaining
   */
  addRelationships(relationships: Relationship[]): this {
    this.relationships.push(...relationships);
    return this;
  }

  /**
   * Convert schema to plain object for YAML serialization.
   */
  toObject(): any {
    const obj: any = {};

    // Add when conditions if specified
    if (this.when && this.when.length > 0) {
      obj.when = this.when;
    }

    // Add entities if present
    if (this.entities.length > 0) {
      obj.entities = this.entities.map((entity) => entity.toObject());
    }

    // Add relationships if present
    if (this.relationships.length > 0) {
      obj.relationships = this.relationships.map((rel) => rel.toObject());
    }

    return obj;
  }

  /**
   * Serialize schema to YAML format.
   * Uses literal block style (|-) for multi-line PromQL queries.
   * @returns YAML string
   */
  toYAML(): string {
    const obj = this.toObject();

    return yaml.dump(obj, {
      indent: 2,
      lineWidth: -1, // Don't wrap long lines
      noRefs: true, // Disable anchors and aliases
      quotingType: '"',
      forceQuotes: false,
      styles: {
        '!!str': 'literal', // Use literal block style for multi-line strings
      },
    });
  }
}

/**
 * Create a new Asserts schema container.
 * @param when Optional activation conditions (exporter names)
 * @returns AssertsSchema instance
 */
export function createSchema(when?: string[]): AssertsSchema {
  return new AssertsSchema(when);
}
