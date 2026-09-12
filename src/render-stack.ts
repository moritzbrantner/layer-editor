import { clampNumber } from "./document-guards";
import { findLayerEditorSource } from "./queries";
import type {
  LayerEditorRenderEntry,
  LayerEditorRenderStackOptions,
  LayerEditorResolvedLayer,
} from "./operation-types";
import type {
  LayerEditorDocument,
  LayerEditorGroup,
  LayerEditorLayer,
  LayerEditorSource,
} from "./types";

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

  return createResolvedLayer(layer, index, group, groupIndex, source);
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
  const groups = document.groups ?? [];
  const groupIndexById = new Map<string, number>();
  const membershipGroupIndexByLayerId = new Map<string, number>();
  const sourceById = new Map<string, LayerEditorSource<TSourceData>>();

  groups.forEach((group, groupIndex) => {
    if (!groupIndexById.has(group.id)) {
      groupIndexById.set(group.id, groupIndex);
    }

    for (const layerId of group.layerIds) {
      if (!membershipGroupIndexByLayerId.has(layerId)) {
        membershipGroupIndexByLayerId.set(layerId, groupIndex);
      }
    }
  });

  for (const source of document.sources ?? []) {
    if (!sourceById.has(source.id)) {
      sourceById.set(source.id, source);
    }
  }

  const entries: Array<LayerEditorRenderEntry<TLayerData, TGroupData, TSourceData>> = [];
  const reverse = options.order === "reverse-document";

  for (let offset = 0; offset < document.layers.length; offset += 1) {
    const index = reverse ? document.layers.length - offset - 1 : offset;
    const layer = document.layers[index]!;
    const parentGroupIndex = layer.parentGroupId
      ? groupIndexById.get(layer.parentGroupId)
      : undefined;
    const groupIndex = parentGroupIndex ?? membershipGroupIndexByLayerId.get(layer.id) ?? null;
    const group = groupIndex === null ? null : (groups[groupIndex] ?? null);
    const source = layer.sourceId ? (sourceById.get(layer.sourceId) ?? null) : null;
    const resolved = createResolvedLayer(layer, index, group, groupIndex, source);

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

function createResolvedLayer<TLayerData, TGroupData, TSourceData>(
  layer: LayerEditorLayer<TLayerData>,
  index: number,
  group: LayerEditorGroup<TGroupData> | null,
  groupIndex: number | null,
  source: LayerEditorSource<TSourceData> | null,
): LayerEditorResolvedLayer<TLayerData, TGroupData, TSourceData> {
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
