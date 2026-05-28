// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import type { StyleCondition } from "@/core/StateProvider/conditionalStyling";

import { ConditionalSection } from "./ConditionalSection";

const attrs = [
  { name: "known_bad", dataType: "Boolean" },
  { name: "score", dataType: "Number" },
  { name: "identifier_type", dataType: "String" },
];

it("renders the value input", () => {
  render(
    <ConditionalSection
      attributes={attrs}
      condition={undefined}
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("Condition value")).toBeInTheDocument();
});

function StatefulWrapper(props: {
  initial: StyleCondition;
  onChangeSpy: (c: StyleCondition) => void;
}) {
  const [condition, setCondition] = useState<StyleCondition>(props.initial);

  function handleChange(next: StyleCondition) {
    setCondition(next);
    props.onChangeSpy(next);
  }

  return (
    <ConditionalSection
      attributes={attrs}
      condition={condition}
      onChange={handleChange}
    />
  );
}

it("calls onChange when value changes", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <StatefulWrapper
      initial={{ property: "score", operator: ">", value: "50" }}
      onChangeSpy={onChange}
    />,
  );
  const input = screen.getByLabelText("Condition value");
  await user.clear(input);
  await user.type(input, "90");
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ value: "90" }),
  );
});
