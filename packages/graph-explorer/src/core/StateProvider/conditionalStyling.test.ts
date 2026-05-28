import {
  buildConditionSelector,
  buildConditionalNodeSelector,
  buildConditionalEdgeSelector,
  validOperatorsForDataType,
} from "./conditionalStyling";

describe("buildConditionSelector", () => {
  it("quotes string values", () => {
    expect(
      buildConditionSelector(
        { property: "identifier_type", operator: "=", value: "SSN" },
        "String",
      ),
    ).toBe('[prop_identifier_type = "SSN"]');
  });

  it("quotes boolean values (stored as strings)", () => {
    expect(
      buildConditionSelector(
        { property: "known_bad", operator: "=", value: "true" },
        "Boolean",
      ),
    ).toBe('[prop_known_bad = "true"]');
  });

  it("does not quote numeric values", () => {
    expect(
      buildConditionSelector(
        { property: "score", operator: ">", value: "90" },
        "Number",
      ),
    ).toBe("[prop_score > 90]");
  });

  it("quotes values when dataType is undefined", () => {
    expect(
      buildConditionSelector(
        { property: "x", operator: "=", value: "y" },
        undefined,
      ),
    ).toBe('[prop_x = "y"]');
  });
});

describe("buildConditionalNodeSelector", () => {
  it("combines type + condition", () => {
    expect(
      buildConditionalNodeSelector(
        "Customer",
        { property: "known_bad", operator: "=", value: "true" },
        "Boolean",
      ),
    ).toBe('node[type="Customer"][prop_known_bad = "true"]');
  });
});

describe("buildConditionalEdgeSelector", () => {
  it("builds edge selector", () => {
    expect(
      buildConditionalEdgeSelector(
        "OWNS",
        { property: "active", operator: "=", value: "false" },
        "Boolean",
      ),
    ).toBe('edge[type="OWNS"][prop_active = "false"]');
  });
});

describe("validOperatorsForDataType", () => {
  it("returns all 6 for Number", () => {
    expect(validOperatorsForDataType("Number")).toHaveLength(6);
  });

  it("returns only = and != for String", () => {
    expect(validOperatorsForDataType("String")).toEqual(["=", "!="]);
  });

  it("returns only = and != for Boolean", () => {
    expect(validOperatorsForDataType("Boolean")).toEqual(["=", "!="]);
  });

  it("returns all 6 for Date", () => {
    expect(validOperatorsForDataType("Date")).toHaveLength(6);
  });
});
