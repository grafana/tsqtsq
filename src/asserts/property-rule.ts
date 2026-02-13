import { Expression } from '../expression';
import {
  PropertyRuleDefinition,
  LabelValueMapping,
  LiteralProperties,
} from './types';

/**
 * Builder class for creating property rule definitions.
 * Property rules define how to discover entities or enrich them with additional properties.
 */
export class PropertyRule {
  private query?: string | Expression;
  private labelValues?: LabelValueMapping;
  private literals?: LiteralProperties;
  private metricValue?: string;

  /**
   * Set the PromQL query for this property rule.
   * @param query PromQL query string or Expression object
   * @returns this for method chaining
   */
  withQuery(query: string | Expression): this {
    this.query = query;
    return this;
  }

  /**
   * Map property names to metric label names.
   * Values from these labels will be extracted and set as entity properties.
   * @param mapping Object mapping property names to label names
   * @returns this for method chaining
   */
  withLabelValues(mapping: LabelValueMapping): this {
    this.labelValues = { ...this.labelValues, ...mapping };
    return this;
  }

  /**
   * Set static literal property values.
   * @param properties Object mapping property names to static values
   * @returns this for method chaining
   */
  withLiterals(properties: LiteralProperties): this {
    this.literals = { ...this.literals, ...properties };
    return this;
  }

  /**
   * Specify a property name to populate with the metric value.
   * @param propertyName Name of the property to store metric value
   * @returns this for method chaining
   */
  withMetricValue(propertyName: string): this {
    this.metricValue = propertyName;
    return this;
  }

  /**
   * Convert to plain object for YAML serialization.
   * Resolves Expression objects to strings.
   */
  toObject(): any {
    const obj: any = {};

    if (this.query !== undefined) {
      obj.query =
        typeof this.query === 'string' ? this.query : this.query.toString();
    }

    if (this.labelValues !== undefined) {
      obj.labelValues = this.labelValues;
    }

    if (this.literals !== undefined) {
      obj.literals = this.literals;
    }

    if (this.metricValue !== undefined) {
      obj.metricValue = this.metricValue;
    }

    return obj;
  }
}

/**
 * Create a property rule from a definition object or return a PropertyRule builder.
 * @param definition Optional property rule definition
 * @returns PropertyRule builder instance
 */
export function createPropertyRule(
  definition?: PropertyRuleDefinition
): PropertyRule {
  const rule = new PropertyRule();

  if (definition) {
    if (definition.query !== undefined) {
      rule.withQuery(definition.query);
    }
    if (definition.labelValues !== undefined) {
      rule.withLabelValues(definition.labelValues);
    }
    if (definition.literals !== undefined) {
      rule.withLiterals(definition.literals);
    }
    if (definition.metricValue !== undefined) {
      rule.withMetricValue(definition.metricValue);
    }
  }

  return rule;
}
