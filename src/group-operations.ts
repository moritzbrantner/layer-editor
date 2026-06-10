import { normalizeLayerEditorDocument } from "./document-normalization";
import { clampInsertIndex, normalizeChangedLayerEditorDocument } from "./operation-utils";
import type {
  LayerEditorBlendMode,
  LayerEditorDocument,
  LayerEditorGroup,
  LayerEditorRemoveGroupOptions,
} from "./types";

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

export function groupLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  group: LayerEditorGroup<TGroupData>,
) {
  return addLayerEditorGroup(document, group);
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

export function setLayerEditorGroupVisibility<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  visible: boolean,
) {
  return updateLayerEditorGroupWithNoopCheck(document, groupId, { visible });
}

export function setLayerEditorGroupLocked<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  locked: boolean,
) {
  return updateLayerEditorGroupWithNoopCheck(document, groupId, { locked });
}

export function setLayerEditorGroupOpacity<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  opacity: number,
) {
  return updateLayerEditorGroupWithNoopCheck(document, groupId, { opacity });
}

export function setLayerEditorGroupBlendMode<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  blendMode: LayerEditorBlendMode,
) {
  return updateLayerEditorGroupWithNoopCheck(document, groupId, { blendMode });
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

export function ungroupLayerEditorGroup<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>, groupId: string) {
  return removeLayerEditorGroup(document, groupId, { removeLayers: false });
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

function updateLayerEditorGroupWithNoopCheck<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  groupId: string,
  patch: Partial<Omit<LayerEditorGroup<TGroupData>, "id">>,
) {
  const groups = document.groups ?? [];
  if (!groups.some((group) => group.id === groupId)) {
    return document;
  }

  return normalizeChangedLayerEditorDocument(document, {
    ...document,
    groups: groups.map((group) =>
      group.id === groupId ? { ...group, ...patch, id: group.id } : group,
    ),
  });
}
