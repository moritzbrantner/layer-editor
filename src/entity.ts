import {
  createEditorEntityCollection,
  type EditorEntityCollection,
  type EditorLayerAdapter,
} from "@moritzbrantner/editor-core";

import type { LayerEditorEntity } from "./operation-types";
import type { LayerEditorDocument } from "./types";

export const layerEditorLayerAdapter: EditorLayerAdapter<LayerEditorEntity> = {
  getBounds: (entity) => entity.layer.bounds,
  getParentId: (entity) => entity.parentId,
  getOrder: (entity) => entity.order,
  isLocked: (entity) => entity.layer.locked ?? false,
  isVisible: (entity) => entity.layer.visible ?? true,
};

export function createLayerEditorEntityCollection<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
): EditorEntityCollection<LayerEditorEntity<TLayerData>> {
  return createEditorEntityCollection(
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

/** @deprecated Use createLayerEditorEntityCollection. */
export function createLayerEditorEntityDocument<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
): EditorEntityCollection<LayerEditorEntity<TLayerData>> {
  return createLayerEditorEntityCollection(document);
}
