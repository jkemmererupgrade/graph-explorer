import { type QueryClient, useQueries } from "@tanstack/react-query";

import type { VertexPreferences, VertexTypeConfig } from "@/core";

import { type VertexIconConfig, renderNode } from "./renderNode";

type IconQuery = {
  queryKey: unknown[];
  queryFn: (ctx: { client: QueryClient }) => Promise<{
    backgroundImage: string | null;
    key: string;
  }>;
};

/**
 * Generates appropriate background images from vertex type configurations,
 * considering the image type and applying colors for SVG icons.
 *
 * Base entries are keyed by vertex type name.
 * Conditional icon entries (when a type has `condition` + `conditionalStyle.iconUrl`)
 * are keyed by `${type}:cond`.
 *
 * @param vtConfigs - Array of vertex type configurations containing styling and
 * display information
 * @param vtTypeConfigs - Optional map of full vertex type configs (includes
 * condition/conditionalStyle fields) used to generate conditional icon entries
 * @returns A Map where keys are vertex type names (or `type:cond` for
 * conditional entries) and values are their corresponding background image strings
 */
export function useBackgroundImageMap(
  vtConfigs: VertexPreferences[],
  vtTypeConfigs?: Map<string, VertexTypeConfig>,
) {
  const baseQueries: IconQuery[] = vtConfigs.map(vtConfig => ({
    queryKey: ["vertexIcon", vtConfig],
    queryFn: async ({ client }: { client: QueryClient }) => {
      const backgroundImage = await renderNode(client, vtConfig);
      return { backgroundImage, key: vtConfig.type as string };
    },
  }));

  const conditionalQueries: IconQuery[] = [];
  if (vtTypeConfigs) {
    for (const vtTypeConfig of vtTypeConfigs.values()) {
      const condStyle = vtTypeConfig.conditionalStyle;
      if (!vtTypeConfig.condition || !condStyle?.iconUrl) continue;
      const condIconConfig: VertexIconConfig = {
        type: vtTypeConfig.type,
        iconUrl: condStyle.iconUrl,
        iconImageType: condStyle.iconImageType ?? vtTypeConfig.iconImageType,
        color: condStyle.color ?? vtTypeConfig.color,
      };
      const condKey = `${vtTypeConfig.type}:cond`;
      conditionalQueries.push({
        queryKey: ["vertexIconCond", condIconConfig],
        queryFn: async ({ client }: { client: QueryClient }) => {
          const backgroundImage = await renderNode(client, condIconConfig);
          return { backgroundImage, key: condKey };
        },
      });
    }
  }

  return useQueries({
    queries: [...baseQueries, ...conditionalQueries],
    combine: results =>
      results.reduce((map, item) => {
        if (item.data != null && item.data.backgroundImage != null) {
          map.set(item.data.key, item.data.backgroundImage);
        }
        return map;
      }, new Map<string, string>()),
  });
}
