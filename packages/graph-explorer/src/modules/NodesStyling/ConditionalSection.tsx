import type { AttributeConfig } from "@/core/ConfigurationProvider/types";

import {
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import {
  type ConditionOperator,
  type StyleCondition,
  validOperatorsForDataType,
} from "@/core/StateProvider/conditionalStyling";

interface Props {
  attributes: AttributeConfig[];
  condition: StyleCondition | undefined;
  onChange: (condition: StyleCondition) => void;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  "=": "= equals",
  "!=": "≠ not equals",
  ">": "> greater than",
  "<": "< less than",
  ">=": "≥ greater or equal",
  "<=": "≤ less or equal",
};

export function ConditionalSection({ attributes, condition, onChange }: Props) {
  const selectedAttr = attributes.find(a => a.name === condition?.property);
  const allowedOps = validOperatorsForDataType(selectedAttr?.dataType);

  function handlePropertyChange(property: string) {
    const newAttr = attributes.find(a => a.name === property);
    const ops = validOperatorsForDataType(newAttr?.dataType);
    const op =
      condition?.operator && ops.includes(condition.operator)
        ? condition.operator
        : ops[0];
    onChange({ property, operator: op, value: condition?.value ?? "" });
  }

  function handleOperatorChange(operator: ConditionOperator) {
    onChange({ ...(condition ?? { property: "", value: "" }), operator });
  }

  function handleValueChange(value: string) {
    onChange({ ...(condition ?? { property: "", operator: "=" }), value });
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Property</FieldLabel>
        <Select
          value={condition?.property ?? ""}
          onValueChange={handlePropertyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose property…" />
          </SelectTrigger>
          <SelectContent>
            {attributes.map(attr => (
              <SelectItem key={attr.name} value={attr.name}>
                {attr.name}
                {attr.dataType ? ` (${attr.dataType})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Operator</FieldLabel>
        <Select
          value={condition?.operator ?? "="}
          onValueChange={v => handleOperatorChange(v as ConditionOperator)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedOps.map(op => (
              <SelectItem key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Value</FieldLabel>
        <Input
          aria-label="Condition value"
          value={condition?.value ?? ""}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={
            selectedAttr?.dataType === "Boolean"
              ? "true or false"
              : selectedAttr?.dataType === "Number"
                ? "e.g. 90"
                : "e.g. SSN"
          }
        />
      </Field>
    </FieldGroup>
  );
}
