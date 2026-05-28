import { atom, useAtom, useSetAtom } from "jotai";
import { useState } from "react";

import {
  Button,
  ColorPopover,
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import {
  type EdgeType,
  useDisplayEdgeTypeConfig,
  useQueryEngine,
} from "@/core";
import {
  type ArrowStyle,
  type EdgePreferencesStorageModel,
  type LineStyle,
  useEdgeStyling,
} from "@/core/StateProvider/userPreferences";
import useTranslations from "@/hooks/useTranslations";
import { parseNumberSafely, RESERVED_TYPES_PROPERTY } from "@/utils";

import { ConditionalSection } from "../NodesStyling/ConditionalSection";
import { ARROW_STYLE_OPTIONS } from "./arrowsStyling";
import { LINE_STYLE_OPTIONS } from "./lineStyling";

const customizeEdgeTypeAtom = atom<EdgeType | undefined>(undefined);

/**
 * Open the dialog to customize the edge style
 * @returns callback to open the dialog
 */
export function useOpenEdgeStyleDialog() {
  const setCustomizeEdgeType = useSetAtom(customizeEdgeTypeAtom);

  return (edgeType: EdgeType) => {
    setCustomizeEdgeType(edgeType);
  };
}

export function EdgeStyleDialog() {
  const [customizeEdgeType, setCustomizeEdgeType] = useAtom(
    customizeEdgeTypeAtom,
  );

  return (
    <Dialog
      open={Boolean(customizeEdgeType)}
      onOpenChange={open => !open && setCustomizeEdgeType(undefined)}
    >
      {customizeEdgeType ? <Content edgeType={customizeEdgeType} /> : null}
    </Dialog>
  );
}

function Content({ edgeType }: { edgeType: EdgeType }) {
  const displayConfig = useDisplayEdgeTypeConfig(edgeType);
  const t = useTranslations();
  const queryEngine = useQueryEngine();

  const [activePane, setActivePane] = useState<"base" | "conditional">("base");

  const {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
    setConditionalEdgeStyle,
    removeConditionalEdgeStyle,
  } = useEdgeStyling(edgeType);

  // Access condition and conditionalStyle from the raw storage model.
  // createEdgePreference spreads the full storage model at runtime even
  // though EdgePreferences omits these fields from its type.
  const rawStyle = edgeStyle as unknown as Pick<
    EdgePreferencesStorageModel,
    "condition" | "conditionalStyle"
  >;

  const attributes = displayConfig.attributes;

  // In SPARQL there are no edge attributes, so predicate is the only and default option
  const hideDisplayNameAttribute = queryEngine === "sparql";
  const selectOptions = (() => {
    const options = displayConfig.attributes.map(attr => ({
      value: attr.name,
      label: attr.displayLabel,
    }));

    options.unshift({
      label: t("edge-type"),
      value: RESERVED_TYPES_PROPERTY,
    });

    return options;
  })();

  return (
    <DialogContent className="max-w-2xl">
      <form>
        <DialogHeader>
          <DialogTitle>{t("edges-styling.title")}</DialogTitle>
          <DialogDescription>
            Customize styling for {displayConfig.displayLabel}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={activePane === "base" ? "primary" : "outline"}
              onClick={() => setActivePane("base")}
            >
              Base Style
            </Button>
            <Button
              type="button"
              variant={activePane === "conditional" ? "primary" : "outline"}
              onClick={() => setActivePane("conditional")}
            >
              Conditional Style
              {rawStyle.condition && (
                <span className="ml-1 text-xs opacity-70">
                  ({rawStyle.condition.property} {rawStyle.condition.operator}{" "}
                  {rawStyle.condition.value})
                </span>
              )}
            </Button>
          </div>

          {activePane === "base" && (
            <FieldSet>
              {hideDisplayNameAttribute ? null : (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Display Name {t("property")}</FieldLabel>
                    <Select
                      value={edgeStyle.displayNameAttribute}
                      onValueChange={value =>
                        setEdgeStyle({ displayNameAttribute: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a display attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              )}

              <FieldSet>
                <FieldLegend>Label Styling</FieldLegend>
                <FieldGroup className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Background Color</FieldLabel>
                    <ColorPopover
                      color={edgeStyle.labelColor}
                      onColorChange={color =>
                        setEdgeStyle({ labelColor: color })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Background Opacity</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={edgeStyle.labelBackgroundOpacity}
                      onChange={e =>
                        setEdgeStyle({
                          labelBackgroundOpacity: parseNumberSafely(
                            e.target.value,
                          ),
                        })
                      }
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Border Color</FieldLabel>
                    <ColorPopover
                      color={edgeStyle.labelBorderColor}
                      onColorChange={color =>
                        setEdgeStyle({ labelBorderColor: color })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Border Width</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={edgeStyle.labelBorderWidth}
                      onChange={e =>
                        setEdgeStyle({
                          labelBorderWidth: parseNumberSafely(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Border Style</FieldLabel>
                    <Select
                      value={edgeStyle.labelBorderStyle}
                      onValueChange={value =>
                        setEdgeStyle({ labelBorderStyle: value as LineStyle })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a border style" />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              {option.icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <FieldSet>
                <FieldLegend>Line Styling</FieldLegend>
                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Line Color</FieldLabel>
                    <ColorPopover
                      color={edgeStyle.lineColor}
                      onColorChange={color =>
                        setEdgeStyle({ lineColor: color })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Line Thickness</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={edgeStyle.lineThickness}
                      onChange={e =>
                        setEdgeStyle({
                          lineThickness: parseNumberSafely(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Line Style</FieldLabel>
                    <Select
                      value={edgeStyle.lineStyle}
                      onValueChange={value =>
                        setEdgeStyle({ lineStyle: value as LineStyle })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a line style" />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              {option.icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <FieldGroup className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Source Arrow Style</FieldLabel>
                    <Select
                      value={edgeStyle.sourceArrowStyle}
                      onValueChange={value =>
                        setEdgeStyle({ sourceArrowStyle: value as ArrowStyle })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source arrow style" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARROW_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              <option.Icon className="rotate-180" />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Target Arrow Style</FieldLabel>
                    <Select
                      value={edgeStyle.targetArrowStyle}
                      onValueChange={value =>
                        setEdgeStyle({ targetArrowStyle: value as ArrowStyle })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a target arrow style" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARROW_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              <option.Icon />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldSet>
          )}

          {activePane === "conditional" && (
            <FieldSet>
              <ConditionalSection
                attributes={attributes}
                condition={rawStyle.condition}
                onChange={cond =>
                  setConditionalEdgeStyle(cond, rawStyle.conditionalStyle ?? {})
                }
              />
              {hideDisplayNameAttribute ? null : (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Display Name {t("property")}</FieldLabel>
                    <Select
                      value={
                        rawStyle.conditionalStyle?.displayNameAttribute ?? ""
                      }
                      onValueChange={value => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          displayNameAttribute: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a display attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              )}

              <FieldSet>
                <FieldLegend>Label Styling</FieldLegend>
                <FieldGroup className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Background Color</FieldLabel>
                    <ColorPopover
                      color={rawStyle.conditionalStyle?.labelColor ?? ""}
                      onColorChange={color => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          labelColor: color,
                        });
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Background Opacity</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={
                        rawStyle.conditionalStyle?.labelBackgroundOpacity ?? ""
                      }
                      onChange={e => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          labelBackgroundOpacity: parseNumberSafely(
                            e.target.value,
                          ),
                        });
                      }}
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Border Color</FieldLabel>
                    <ColorPopover
                      color={rawStyle.conditionalStyle?.labelBorderColor ?? ""}
                      onColorChange={color => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          labelBorderColor: color,
                        });
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Border Width</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={rawStyle.conditionalStyle?.labelBorderWidth ?? ""}
                      onChange={e => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          labelBorderWidth: parseNumberSafely(e.target.value),
                        });
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Border Style</FieldLabel>
                    <Select
                      value={rawStyle.conditionalStyle?.labelBorderStyle ?? ""}
                      onValueChange={value => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          labelBorderStyle: value as LineStyle,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a border style" />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              {option.icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Line Styling</FieldLegend>
                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>Line Color</FieldLabel>
                    <ColorPopover
                      color={rawStyle.conditionalStyle?.lineColor ?? ""}
                      onColorChange={color => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          lineColor: color,
                        });
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Line Thickness</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={rawStyle.conditionalStyle?.lineThickness ?? ""}
                      onChange={e => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          lineThickness: parseNumberSafely(e.target.value),
                        });
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Line Style</FieldLabel>
                    <Select
                      value={rawStyle.conditionalStyle?.lineStyle ?? ""}
                      onValueChange={value => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          lineStyle: value as LineStyle,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a line style" />
                      </SelectTrigger>
                      <SelectContent>
                        {LINE_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              {option.icon}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <FieldGroup className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Source Arrow Style</FieldLabel>
                    <Select
                      value={rawStyle.conditionalStyle?.sourceArrowStyle ?? ""}
                      onValueChange={value => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          sourceArrowStyle: value as ArrowStyle,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source arrow style" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARROW_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              <option.Icon className="rotate-180" />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Target Arrow Style</FieldLabel>
                    <Select
                      value={rawStyle.conditionalStyle?.targetArrowStyle ?? ""}
                      onValueChange={value => {
                        if (!rawStyle.condition) return;
                        setConditionalEdgeStyle(rawStyle.condition, {
                          ...rawStyle.conditionalStyle,
                          targetArrowStyle: value as ArrowStyle,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a target arrow style" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARROW_STYLE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-row items-center gap-3">
                              {option.label}
                              <option.Icon />
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </FieldSet>

              {rawStyle.condition && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={removeConditionalEdgeStyle}
                  className="mt-2"
                >
                  Remove Condition
                </Button>
              )}
            </FieldSet>
          )}
        </DialogBody>
        <DialogFooter className="sm:justify-between">
          {activePane === "base" && (
            <Button type="button" variant="danger" onClick={resetEdgeStyle}>
              Reset to Default
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button">Done</Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
