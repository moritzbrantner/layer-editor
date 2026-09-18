import { normalizeLayerEditorDocument } from "./document-normalization";
import {
  clampInsertIndex,
  createLayerEditorUniqueId,
  normalizeChangedLayerEditorDocument,
} from "./operation-utils";
import type { LayerEditorLayerPatch, LayerEditorLayerPatchUpdater } from "./operation-types";
import type {
  LayerEditorAddLayerOptions,
  LayerEditorBlendMode,
  LayerEditorBounds,
  LayerEditorDocument,
  LayerEditorDuplicateLayerOptions,
  LayerEditorLayer,
  LayerEditorReplaceLayersOptions,
} from "./types";

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

export function updateLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  patchOrUpdater: LayerEditorLayerPatch<TLayerData> | LayerEditorLayerPatchUpdater<TLayerData>,
) {
  const targetLayerIds = new Set(layerIds);
  if (targetLayerIds.size === 0) {
    return document;
  }

  let matchedLayer = false;
  const layers = document.layers.map((layer) => {
    if (!targetLayerIds.has(layer.id)) {
      return layer;
    }

    matchedLayer = true;
    const patch = typeof patchOrUpdater === "function" ? patchOrUpdater(layer) : patchOrUpdater;
    return { ...layer, ...patch, id: layer.id };
  });

  if (!matchedLayer) {
    return document;
  }

  return normalizeChangedLayerEditorDocument(document, { ...document, layers });
}

export function setLayerEditorLayersVisibility<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  visible: boolean,
) {
  return updateLayerEditorLayers(document, layerIds, { visible });
}

export function setLayerEditorLayersLocked<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  locked: boolean,
) {
  return updateLayerEditorLayers(document, layerIds, { locked });
}

export function setLayerEditorLayersOpacity<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  opacity: number,
) {
  return updateLayerEditorLayers(document, layerIds, { opacity });
}

export function setLayerEditorLayersBlendMode<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  blendMode: LayerEditorBlendMode,
) {
  return updateLayerEditorLayers(document, layerIds, { blendMode });
}

export function patchLayerEditorLayerStyle<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  stylePatch: Record<string, unknown>,
) {
  return patchLayerEditorLayersStyle(document, [layerId], stylePatch);
}

export function patchLayerEditorLayersStyle<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  stylePatch: Record<string, unknown>,
) {
  return updateLayerEditorLayers(document, layerIds, (layer) => ({
    style: { ...layer.style, ...stylePatch },
  }));
}

export function patchLayerEditorLayerBounds<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  boundsPatch: Partial<LayerEditorBounds>,
) {
  return patchLayerEditorLayersBounds(document, [layerId], boundsPatch);
}

export function patchLayerEditorLayersBounds<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  boundsPatch: Partial<LayerEditorBounds>,
) {
  return updateLayerEditorLayers(document, layerIds, (layer) => ({
    bounds: { ...(layer.bounds ?? { height: 0, width: 0, x: 0, y: 0 }), ...boundsPatch },
  }));
}

export function removeLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>, layerId: string) {
  return removeLayerEditorLayers(document, [layerId]);
}

export function removeLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>, layerIds: readonly string[]) {
  const layerIdsToRemove = new Set(layerIds);
  if (layerIdsToRemove.size === 0) {
    return document;
  }

  return normalizeLayerEditorDocument(
    {
      ...document,
      groups: document.groups?.map((group) => ({
        ...group,
        layerIds: group.layerIds.filter((groupLayerId) => !layerIdsToRemove.has(groupLayerId)),
      })),
      layers: document.layers.filter((layer) => !layerIdsToRemove.has(layer.id)),
    },
    { mode: "repair" },
  );
}

export function replaceLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
  replacementLayers: readonly LayerEditorLayer<TLayerData>[],
  options: LayerEditorReplaceLayersOptions = {},
) {
  return replaceLayerEditorLayers(document, [layerId], replacementLayers, options);
}

export function replaceLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  replacementLayers: readonly LayerEditorLayer<TLayerData>[],
  options: LayerEditorReplaceLayersOptions = {},
) {
  const targetLayerIds = new Set(layerIds);
  if (targetLayerIds.size === 0) {
    return document;
  }

  const targetLayers = document.layers.filter((layer) => targetLayerIds.has(layer.id));
  if (targetLayers.length !== targetLayerIds.size) {
    return document;
  }

  const remainingLayerIds = new Set(
    document.layers.filter((layer) => !targetLayerIds.has(layer.id)).map((layer) => layer.id),
  );
  const replacementLayerIds = new Set<string>();

  for (const replacementLayer of replacementLayers) {
    if (
      replacementLayerIds.has(replacementLayer.id) ||
      remainingLayerIds.has(replacementLayer.id)
    ) {
      return document;
    }

    replacementLayerIds.add(replacementLayer.id);
  }

  let parentGroupId: string | undefined;
  if (options.parentGroupId !== undefined) {
    parentGroupId = options.parentGroupId ?? undefined;
    if (
      parentGroupId !== undefined &&
      !document.groups?.some((group) => group.id === parentGroupId)
    ) {
      return document;
    }
  } else {
    const targetGroupIds = new Set(targetLayers.map((layer) => layer.parentGroupId));
    if (targetGroupIds.size > 1) {
      return document;
    }

    parentGroupId = targetLayers[0]?.parentGroupId;
  }

  const firstTargetIndex = document.layers.findIndex((layer) => targetLayerIds.has(layer.id));
  const layers = document.layers.filter((layer) => !targetLayerIds.has(layer.id));
  layers.splice(
    firstTargetIndex,
    0,
    ...replacementLayers.map((layer) => ({
      ...layer,
      parentGroupId,
    })),
  );

  const groups = document.groups?.map((group) => {
    const firstTargetGroupIndex = group.layerIds.findIndex((layerId) =>
      targetLayerIds.has(layerId),
    );
    const layerIdsWithoutTargets = group.layerIds.filter((layerId) => !targetLayerIds.has(layerId));

    if (group.id !== parentGroupId) {
      return { ...group, layerIds: layerIdsWithoutTargets };
    }

    const insertIndex =
      firstTargetGroupIndex < 0
        ? layerIdsWithoutTargets.length
        : group.layerIds
            .slice(0, firstTargetGroupIndex)
            .filter((layerId) => !targetLayerIds.has(layerId)).length;

    const layerIds = [...layerIdsWithoutTargets];
    layerIds.splice(insertIndex, 0, ...replacementLayers.map((layer) => layer.id));
    return { ...group, layerIds };
  });

  return normalizeChangedLayerEditorDocument(document, { ...document, groups, layers });
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
  const existingIds = new Set<string>();
  let layer: LayerEditorLayer<TLayerData> | undefined;
  let layerIndex = -1;

  for (let index = 0; index < document.layers.length; index += 1) {
    const candidate = document.layers[index]!;
    existingIds.add(candidate.id);
    if (layerIndex < 0 && candidate.id === layerId) {
      layer = candidate;
      layerIndex = index;
    }
  }

  if (!layer) {
    return document;
  }

  const id =
    options.createId?.(layerId, existingIds) ??
    createLayerEditorUniqueId(`${layerId}-copy`, existingIds);
  const index = options.index ?? layerIndex + 1;

  return addLayerEditorLayer(document, { ...layer, id, label: `${layer.label} Copy` }, { index });
}

export function duplicateLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  options: Pick<LayerEditorDuplicateLayerOptions, "createId"> = {},
) {
  const selectedLayerIds = new Set(layerIds);
  if (selectedLayerIds.size === 0) {
    return document;
  }

  const existingIds = new Set(document.layers.map((layer) => layer.id));
  const copiedLayerIds = new Map<string, string>();
  const layers = document.layers.flatMap((layer) => {
    if (!selectedLayerIds.has(layer.id)) {
      return [layer];
    }

    const id =
      options.createId?.(layer.id, existingIds) ??
      createLayerEditorUniqueId(`${layer.id}-copy`, existingIds);
    existingIds.add(id);
    copiedLayerIds.set(layer.id, id);

    return [layer, { ...layer, id, label: `${layer.label} Copy` }];
  });

  if (copiedLayerIds.size === 0) {
    return document;
  }

  const groups = document.groups?.map((group) => ({
    ...group,
    layerIds: group.layerIds.flatMap((layerId) => {
      const copiedLayerId = copiedLayerIds.get(layerId);
      return copiedLayerId ? [layerId, copiedLayerId] : [layerId];
    }),
  }));

  return normalizeLayerEditorDocument({ ...document, groups, layers }, { mode: "repair" });
}
