import type { Simplify } from "type-fest";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai-family";
import { useDeferredValue } from "react";

import { RESERVED_ID_PROPERTY, RESERVED_TYPES_PROPERTY } from "@/utils";
import DEFAULT_ICON_URL from "@/utils/defaultIconUrl";

import type { EdgeType, VertexType } from "../entities";
import type { StyleCondition } from "./conditionalStyling";

import { defaultStylingAtom } from "./defaultStylingAtom";
import { useActiveSchema } from "./schema";
import { userStylingAtom } from "./storageAtoms";

export type ShapeStyle =
  | "rectangle"
  | "roundrectangle"
  | "ellipse"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "star"
  | "barrel"
  | "diamond"
  | "vee"
  | "rhomboid"
  | "tag"
  | "round-rectangle"
  | "round-triangle"
  | "round-diamond"
  | "round-pentagon"
  | "round-hexagon"
  | "round-heptagon"
  | "round-octagon"
  | "round-tag"
  | "cut-rectangle"
  | "concave-hexagon";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ArrowStyle =
  | "triangle"
  | "triangle-tee"
  | "circle-triangle"
  | "triangle-cross"
  | "triangle-backcurve"
  | "tee"
  | "vee"
  | "square"
  | "circle"
  | "diamond"
  | "none";

/** The user preferences to be used for the specified vertex type as the type used for storing in local storage. */
export type VertexPreferencesStorageModel = {
  type: VertexType;
  /**
   * Color overwrite for vertex
   */
  color?: string;
  /**
   * Label overwrite for vertex
   */
  displayLabel?: string;
  /**
   * Icon overwrite for vertex
   */
  iconUrl?: string;
  /**
   * Icon overwrite for vertex
   */
  iconImageType?: string;
  /**
   * Vertex attribute to be used as label
   */
  displayNameAttribute?: string;
  /**
   * Vertex attribute to be used as description
   */
  longDisplayNameAttribute?: string;
  shape?: ShapeStyle;
  backgroundOpacity?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: LineStyle;
  /** Optional single condition that activates the secondary style. */
  condition?: StyleCondition;
  /** Style overrides applied when `condition` is met. All fields optional. */
  conditionalStyle?: Omit<
    VertexPreferencesStorageModel,
    "type" | "condition" | "conditionalStyle"
  >;
};

/** The user preferences to be used for the specified edge type as the type used for storing in local storage. */
export type EdgePreferencesStorageModel = {
  type: EdgeType;
  displayLabel?: string;
  displayNameAttribute?: string;
  labelColor?: string;
  labelBackgroundOpacity?: number;
  labelBorderColor?: string;
  labelBorderStyle?: LineStyle;
  labelBorderWidth?: number;
  lineColor?: string;
  lineThickness?: number;
  lineStyle?: LineStyle;
  sourceArrowStyle?: ArrowStyle;
  targetArrowStyle?: ArrowStyle;
  condition?: StyleCondition;
  conditionalStyle?: Omit<
    EdgePreferencesStorageModel,
    "type" | "condition" | "conditionalStyle"
  >;
};

/** The user preferences to be used for the specified vertex type as an immutable object. */
export type VertexPreferences = Simplify<
  Readonly<
    Pick<VertexPreferencesStorageModel, "displayLabel"> &
      Required<
        Omit<
          VertexPreferencesStorageModel,
          "displayLabel" | "condition" | "conditionalStyle"
        >
      >
  >
>;

/** The user preferences to be used for the specified edge type as an immutable object. */
export type EdgePreferences = Simplify<
  Readonly<
    Pick<EdgePreferencesStorageModel, "displayLabel"> &
      Required<
        Omit<
          EdgePreferencesStorageModel,
          "displayLabel" | "condition" | "conditionalStyle"
        >
      >
  >
>;

/** The default values to use when no user provided value is given. */
export const defaultVertexPreferences: Omit<
  VertexPreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_ID_PROPERTY,
  longDisplayNameAttribute: RESERVED_TYPES_PROPERTY,
  iconUrl: DEFAULT_ICON_URL,
  iconImageType: "image/svg+xml",
  color: "#128EE5",
  shape: "ellipse",
  backgroundOpacity: 0.4,
  borderWidth: 0,
  borderColor: "#128EE5",
  borderStyle: "solid",
};

/** The default values to use when no user provided value is given. */
export const defaultEdgePreferences: Omit<
  EdgePreferences,
  "type" | "displayLabel"
> = {
  displayNameAttribute: RESERVED_TYPES_PROPERTY,
  labelColor: "#17457b",
  labelBackgroundOpacity: 0.7,
  labelBorderColor: "#17457b",
  labelBorderStyle: "solid",
  labelBorderWidth: 0,
  lineColor: "#b3b3b3",
  lineThickness: 2,
  lineStyle: "solid",
  sourceArrowStyle: "none",
  targetArrowStyle: "triangle",
};

export type UserStyling = {
  vertices?: Array<VertexPreferencesStorageModel>;
  edges?: Array<EdgePreferencesStorageModel>;
};

/**
 * Merges an imported styling baseline into the user styling.
 * Existing user values win via spread order; imported values only fill in
 * gaps for types the user hasn't explicitly styled.
 */
export function mergeDefaultsIntoUserStyling(
  userStyling: UserStyling,
  defaults: UserStyling,
): UserStyling {
  const vertices = [...(userStyling.vertices ?? [])];
  for (const v of defaults.vertices ?? []) {
    const existingIndex = vertices.findIndex(e => e.type === v.type);
    if (existingIndex >= 0) {
      vertices[existingIndex] = { ...v, ...vertices[existingIndex] };
    } else {
      vertices.push(v);
    }
  }

  const edges = [...(userStyling.edges ?? [])];
  for (const e of defaults.edges ?? []) {
    const existingIndex = edges.findIndex(x => x.type === e.type);
    if (existingIndex >= 0) {
      edges[existingIndex] = { ...e, ...edges[existingIndex] };
    } else {
      edges.push(e);
    }
  }

  return { vertices, edges };
}

/** Vertex preferences indexed by type for O(1) lookup with default fallback. */
export const vertexPreferencesAtom = atom(get => {
  const userStyling = get(userStylingAtom);
  const lookup = new Map(
    userStyling.vertices?.map(v => [
      v.type,
      createVertexPreference(v.type, v),
    ]) ?? [],
  );
  return {
    get(type: VertexType) {
      return lookup.get(type) ?? createVertexPreference(type);
    },
  };
});

/** Edge preferences indexed by type for O(1) lookup with default fallback. */
export const edgePreferencesAtom = atom(get => {
  const userStyling = get(userStylingAtom);
  const lookup = new Map(
    userStyling.edges?.map(e => [e.type, createEdgePreference(e.type, e)]) ??
      [],
  );
  return {
    get(type: EdgeType) {
      return lookup.get(type) ?? createEdgePreference(type);
    },
  };
});

/** Combines the stored user preferences with the defined default values. */
export function createVertexPreference(
  type: VertexType,
  stored?: VertexPreferencesStorageModel,
): VertexPreferences {
  return {
    type,
    ...defaultVertexPreferences,
    ...stored,
  } as const;
}

/** Combines the stored user preferences with the defined default values. */
export function createEdgePreference(
  type: EdgeType,
  stored?: EdgePreferencesStorageModel,
) {
  return {
    type,
    ...defaultEdgePreferences,
    ...stored,
  };
}

/** Returns an array of vertex preferences based on the known vertex types in the schema. */
export function useAllVertexPreferences(): VertexPreferences[] {
  const prefs = useAtomValue(vertexPreferencesAtom);
  const { vertices: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns an array of edge preferences based on the known edge types in the schema. */
export function useAllEdgePreferences(): EdgePreferences[] {
  const prefs = useAtomValue(edgePreferencesAtom);
  const { edges: allSchemas } = useActiveSchema();
  return allSchemas.map(({ type }) => prefs.get(type));
}

/** Returns the user preferences for the specified vertex type. */
export function useVertexPreferences(type: VertexType): VertexPreferences {
  return useDeferredValue(useAtomValue(vertexPreferenceByTypeAtom(type)));
}

/** Returns the user preferences for the specified edge type. */
export function useEdgePreferences(type: EdgeType): EdgePreferences {
  return useDeferredValue(useAtomValue(edgePreferenceByTypeAtom(type)));
}

/**
 * Returns the user preferences for the specified vertex type.
 */
export const vertexPreferenceByTypeAtom = atomFamily((type: VertexType) =>
  atom(get => get(vertexPreferencesAtom).get(type)),
);

/**
 * Returns the user preferences for the specified edge type.
 */
export const edgePreferenceByTypeAtom = atomFamily((type: EdgeType) =>
  atom(get => get(edgePreferencesAtom).get(type)),
);

type UpdatedVertexStyle = Partial<Omit<VertexPreferences, "type">>;

/**
 * Provides the necessary functions for managing vertex styles.
 *
 * @param type The vertex type
 * @returns The vertex style if it exists, an update function, and a reset function
 */
export function useVertexStyling(type: VertexType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const defaultStyling = useAtomValue(defaultStylingAtom);
  const vertexStyle = useVertexPreferences(type);

  const setVertexStyle = (updatedStyle: UpdatedVertexStyle) =>
    setAllStyling(prev => {
      const vertices = prev.vertices ?? [];
      const existingIndex = vertices.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedVertices = [...vertices];
        updatedVertices[existingIndex] = {
          ...vertices[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, vertices: updatedVertices };
      } else {
        // Add new entry
        return { ...prev, vertices: [...vertices, { type, ...updatedStyle }] };
      }
    });

  const resetVertexStyle = () =>
    setAllStyling(prev => {
      // Restore from the imported baseline if one exists, otherwise drop the
      // entry entirely (which falls back to the hardcoded defaults).
      const defaultForType = defaultStyling?.vertices?.find(
        v => v.type === type,
      );
      const withoutCurrent = prev.vertices?.filter(v => v.type !== type) ?? [];
      const resetEntry = defaultForType
        ? {
            ...defaultForType,
            condition: undefined,
            conditionalStyle: undefined,
          }
        : undefined;
      return {
        ...prev,
        vertices: resetEntry ? [...withoutCurrent, resetEntry] : withoutCurrent,
      };
    });

  function setConditionalVertexStyle(
    condition: StyleCondition,
    style: Omit<
      VertexPreferencesStorageModel,
      "type" | "condition" | "conditionalStyle"
    >,
  ) {
    setAllStyling(prev => {
      const vertices = prev.vertices ?? [];
      const existingIndex = vertices.findIndex(v => v.type === type);
      if (existingIndex >= 0) {
        const updated = [...vertices];
        updated[existingIndex] = {
          ...vertices[existingIndex],
          condition,
          conditionalStyle: style,
        };
        return { ...prev, vertices: updated };
      }
      return {
        ...prev,
        vertices: [...vertices, { type, condition, conditionalStyle: style }],
      };
    });
  }

  function removeConditionalVertexStyle() {
    setAllStyling(prev => {
      const vertices = prev.vertices ?? [];
      const existingIndex = vertices.findIndex(v => v.type === type);
      if (existingIndex < 0) return prev;
      const updated = [...vertices];
      const {
        condition: _c,
        conditionalStyle: _cs,
        ...rest
      } = vertices[existingIndex];
      updated[existingIndex] = rest;
      return { ...prev, vertices: updated };
    });
  }

  return {
    vertexStyle,
    setVertexStyle,
    resetVertexStyle,
    setConditionalVertexStyle,
    removeConditionalVertexStyle,
  };
}

type UpdatedEdgeStyle = Omit<EdgePreferencesStorageModel, "type">;

/**
 * Provides the necessary functions for managing edge styles.
 *
 * @param type The edge type
 * @returns The edge style if it exists, an update function, and a reset function
 */
export function useEdgeStyling(type: EdgeType) {
  const setAllStyling = useSetAtom(userStylingAtom);
  const defaultStyling = useAtomValue(defaultStylingAtom);
  const edgeStyle = useEdgePreferences(type);

  const setEdgeStyle = (updatedStyle: UpdatedEdgeStyle) =>
    setAllStyling(prev => {
      const edges = prev.edges ?? [];
      const existingIndex = edges.findIndex(v => v.type === type);

      if (existingIndex >= 0) {
        // Update existing entry
        const updatedEdges = [...edges];
        updatedEdges[existingIndex] = {
          ...edges[existingIndex],
          ...updatedStyle,
        };
        return { ...prev, edges: updatedEdges };
      } else {
        // Add new entry
        return { ...prev, edges: [...edges, { type, ...updatedStyle }] };
      }
    });

  const resetEdgeStyle = () =>
    setAllStyling(prev => {
      // Restore from the imported baseline if one exists, otherwise drop the
      // entry entirely (which falls back to the hardcoded defaults).
      const defaultForType = defaultStyling?.edges?.find(e => e.type === type);
      const withoutCurrent = prev.edges?.filter(e => e.type !== type) ?? [];
      const resetEntry = defaultForType
        ? {
            ...defaultForType,
            condition: undefined,
            conditionalStyle: undefined,
          }
        : undefined;
      return {
        ...prev,
        edges: resetEntry ? [...withoutCurrent, resetEntry] : withoutCurrent,
      };
    });

  function setConditionalEdgeStyle(
    condition: StyleCondition,
    style: Omit<
      EdgePreferencesStorageModel,
      "type" | "condition" | "conditionalStyle"
    >,
  ) {
    setAllStyling(prev => {
      const edges = prev.edges ?? [];
      const existingIndex = edges.findIndex(e => e.type === type);
      if (existingIndex >= 0) {
        const updated = [...edges];
        updated[existingIndex] = {
          ...edges[existingIndex],
          condition,
          conditionalStyle: style,
        };
        return { ...prev, edges: updated };
      }
      return {
        ...prev,
        edges: [...edges, { type, condition, conditionalStyle: style }],
      };
    });
  }

  function removeConditionalEdgeStyle() {
    setAllStyling(prev => {
      const edges = prev.edges ?? [];
      const existingIndex = edges.findIndex(e => e.type === type);
      if (existingIndex < 0) return prev;
      const updated = [...edges];
      const {
        condition: _c,
        conditionalStyle: _cs,
        ...rest
      } = edges[existingIndex];
      updated[existingIndex] = rest;
      return { ...prev, edges: updated };
    });
  }

  return {
    edgeStyle,
    setEdgeStyle,
    resetEdgeStyle,
    setConditionalEdgeStyle,
    removeConditionalEdgeStyle,
  };
}
