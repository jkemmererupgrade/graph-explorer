import Color from "color";
import { useAtomValue } from "jotai";
import { useDeferredValue } from "react";

import type { GraphProps } from "@/components/Graph";

import {
  allEdgeTypeConfigsSelector,
  allVertexTypeConfigsSelector,
  type EdgePreferences,
  type EdgeTypeConfig,
  useAllEdgePreferences,
  useAllVertexPreferences,
  type VertexPreferences,
  type VertexTypeConfig,
} from "@/core";
import {
  buildConditionalEdgeSelector,
  buildConditionalNodeSelector,
} from "@/core/StateProvider/conditionalStyling";

import { useBackgroundImageMap } from "./useBackgroundImageMap";

const LINE_PATTERN = {
  solid: undefined,
  dashed: [5, 6],
  dotted: [1, 2],
};

export default function useGraphStyles() {
  const vtConfigs = useAllVertexPreferences();
  const etConfigs = useAllEdgePreferences();
  const vtTypeConfigs = useAtomValue(allVertexTypeConfigsSelector);
  const etTypeConfigs = useAtomValue(allEdgeTypeConfigsSelector);

  const deferredVtConfigs = useDeferredValue(vtConfigs);
  const deferredEtConfigs = useDeferredValue(etConfigs);
  const deferredVtTypeConfigs = useDeferredValue(vtTypeConfigs);
  const deferredEtTypeConfigs = useDeferredValue(etTypeConfigs);

  const backgroundImageMap = useBackgroundImageMap(
    deferredVtConfigs,
    deferredVtTypeConfigs,
  );

  return createGraphStyles(
    deferredVtConfigs,
    deferredEtConfigs,
    deferredVtTypeConfigs,
    deferredEtTypeConfigs,
    backgroundImageMap,
  );
}

function createGraphStyles(
  deferredVtConfigs: VertexPreferences[],
  deferredEtConfigs: EdgePreferences[],
  vtTypeConfigs: Map<string, VertexTypeConfig>,
  etTypeConfigs: Map<string, EdgeTypeConfig>,
  backgroundImageMap: Map<string, string | null>,
): GraphProps["styles"] {
  const styles: GraphProps["styles"] = {};

  for (const vtConfig of deferredVtConfigs) {
    const vt = vtConfig.type;

    // Process the image data or SVG
    const backgroundImage = backgroundImageMap.get(vt) ?? undefined;

    styles[`node[type="${vt}"]`] = {
      "background-image": backgroundImage,
      "background-color": vtConfig.color,
      "background-opacity": vtConfig.backgroundOpacity,
      "border-color": vtConfig.borderColor,
      "border-width": vtConfig.borderWidth,
      "border-style": vtConfig.borderStyle,
      shape: vtConfig.shape,
      width: 24,
      height: 24,
    };
  }

  // Conditional vertex selectors — override base styles when condition is met
  for (const vtTypeConfig of vtTypeConfigs.values()) {
    if (!vtTypeConfig.condition || !vtTypeConfig.conditionalStyle) continue;
    const attrConfig = vtTypeConfig.attributes.find(
      a => a.name === vtTypeConfig.condition!.property,
    );
    const selector = buildConditionalNodeSelector(
      vtTypeConfig.type,
      vtTypeConfig.condition,
      attrConfig?.dataType,
    );
    const cs = vtTypeConfig.conditionalStyle;
    styles[selector] = {
      ...(cs.color && { "background-color": cs.color }),
      ...(cs.borderColor && { "border-color": cs.borderColor }),
      ...(cs.borderWidth !== undefined && { "border-width": cs.borderWidth }),
      ...(cs.borderStyle && { "border-style": cs.borderStyle }),
      ...(cs.backgroundOpacity !== undefined && {
        "background-opacity": cs.backgroundOpacity,
      }),
      ...(cs.shape && { shape: cs.shape }),
    };
    const condImage = backgroundImageMap.get(`${vtTypeConfig.type}:cond`);
    if (condImage) {
      styles[selector] = {
        ...styles[selector],
        "background-image": condImage,
        "background-fit": "contain",
      };
    }
  }

  for (const etConfig of deferredEtConfigs) {
    const et = etConfig?.type;

    styles[`edge[type="${et}"]`] = {
      label: "data(displayName)",
      color: new Color(etConfig?.labelColor || "#17457b").isDark()
        ? "#FFFFFF"
        : "#000000",
      "line-color": etConfig.lineColor,
      "line-style":
        etConfig.lineStyle === "dotted" ? "dashed" : etConfig.lineStyle,
      "line-dash-pattern": etConfig.lineStyle
        ? LINE_PATTERN[etConfig.lineStyle]
        : undefined,
      "source-arrow-shape": etConfig.sourceArrowStyle,
      "source-arrow-color": etConfig.lineColor,
      "target-arrow-shape": etConfig.targetArrowStyle,
      "target-arrow-color": etConfig.lineColor,
      "text-background-opacity": etConfig?.labelBackgroundOpacity,
      "text-background-color": etConfig?.labelColor,
      "text-border-width": etConfig?.labelBorderWidth,
      "text-border-color": etConfig?.labelBorderColor,
      "text-border-style": etConfig?.labelBorderStyle,
      width: etConfig.lineThickness,
      "source-distance-from-node": 0,
      "target-distance-from-node": 0,
    };
  }

  // Conditional edge selectors — override base styles when condition is met
  for (const etTypeConfig of etTypeConfigs.values()) {
    if (!etTypeConfig.condition || !etTypeConfig.conditionalStyle) continue;
    const attrConfig = etTypeConfig.attributes.find(
      a => a.name === etTypeConfig.condition!.property,
    );
    const selector = buildConditionalEdgeSelector(
      etTypeConfig.type,
      etTypeConfig.condition,
      attrConfig?.dataType,
    );
    const cs = etTypeConfig.conditionalStyle;
    styles[selector] = {
      ...(cs.lineColor && { "line-color": cs.lineColor }),
      ...(cs.lineThickness !== undefined && { width: cs.lineThickness }),
      ...(cs.lineStyle && { "line-style": cs.lineStyle }),
      ...(cs.sourceArrowStyle && { "source-arrow-shape": cs.sourceArrowStyle }),
      ...(cs.targetArrowStyle && { "target-arrow-shape": cs.targetArrowStyle }),
      ...(cs.labelColor && { "text-background-color": cs.labelColor }),
    };
  }

  return styles;
}
