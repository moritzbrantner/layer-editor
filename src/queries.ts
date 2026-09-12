import type { LayerEditorDocument } from "./types";

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

export function getLayerEditorLayerIds(document: LayerEditorDocument<unknown, unknown, unknown>) {
  return document.layers.map((layer) => layer.id);
}

export function getLayerEditorGroupIds(document: LayerEditorDocument<unknown, unknown, unknown>) {
  return document.groups?.map((group) => group.id) ?? [];
}

export function getLayerEditorLayersById<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
) {
  const layersById = new Map<string, (typeof document.layers)[number]>();
  for (const layer of document.layers) {
    layersById.set(layer.id, layer);
  }
  return layersById;
}

export function getLayerEditorGroupsById<TGroupData = Record<string, unknown>>(
  document: LayerEditorDocument<unknown, TGroupData, unknown>,
) {
  const groupsById = new Map<string, NonNullable<typeof document.groups>[number]>();
  for (const group of document.groups ?? []) {
    groupsById.set(group.id, group);
  }
  return groupsById;
}

export function getLayerEditorSourcesById<TSourceData = Record<string, unknown>>(
  document: LayerEditorDocument<unknown, unknown, TSourceData>,
) {
  const sourcesById = new Map<string, NonNullable<typeof document.sources>[number]>();
  for (const source of document.sources ?? []) {
    sourcesById.set(source.id, source);
  }
  return sourcesById;
}

export function getLayerEditorGroupLayers<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
  groupId: string,
) {
  const group = document.groups?.find((item) => item.id === groupId);
  if (!group) {
    return [];
  }

  const layersById = getLayerEditorLayersById(document);
  return group.layerIds.flatMap((layerId) => {
    const layer = layersById.get(layerId);
    return layer ? [layer] : [];
  });
}

export function getLayerEditorUngroupedLayers<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
) {
  const groupedLayerIds = new Set<string>();
  for (const group of document.groups ?? []) {
    for (const layerId of group.layerIds) {
      groupedLayerIds.add(layerId);
    }
  }
  return document.layers.filter((layer) => !layer.parentGroupId && !groupedLayerIds.has(layer.id));
}
