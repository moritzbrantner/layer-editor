import { normalizeLayerEditorDocument } from "./document-normalization";
import type {
  LayerEditorDocument,
  LayerEditorRemoveSourceOptions,
  LayerEditorSource,
} from "./types";

export function addLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  source: LayerEditorSource<TSourceData>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      sources: [...(document.sources ?? []), source],
    },
    { mode: "repair" },
  );
}

export function updateLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  sourceId: string,
  patch: Partial<LayerEditorSource<TSourceData>>,
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      sources: document.sources?.map((source) =>
        source.id === sourceId ? { ...source, ...patch, id: source.id } : source,
      ),
    },
    { mode: "repair" },
  );
}

export function removeLayerEditorSource<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  sourceId: string,
  options: LayerEditorRemoveSourceOptions = {},
) {
  return normalizeLayerEditorDocument(
    {
      ...document,
      layers: options.removeLayers
        ? document.layers.filter((layer) => layer.sourceId !== sourceId)
        : document.layers.map((layer) =>
            layer.sourceId === sourceId ? { ...layer, sourceId: undefined } : layer,
          ),
      sources: document.sources?.filter((source) => source.id !== sourceId),
    },
    { mode: "repair" },
  );
}
