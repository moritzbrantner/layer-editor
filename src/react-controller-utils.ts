import type { LayerEditorDocument, LayerEditorSelection } from "./core";

export function nearestSurvivingLayerSelection<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  previousDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  nextDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  removedLayerIds: readonly string[],
): LayerEditorSelection {
  const removedLayerIdSet = new Set(removedLayerIds);
  const firstRemovedIndex = previousDocument.layers.findIndex((layer) =>
    removedLayerIdSet.has(layer.id),
  );

  const fallbackLayer =
    nextDocument.layers[Math.min(Math.max(firstRemovedIndex, 0), nextDocument.layers.length - 1)] ??
    null;

  return {
    layerIds: fallbackLayer ? [fallbackLayer.id] : [],
    primaryLayerId: fallbackLayer?.id ?? null,
  };
}
