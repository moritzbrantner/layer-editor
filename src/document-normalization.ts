import { createEditorViewportState } from "@moritzbrantner/editor-core";

import { LayerEditorDocumentValidationError } from "./document-errors";
import {
  clampNumber,
  finiteOr,
  isGroupLike,
  isLayerEditorBlendMode,
  isLayerLike,
  isRecord,
  isSourceLike,
} from "./document-guards";
import { validateLayerEditorDocument } from "./document-validation";
import {
  defaultLayerEditorViewport,
  layerEditorBlendModes,
  type LayerEditorDocument,
  type LayerEditorDocumentNormalizationOptions,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorSource,
} from "./types";

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
    normalizedGroups.push(normalizeGroup({ ...group, layerIds: groupLayerIds }));
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

function normalizeGroup<TGroupData>(
  group: LayerEditorGroup<TGroupData>,
): LayerEditorGroup<TGroupData> {
  const blendMode = isLayerEditorBlendMode(group.blendMode) ? group.blendMode : "normal";

  return {
    ...group,
    blendMode,
    locked: group.locked ?? false,
    opacity: clampNumber(finiteOr(group.opacity, 1), 0, 1),
    visible: group.visible ?? true,
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
