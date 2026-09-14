import { createEditorEntityDocument, type EditorEntityDocument } from "@moenarch/editor-core";

import type { LayerEditorEntity } from "./operation-types";
import type { LayerEditorDocument } from "./types";

export const layerEditorLayerAdapter = {
  getBounds: (entity: LayerEditorEntity) => entity.layer.bounds,
  getParentId: (entity: LayerEditorEntity) => entity.parentId,
  getOrder: (entity: LayerEditorEntity) => entity.order,
  isLocked: (entity: LayerEditorEntity) => entity.layer.locked ?? false,
  isVisible: (entity: LayerEditorEntity) => entity.layer.visible ?? true,
};

export function createLayerEditorEntityCollection<TLayerData = Record<string, unknown>>(
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

/** @deprecated Use createLayerEditorEntityCollection. */
export function createLayerEditorEntityDocument<TLayerData = Record<string, unknown>>(
  document: LayerEditorDocument<TLayerData, unknown, unknown>,
): EditorEntityDocument<LayerEditorEntity<TLayerData>> {
  return createLayerEditorEntityCollection(document);
}
