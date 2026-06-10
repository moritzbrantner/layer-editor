import {
  createEditorEntitySelection,
  getEditorSelectedEntityIds,
  getEditorSelectionPrimaryEntityId,
  normalizeEditorSelection,
} from "@moritzbrantner/editor-core";

import type { LayerEditorDocument, LayerEditorSelection } from "./types";

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
