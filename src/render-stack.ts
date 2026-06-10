import { clampNumber } from "./document-guards";
import { findLayerEditorSource } from "./queries";
import type {
  LayerEditorRenderEntry,
  LayerEditorRenderStackOptions,
  LayerEditorResolvedLayer,
} from "./operation-types";
import type { LayerEditorDocument, LayerEditorLayer } from "./types";

export function resolveLayerEditorLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerId: string,
): LayerEditorResolvedLayer<TLayerData, TGroupData, TSourceData> | null {
  const index = document.layers.findIndex((layer) => layer.id === layerId);
  const layer = document.layers[index];
  if (!layer) {
    return null;
  }

  const groupIndex = findLayerEditorLayerGroupIndex(document, layer);
  const group = groupIndex === null ? null : (document.groups?.[groupIndex] ?? null);
  const source = layer.sourceId ? (findLayerEditorSource(document, layer.sourceId) ?? null) : null;
  const layerBlendMode = layer.blendMode ?? "normal";
  const groupBlendMode = group?.blendMode ?? "normal";

  return {
    effectiveBlendMode: layerBlendMode === "normal" ? groupBlendMode : layerBlendMode,
    effectiveLocked: (group?.locked ?? false) || (layer.locked ?? false),
    effectiveOpacity: clampNumber((group?.opacity ?? 1) * (layer.opacity ?? 1), 0, 1),
    effectiveVisible: (group?.visible ?? true) && (layer.visible ?? true),
    group,
    groupIndex,
    index,
    layer,
    source,
  };
}

export function getLayerEditorRenderStack<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  options: LayerEditorRenderStackOptions = {},
): Array<LayerEditorRenderEntry<TLayerData, TGroupData, TSourceData>> {
  const includeHidden = options.includeHidden ?? false;
  const includeLocked = options.includeLocked ?? true;
  const layers =
    options.order === "reverse-document" ? [...document.layers].reverse() : document.layers;
  const entries: Array<LayerEditorRenderEntry<TLayerData, TGroupData, TSourceData>> = [];

  for (const layer of layers) {
    const resolved = resolveLayerEditorLayer(document, layer.id);
    if (!resolved) {
      continue;
    }

    if (!includeHidden && !resolved.effectiveVisible) {
      continue;
    }

    if (!includeLocked && resolved.effectiveLocked) {
      continue;
    }

    entries.push({ ...resolved, renderIndex: entries.length });
  }

  return entries;
}

function findLayerEditorLayerGroupIndex(
  document: LayerEditorDocument<unknown, unknown, unknown>,
  layer: LayerEditorLayer<unknown>,
) {
  const groups = document.groups ?? [];
  const parentGroupIndex = layer.parentGroupId
    ? groups.findIndex((group) => group.id === layer.parentGroupId)
    : -1;
  if (parentGroupIndex >= 0) {
    return parentGroupIndex;
  }

  const membershipGroupIndex = groups.findIndex((group) => group.layerIds.includes(layer.id));
  return membershipGroupIndex >= 0 ? membershipGroupIndex : null;
}
