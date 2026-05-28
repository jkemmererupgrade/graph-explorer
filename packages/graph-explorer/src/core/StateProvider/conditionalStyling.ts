export type ConditionOperator = "=" | "!=" | ">" | "<" | ">=" | "<=";

/**
 * A single condition that triggers the secondary style.
 * `value` is always stored as a string; coercion to the right
 * Cytoscape literal happens at selector-build time.
 */
export type StyleCondition = {
  property: string;
  operator: ConditionOperator;
  value: string;
};

/**
 * Source-property key prefix added to Cytoscape element data so that
 * conditions can reference them without colliding with built-in keys
 * (type, id, displayName, …).
 */
export const PROP_PREFIX = "prop_";

/**
 * Builds the Cytoscape attribute selector fragment for one condition.
 *
 * String/Boolean properties use quoted values: `[prop_x = "true"]`
 * Number properties use unquoted values:       `[prop_score > 90]`
 */
export function buildConditionSelector(
  condition: StyleCondition,
  dataType: string | undefined,
): string {
  const key = `${PROP_PREFIX}${condition.property}`;
  const isNumeric = dataType === "Number";
  const literal = isNumeric ? condition.value : `"${condition.value}"`;
  return `[${key} ${condition.operator} ${literal}]`;
}

/**
 * Full Cytoscape selector for a vertex type + condition.
 * e.g.  `node[type="Customer"][prop_known_bad = "true"]`
 */
export function buildConditionalNodeSelector(
  vertexType: string,
  condition: StyleCondition,
  dataType: string | undefined,
): string {
  return `node[type="${vertexType}"]${buildConditionSelector(condition, dataType)}`;
}

export function buildConditionalEdgeSelector(
  edgeType: string,
  condition: StyleCondition,
  dataType: string | undefined,
): string {
  return `edge[type="${edgeType}"]${buildConditionSelector(condition, dataType)}`;
}

/**
 * Returns operators valid for the given dataType.
 * Non-numeric types only support equality operators.
 */
export function validOperatorsForDataType(
  dataType: string | undefined,
): ConditionOperator[] {
  if (dataType === "Number" || dataType === "Date") {
    return ["=", "!=", ">", "<", ">=", "<="];
  }
  return ["=", "!="];
}
