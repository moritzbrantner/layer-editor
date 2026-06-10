"use client";

import { useCallback } from "react";

import {
  addLayerEditorLayer,
  createLayerEditorUniqueId,
  duplicateLayerEditorLayers,
  moveLayerEditorLayer,
  moveLayerEditorLayerRelativeTo,
  moveLayerEditorLayerToGroup,
  removeLayerEditorLayers,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  updateLayerEditorLayer,
  type LayerEditorDocument,
  type LayerEditorLayer,
  type LayerEditorLayerDropPosition,
  type LayerEditorSelection,
} from "./core";
import type { LayerEditorCommitDocument } from "./react-controller-action-types";
import { nearestSurvivingLayerSelection } from "./react-controller-utils";
import type { LayerEditorPanelProps } from "./react-types";

type LayerEditorLayerActionOptions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  commitDocument: LayerEditorCommitDocument<TLayerData, TGroupData, TSourceData>;
  createLayer?: LayerEditorPanelProps<TLayerData, TGroupData, TSourceData>["createLayer"];
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  readOnly: boolean;
  resolvedSelection: LayerEditorSelection;
};

export function useLayerEditorLayerActions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  commitDocument,
  createLayer,
  document,
  readOnly,
  resolvedSelection,
}: LayerEditorLayerActionOptions<TLayerData, TGroupData, TSourceData>) {
  const addLayer = useCallback(
    (layer?: LayerEditorLayer<TLayerData>) => {
      if (readOnly) {
        return;
      }

      const existingIds = new Set(document.layers.map((item) => item.id));
      const nextLayer =
        layer ??
        createLayer?.({ document, existingIds, selection: resolvedSelection }) ??
        ({
          id: createLayerEditorUniqueId("layer", existingIds),
          kind: "layer",
          label: "Layer",
        } as LayerEditorLayer<TLayerData>);

      commitDocument(addLayerEditorLayer(document, nextLayer), {
        layerIds: [nextLayer.id],
        primaryLayerId: nextLayer.id,
      });
    },
    [commitDocument, createLayer, document, readOnly, resolvedSelection],
  );

  const duplicateLayers = useCallback(
    (layerIds: readonly string[]) => {
      if (readOnly || layerIds.length === 0) {
        return;
      }

      const copiedLayerIds: string[] = [];
      const nextDocument = duplicateLayerEditorLayers(document, layerIds, {
        createId: (layerId, existingIds) => {
          const copiedLayerId = createLayerEditorUniqueId(`${layerId}-copy`, existingIds);
          copiedLayerIds.push(copiedLayerId);
          return copiedLayerId;
        },
      });

      commitDocument(nextDocument, {
        layerIds: copiedLayerIds,
        primaryLayerId: copiedLayerIds[0] ?? null,
      });
    },
    [commitDocument, document, readOnly],
  );

  const duplicateSelectedLayers = useCallback(() => {
    duplicateLayers(resolvedSelection.layerIds);
  }, [duplicateLayers, resolvedSelection.layerIds]);

  const removeLayers = useCallback(
    (layerIds: readonly string[]) => {
      if (readOnly || layerIds.length === 0) {
        return;
      }

      const nextDocument = removeLayerEditorLayers(document, layerIds);
      commitDocument(
        nextDocument,
        nearestSurvivingLayerSelection(document, nextDocument, layerIds),
      );
    },
    [commitDocument, document, readOnly],
  );

  const removeSelectedLayers = useCallback(() => {
    removeLayers(resolvedSelection.layerIds);
  }, [removeLayers, resolvedSelection.layerIds]);

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      const layer = document.layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      commitDocument(setLayerEditorLayerVisibility(document, layerId, !(layer.visible ?? true)));
    },
    [commitDocument, document],
  );

  const toggleLayerLocked = useCallback(
    (layerId: string) => {
      const layer = document.layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      commitDocument(setLayerEditorLayerLocked(document, layerId, !(layer.locked ?? false)));
    },
    [commitDocument, document],
  );

  const moveLayer = useCallback(
    (layerId: string, direction: "down" | "up") => {
      const index = document.layers.findIndex((layer) => layer.id === layerId);
      if (index < 0) {
        return;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      commitDocument(moveLayerEditorLayer(document, layerId, targetIndex));
    },
    [commitDocument, document],
  );

  const moveLayerRelativeTo = useCallback(
    (layerId: string, targetLayerId: string, position: LayerEditorLayerDropPosition) => {
      commitDocument(moveLayerEditorLayerRelativeTo(document, layerId, targetLayerId, position));
    },
    [commitDocument, document],
  );

  const moveLayerToGroup = useCallback(
    (layerId: string, groupId: string | null, targetIndex?: number) => {
      if (readOnly) {
        return;
      }

      commitDocument(moveLayerEditorLayerToGroup(document, layerId, groupId, targetIndex), {
        ...resolvedSelection,
        primaryLayerId: resolvedSelection.layerIds.includes(layerId)
          ? layerId
          : resolvedSelection.primaryLayerId,
      });
    },
    [commitDocument, document, readOnly, resolvedSelection],
  );

  const renameLayer = useCallback(
    (layerId: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      commitDocument(updateLayerEditorLayer(document, layerId, { label: nextLabel }));
    },
    [commitDocument, document],
  );

  return {
    addLayer,
    duplicateLayers,
    duplicateSelectedLayers,
    moveLayer,
    moveLayerRelativeTo,
    moveLayerToGroup,
    removeLayers,
    removeSelectedLayers,
    renameLayer,
    toggleLayerLocked,
    toggleLayerVisibility,
  };
}
