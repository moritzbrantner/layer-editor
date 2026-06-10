import { normalizeLayerEditorDocument } from "./document-normalization";
import { updateLayerEditorLayer } from "./layer-operations";
import { findLayerEditorLayer } from "./queries";
import { clampInsertIndex } from "./operation-utils";
import type { LayerEditorLayerDropPosition } from "./operation-types";
import type { LayerEditorDocument } from "./types";

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
