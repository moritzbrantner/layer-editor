"use client";

import { useCallback } from "react";

import type { LayerEditorDocument, LayerEditorSelection } from "./core";

type LayerEditorSelectionActionOptions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  emitSelection: (
    document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
    selection: LayerEditorSelection,
  ) => void;
  resolvedSelection: LayerEditorSelection;
};

export function useLayerEditorSelectionActions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  document,
  emitSelection,
  resolvedSelection,
}: LayerEditorSelectionActionOptions<TLayerData, TGroupData, TSourceData>) {
  const selectLayers = useCallback(
    (layerIds: readonly string[], primaryLayerId: string | null = layerIds[0] ?? null) => {
      emitSelection(document, { layerIds: [...layerIds], primaryLayerId });
    },
    [document, emitSelection],
  );

  const selectLayer = useCallback(
    (layerId: string, additive = false) => {
      const selected = resolvedSelection.layerIds.includes(layerId);
      const nextLayerIds =
        additive && selected
          ? resolvedSelection.layerIds.filter((selectedLayerId) => selectedLayerId !== layerId)
          : additive
            ? [...resolvedSelection.layerIds, layerId]
            : [layerId];

      selectLayers(
        nextLayerIds,
        nextLayerIds.includes(layerId) ? layerId : (nextLayerIds[0] ?? null),
      );
    },
    [resolvedSelection.layerIds, selectLayers],
  );

  const clearSelection = useCallback(() => {
    emitSelection(document, { layerIds: [], primaryLayerId: null });
  }, [document, emitSelection]);

  return { clearSelection, selectLayer, selectLayers };
}
