import {
  createEditorEntityDocument,
  createEditorEntitySelection,
  createEditorViewportState,
  getEditorSelectedEntityIds,
  getEditorSelectionPrimaryEntityId,
  isEditorRecord,
  normalizeEditorSelection,
  type EditorEntityBase,
  type EditorEntityDocument,
  type EditorLayerAdapter,
} from "@moritzbrantner/editor-core";

import {
  defaultLayerEditorViewport,
  layerEditorBlendModes,
  type LayerEditorAddLayerOptions,
  type LayerEditorDocument,
  type LayerEditorDocumentDiagnostic,
  type LayerEditorDocumentNormalizationOptions,
  type LayerEditorDuplicateLayerOptions,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorRemoveGroupOptions,
  type LayerEditorRemoveSourceOptions,
  type LayerEditorSelection,
  type LayerEditorSource,
} from "./types";

export type LayerEditorEntity<TData = Record<string, unknown>> = EditorEntityBase & {
  label: string;
  layer: LayerEditorLayer<TData>;
};

export const layerEditorLayerAdapter: EditorLayerAdapter<LayerEditorEntity> = {
  getBounds: (entity) => entity.layer.bounds,
  getParentId: (entity) => entity.parentId,
  getOrder: (entity) => entity.order,
  isLocked: (entity) => entity.layer.locked ?? false,
  isVisible: (entity) => entity.layer.visible ?? true,
};

export class LayerEditorDocumentValidationError extends Error {
  diagnostics: LayerEditorDocumentDiagnostic[];

  constructor(diagnostics: LayerEditorDocumentDiagnostic[]) {
    super(diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("; "));
    this.name = "LayerEditorDocumentValidationError";
    this.diagnostics = diagnostics;
  }
}

export type LayerEditorLayerDropPosition = "after" | "before";

export function createLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  input: Partial<LayerEditorDocument<TLayerData, TGroupData, TSourceData>> = {},
): LayerEditorDocument<TLayerData, TGroupData, TSourceData> {
  return normalizeLayerEditorDocument({
    layers: input.layers ?? [],
    groups: input.groups,
    sources: input.sources,
    viewport: input.viewport,
  });
}

export function normalizeLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  options: LayerEditorDocumentNormalizationOptions = {},
): LayerEditorDocument<TLayerData, TGroupData, TSourceData> {
  const mode = options.mode ?? "strict";
  const diagnostics = validateLayerEditorDocument(document);

  if (mode === "strict" && diagnostics.length > 0) {
    throw new LayerEditorDocumentValidationError(diagnostics);
  }

  if (!isRecord(document)) {
    return { layers: [], viewport: defaultLayerEditorViewport };
  }

  const layerIds = new Set<string>();
  const normalizedLayers: Array<LayerEditorLayer<TLayerData>> = [];
  const rawLayers = Array.isArray(document.layers) ? document.layers : [];

  for (const layer of rawLayers) {
    if (!isLayerLike(layer) || layerIds.has(layer.id)) {
      continue;
    }

    layerIds.add(layer.id);
    normalizedLayers.push(normalizeLayer(layer));
  }

  const sourceIds = new Set<string>();
  const normalizedSources: Array<LayerEditorSource<TSourceData>> = [];

  for (const source of document.sources ?? []) {
    if (!isSourceLike(source) || sourceIds.has(source.id)) {
      continue;
    }

    sourceIds.add(source.id);
    normalizedSources.push(source);
  }

  const groupIds = new Set<string>();
  const normalizedGroups: Array<LayerEditorGroup<TGroupData>> = [];
  const groupedLayerIds = new Set<string>();

  for (const group of document.groups ?? []) {
    if (!isGroupLike(group) || groupIds.has(group.id)) {
      continue;
    }

    const groupLayerIds: string[] = [];
    const seenInGroup = new Set<string>();

    for (const layerId of group.layerIds) {
      if (!layerIds.has(layerId) || seenInGroup.has(layerId) || groupedLayerIds.has(layerId)) {
        continue;
      }

      seenInGroup.add(layerId);
      groupedLayerIds.add(layerId);
      groupLayerIds.push(layerId);
    }

    if (groupLayerIds.length === 0) {
      continue;
    }

    groupIds.add(group.id);
    normalizedGroups.push({
      ...group,
      layerIds: groupLayerIds,
      locked: group.locked ?? false,
      visible: group.visible ?? true,
    });
  }

  const groupIdSet = new Set(normalizedGroups.map((group) => group.id));
  const cleanedLayers = normalizedLayers.map((layer) => ({
    ...layer,
    parentGroupId:
      layer.parentGroupId && groupIdSet.has(layer.parentGroupId) ? layer.parentGroupId : undefined,
    sourceId: layer.sourceId && sourceIds.has(layer.sourceId) ? layer.sourceId : undefined,
  }));

  return {
    layers: cleanedLayers,
    groups: normalizedGroups.length > 0 ? normalizedGroups : undefined,
    sources: normalizedSources.length > 0 ? normalizedSources : undefined,
    viewport: normalizeViewport(document.viewport),
  };
}

export function validateLayerEditorDocument(input: unknown): LayerEditorDocumentDiagnostic[] {
  const diagnostics: LayerEditorDocumentDiagnostic[] = [];

  if (!isRecord(input)) {
    return [
      {
        code: "invalid-document",
        message: "Expected document to be an object.",
        path: "",
      },
    ];
  }

  if (!Array.isArray(input.layers)) {
    diagnostics.push({
      code: "invalid-document",
      message: "Expected layers array.",
      path: "layers",
    });
    return diagnostics;
  }

  const layerIds = new Set<string>();
  const duplicateLayerIds = new Set<string>();

  input.layers.forEach((layer, index) => {
    const path = `layers[${index}]`;
    if (!isLayerLike(layer)) {
      diagnostics.push({
        code: "invalid-layer",
        message: "Expected layer with string id, label, and kind.",
        path,
      });
      return;
    }

    if (layerIds.has(layer.id)) {
      duplicateLayerIds.add(layer.id);
      diagnostics.push({
        code: "duplicate-layer-id",
        layerId: layer.id,
        message: `Duplicate layer id "${layer.id}".`,
        path: `${path}.id`,
      });
    }
    layerIds.add(layer.id);

    if (layer.opacity !== undefined && !isFiniteNumber(layer.opacity)) {
      diagnostics.push({
        code: "invalid-layer-opacity",
        layerId: layer.id,
        message: "Expected layer opacity to be a finite number.",
        path: `${path}.opacity`,
      });
    }

    if (layer.bounds !== undefined && !isValidBounds(layer.bounds)) {
      diagnostics.push({
        code: "invalid-layer-bounds",
        layerId: layer.id,
        message: "Expected finite bounds with non-negative width and height.",
        path: `${path}.bounds`,
      });
    }
  });

  const sourceIds = new Set<string>();
  if (input.sources !== undefined && !Array.isArray(input.sources)) {
    diagnostics.push({
      code: "invalid-source",
      message: "Expected sources array.",
      path: "sources",
    });
  } else {
    input.sources?.forEach((source, index) => {
      const path = `sources[${index}]`;
      if (!isSourceLike(source)) {
        diagnostics.push({
          code: "invalid-source",
          message: "Expected source with string id and kind.",
          path,
        });
        return;
      }

      if (sourceIds.has(source.id)) {
        diagnostics.push({
          code: "duplicate-source-id",
          message: `Duplicate source id "${source.id}".`,
          path: `${path}.id`,
          sourceId: source.id,
        });
      }
      sourceIds.add(source.id);
    });
  }

  const groupIds = new Set<string>();
  const groupedLayerIds = new Set<string>();
  if (input.groups !== undefined && !Array.isArray(input.groups)) {
    diagnostics.push({
      code: "invalid-group",
      message: "Expected groups array.",
      path: "groups",
    });
  } else {
    input.groups?.forEach((group, groupIndex) => {
      const path = `groups[${groupIndex}]`;
      if (!isGroupLike(group)) {
        diagnostics.push({
          code: "invalid-group",
          message: "Expected group with string id, label, and layerIds.",
          path,
        });
        return;
      }

      if (groupIds.has(group.id)) {
        diagnostics.push({
          code: "duplicate-group-id",
          groupId: group.id,
          message: `Duplicate group id "${group.id}".`,
          path: `${path}.id`,
        });
      }
      groupIds.add(group.id);

      const groupLayerIds = new Set<string>();
      group.layerIds.forEach((layerId, layerIndex) => {
        const layerPath = `${path}.layerIds[${layerIndex}]`;
        if (!layerIds.has(layerId)) {
          diagnostics.push({
            code: "missing-group-layer",
            groupId: group.id,
            layerId,
            message: `Group references missing layer "${layerId}".`,
            path: layerPath,
          });
          return;
        }

        if (groupLayerIds.has(layerId) || groupedLayerIds.has(layerId)) {
          diagnostics.push({
            code: "duplicate-group-layer",
            groupId: group.id,
            layerId,
            message: `Layer "${layerId}" appears more than once in groups.`,
            path: layerPath,
          });
        }

        groupLayerIds.add(layerId);
        groupedLayerIds.add(layerId);
      });
    });
  }

  input.layers.forEach((layer, index) => {
    if (!isLayerLike(layer)) {
      return;
    }

    if (layer.parentGroupId && !groupIds.has(layer.parentGroupId)) {
      diagnostics.push({
        code: "missing-layer-group",
        layerId: layer.id,
        groupId: layer.parentGroupId,
        message: `Layer references missing group "${layer.parentGroupId}".`,
        path: `layers[${index}].parentGroupId`,
      });
    }

    if (layer.sourceId && !sourceIds.has(layer.sourceId)) {
      diagnostics.push({
        code: "missing-layer-source",
        layerId: layer.id,
        sourceId: layer.sourceId,
        message: `Layer references missing source "${layer.sourceId}".`,
        path: `layers[${index}].sourceId`,
      });
    }

    if (duplicateLayerIds.has(layer.id)) {
      return;
    }
  });

  if (input.viewport !== undefined && !isValidViewport(input.viewport)) {
    diagnostics.push({
      code: "invalid-viewport",
      message: "Expected viewport with finite x, y, and positive zoom.",
      path: "viewport",
    });
  }

  return diagnostics;
}

export function assertLayerEditorDocument(
  document: unknown,
): asserts document is LayerEditorDocument {
  const diagnostics = validateLayerEditorDocument(document);
  if (diagnostics.length > 0) {
    throw new LayerEditorDocumentValidationError(diagnostics);
  }
}

export function createLayerEditorEntityDocument<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
): EditorEntityDocument<LayerEditorEntity<TLayerData>> {
  return createEditorEntityDocument(
    document.layers.map((layer, index) => ({
      id: layer.id,
      label: layer.label,
      layer,
      metadata: {
        blendMode: layer.blendMode ?? "normal",
        kind: layer.kind,
        opacity: layer.opacity ?? 1,
      },
      order: index,
      parentId: layer.parentGroupId ?? null,
      type: layer.kind,
    })),
  );
}

export function normalizeLayerEditorSelection(
  document: LayerEditorDocument<unknown, unknown, unknown>,
  selection: LayerEditorSelection,
): LayerEditorSelection {
  const layerIds = new Set(document.layers.map((layer) => layer.id));
  const groupIds = new Set(document.groups?.map((group) => group.id) ?? []);
  const normalizedLayerSelection = normalizeEditorSelection(
    createEditorEntitySelection(selection.layerIds, selection.primaryLayerId ?? undefined),
    (id) => layerIds.has(id),
  );
  const normalizedGroupSelection = normalizeEditorSelection(
    createEditorEntitySelection(selection.groupIds ?? []),
    (id) => groupIds.has(id),
  );
  const selectedLayerIds = getEditorSelectedEntityIds(normalizedLayerSelection);
  const selectedGroupIds = getEditorSelectedEntityIds(normalizedGroupSelection);

  return {
    layerIds: selectedLayerIds,
    groupIds: selectedGroupIds && selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
    primaryLayerId: getEditorSelectionPrimaryEntityId(normalizedLayerSelection),
  };
}

export function findLayerEditorLayer<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
  layerId: string,
) {
  return document.layers.find((layer) => layer.id === layerId) ?? null;
}

export function findLayerEditorGroup<TGroupData = Record<string, unknown>>(
  document: LayerEditorDocument<unknown, TGroupData, unknown>,
  groupId: string,
) {
  return document.groups?.find((group) => group.id === groupId) ?? null;
}

export function findLayerEditorSource<TSourceData = Record<string, unknown>>(
  document: LayerEditorDocument<unknown, unknown, TSourceData>,
  sourceId: string,
) {
  return document.sources?.find((source) => source.id === sourceId) ?? null;
}

export function addLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layer: LayerEditorLayer<TLayerData>,
  options: LayerEditorAddLayerOptions = {},
) {
  const layers = [...document.layers];
  layers.splice(clampInsertIndex(options.index, layers.length), 0, layer);
  return normalizeLayerEditorDocument({ ...document, layers }, { mode: "repair" });
}

export function updateLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  patch: Partial<LayerEditorLayer<TLayerData>>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      layers: document.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...patch, id: layer.id } : layer,
      ),
    },
    { mode: "repair" },
  );
}

export function removeLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>, layerId: string) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      groups: document.groups?.map((group) => ({
        ...group,
        layerIds: group.layerIds.filter((groupLayerId) => groupLayerId !== layerId),
      })),
      layers: document.layers.filter((layer) => layer.id !== layerId),
    },
    { mode: "repair" },
  );
}

export function duplicateLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  options: LayerEditorDuplicateLayerOptions = {},
) {
  const layer = findLayerEditorLayer(document, layerId);
  if (!layer) {
    return document;
  }

  const existingIds = new Set(document.layers.map((item) => item.id));
  const id = options.createId?.(layerId, existingIds) ?? createCopyId(layerId, existingIds);
  const layerIndex = document.layers.findIndex((item) => item.id === layerId);
  const index = options.index ?? layerIndex + 1;

  return addLayerEditorLayer(document, { ...layer, id, label: `${layer.label} Copy` }, { index });
}

export function moveLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  targetIndex: number,
) {
  const index = document.layers.findIndex((layer) => layer.id === layerId);
  if (index < 0) {
    return document;
  }

  const layers = [...document.layers];
  const [layer] = layers.splice(index, 1);
  layers.splice(clampInsertIndex(targetIndex, layers.length), 0, layer);
  return normalizeLayerEditorDocument({ ...document, layers }, { mode: "repair" });
}

export function moveLayerEditorLayerRelativeTo<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  targetLayerId: string,
  position: LayerEditorLayerDropPosition,
) {
  if (layerId === targetLayerId) {
    return document;
  }

  const sourceIndex = document.layers.findIndex((layer) => layer.id === layerId);
  const targetIndex = document.layers.findIndex((layer) => layer.id === targetLayerId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return document;
  }

  const targetLayer = document.layers[targetIndex];
  const targetGroupId =
    targetLayer?.parentGroupId ??
    document.groups?.find((group) => group.layerIds.includes(targetLayerId))?.id;

  const layers = [...document.layers];
  const [sourceLayer] = layers.splice(sourceIndex, 1);
  let insertionIndex = position === "before" ? targetIndex : targetIndex + 1;
  if (sourceIndex < insertionIndex) {
    insertionIndex -= 1;
  }
  layers.splice(clampInsertIndex(insertionIndex, layers.length), 0, {
    ...sourceLayer,
    parentGroupId: targetGroupId,
  });

  const groups = document.groups?.map((group) => {
    const layerIds = group.layerIds.filter((id) => id !== layerId);
    if (group.id !== targetGroupId) {
      return { ...group, layerIds };
    }

    const groupTargetIndex = layerIds.indexOf(targetLayerId);
    const groupInsertionIndex =
      groupTargetIndex < 0
        ? layerIds.length
        : position === "before"
          ? groupTargetIndex
          : groupTargetIndex + 1;
    const nextLayerIds = [...layerIds];
    nextLayerIds.splice(clampInsertIndex(groupInsertionIndex, nextLayerIds.length), 0, layerId);
    return { ...group, layerIds: nextLayerIds };
  });

  return normalizeLayerEditorDocument({ ...document, groups, layers }, { mode: "repair" });
}

export function moveLayerEditorLayerToGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  groupId: string | null,
  targetIndex?: number,
) {
  if (!findLayerEditorLayer(document, layerId)) {
    return document;
  }

  const groups = (document.groups ?? []).map((group) => {
    const layerIds = group.layerIds.filter((id) => id !== layerId);

    if (group.id !== groupId) {
      return { ...group, layerIds };
    }

    const nextLayerIds = [...layerIds];
    nextLayerIds.splice(clampInsertIndex(targetIndex, nextLayerIds.length), 0, layerId);
    return { ...group, layerIds: nextLayerIds };
  });

  return normalizeLayerEditorDocument(
    {
      ...document,
      groups,
      layers: document.layers.map((layer) =>
        layer.id === layerId ? { ...layer, parentGroupId: groupId ?? undefined } : layer,
      ),
    },
    { mode: "repair" },
  );
}

export function setLayerEditorLayerVisibility<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  visible: boolean,
) {
  return updateLayerEditorLayer(document, layerId, { visible });
}

export function setLayerEditorLayerLocked<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  locked: boolean,
) {
  return updateLayerEditorLayer(document, layerId, { locked });
}

export function addLayerEditorGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  group: LayerEditorGroup<TGroupData>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      groups: [...(document.groups ?? []), group],
      layers: document.layers.map((layer) =>
        group.layerIds.includes(layer.id) ? { ...layer, parentGroupId: group.id } : layer,
      ),
    },
    { mode: "repair" },
  );
}

export function updateLayerEditorGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  patch: Partial<LayerEditorGroup<TGroupData>>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      groups: document.groups?.map((group) =>
        group.id === groupId ? { ...group, ...patch, id: group.id } : group,
      ),
    },
    { mode: "repair" },
  );
}

export function removeLayerEditorGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  options: LayerEditorRemoveGroupOptions = {},
) {
  const removedGroup = document.groups?.find((group) => group.id === groupId);
  const layerIdsToRemove = new Set(options.removeLayers ? (removedGroup?.layerIds ?? []) : []);

  return normalizeLayerEditorDocument(
    {
      ...document,
      groups: document.groups?.filter((group) => group.id !== groupId),
      layers: document.layers
        .filter((layer) => !layerIdsToRemove.has(layer.id))
        .map((layer) =>
          layer.parentGroupId === groupId ? { ...layer, parentGroupId: undefined } : layer,
        ),
    },
    { mode: "repair" },
  );
}

export function moveLayerEditorGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  targetIndex: number,
) {
  const groups = document.groups ?? [];
  const index = groups.findIndex((group) => group.id === groupId);
  if (index < 0) {
    return document;
  }

  const nextGroups = [...groups];
  const [group] = nextGroups.splice(index, 1);
  nextGroups.splice(clampInsertIndex(targetIndex, nextGroups.length), 0, group);
  return normalizeLayerEditorDocument({ ...document, groups: nextGroups }, { mode: "repair" });
}

export function addLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  source: LayerEditorSource<TSourceData>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      sources: [...(document.sources ?? []), source],
    },
    { mode: "repair" },
  );
}

export function updateLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  sourceId: string,
  patch: Partial<LayerEditorSource<TSourceData>>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      sources: document.sources?.map((source) =>
        source.id === sourceId ? { ...source, ...patch, id: source.id } : source,
      ),
    },
    { mode: "repair" },
  );
}

export function removeLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  sourceId: string,
  options: LayerEditorRemoveSourceOptions = {},
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      layers: options.removeLayers
        ? document.layers.filter((layer) => layer.sourceId !== sourceId)
        : document.layers.map((layer) =>
            layer.sourceId === sourceId ? { ...layer, sourceId: undefined } : layer,
          ),
      sources: document.sources?.filter((source) => source.id !== sourceId),
    },
    { mode: "repair" },
  );
}

function normalizeLayer<TLayerData>(
  layer: LayerEditorLayer<TLayerData>,
): LayerEditorLayer<TLayerData> {
  const blendMode = layerEditorBlendModes.includes(layer.blendMode ?? "normal")
    ? (layer.blendMode ?? "normal")
    : "normal";

  return {
    ...layer,
    blendMode,
    bounds: layer.bounds ? normalizeBounds(layer.bounds) : undefined,
    locked: layer.locked ?? false,
    opacity: clampNumber(layer.opacity ?? 1, 0, 1),
    visible: layer.visible ?? true,
  };
}

function normalizeBounds(bounds: LayerEditorLayer["bounds"]): LayerEditorLayer["bounds"] {
  if (!bounds) {
    return undefined;
  }

  return {
    x: finiteOr(bounds.x, 0),
    y: finiteOr(bounds.y, 0),
    width: Math.max(0, finiteOr(bounds.width, 0)),
    height: Math.max(0, finiteOr(bounds.height, 0)),
    rotation: bounds.rotation === undefined ? undefined : finiteOr(bounds.rotation, 0),
  };
}

function normalizeViewport(viewport: unknown) {
  if (!isRecord(viewport)) {
    return defaultLayerEditorViewport;
  }

  return createEditorViewportState({
    x: finiteOr(viewport.x, 0),
    y: finiteOr(viewport.y, 0),
    zoom: Math.max(Number.EPSILON, finiteOr(viewport.zoom, 1)),
  });
}

function isLayerLike(value: unknown): value is LayerEditorLayer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.label === "string" &&
    typeof value.kind === "string" &&
    value.kind.length > 0
  );
}

function isGroupLike(value: unknown): value is LayerEditorGroup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.label === "string" &&
    Array.isArray(value.layerIds) &&
    value.layerIds.every((layerId) => typeof layerId === "string")
  );
}

function isSourceLike(value: unknown): value is LayerEditorSource {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.kind === "string" &&
    value.kind.length > 0
  );
}

function isValidBounds(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    value.width >= 0 &&
    isFiniteNumber(value.height) &&
    value.height >= 0 &&
    (value.rotation === undefined || isFiniteNumber(value.rotation))
  );
}

function isValidViewport(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.zoom) &&
    value.zoom > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isEditorRecord(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finiteOr(value: unknown, fallback: number) {
  return isFiniteNumber(value) ? value : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampInsertIndex(index: number | undefined, length: number) {
  if (typeof index !== "number" || !Number.isFinite(index)) {
    return length;
  }

  return Math.min(length, Math.max(0, Math.trunc(index)));
}

function createCopyId(layerId: string, existingIds: ReadonlySet<string>) {
  let index = 1;
  let id = `${layerId}-copy`;
  while (existingIds.has(id)) {
    index += 1;
    id = `${layerId}-copy-${index}`;
  }
  return id;
}
