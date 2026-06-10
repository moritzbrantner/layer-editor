import type {
  LayerEditorDocument,
  LayerEditorGroup,
  LayerEditorLayer,
  LayerEditorSource,
} from "./core";
import type {
  LayerEditorGroupFilterContext,
  LayerEditorLayerFilterContext,
  LayerEditorRenderedGroup,
  LayerEditorRenderedTree,
  LayerEditorTreeItem,
} from "./react-types";
import { groupTreeItemKey, layerTreeItemKey } from "./react-tree-keys";

export function getFilteredLayerEditorTree<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  document,
  filterGroup,
  filterLayer,
  query,
}: {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  filterGroup?: (
    context: LayerEditorGroupFilterContext<TLayerData, TGroupData, TSourceData>,
  ) => boolean;
  filterLayer?: (
    context: LayerEditorLayerFilterContext<TLayerData, TGroupData, TSourceData>,
  ) => boolean;
  query: string;
}): LayerEditorRenderedTree<TLayerData, TGroupData> {
  const normalizedQuery = normalizeLayerEditorFilterQuery(query);
  const hasFilter = normalizedQuery.length > 0;
  const items: LayerEditorTreeItem[] = [];
  const visibleLayerIds: string[] = [];
  const layerById = new Map(document.layers.map((layer) => [layer.id, layer]));
  const sourcesById = new Map((document.sources ?? []).map((source) => [source.id, source]));
  const groupedLayerIds = new Set<string>();
  const renderedGroups: Array<LayerEditorRenderedGroup<TLayerData, TGroupData>> = [];

  for (const group of document.groups ?? []) {
    const groupLayers = group.layerIds
      .map((layerId) => layerById.get(layerId))
      .filter((layer): layer is LayerEditorLayer<TLayerData> => Boolean(layer));
    for (const layer of groupLayers) {
      groupedLayerIds.add(layer.id);
    }

    if (!hasFilter) {
      renderedGroups.push({
        forceExpanded: false,
        group,
        layers: group.collapsed ? [] : groupLayers,
      });
      items.push({ id: group.id, kind: "group", key: groupTreeItemKey(group.id) });
      if (!group.collapsed) {
        for (const layer of groupLayers) {
          items.push({ id: layer.id, kind: "layer", key: layerTreeItemKey(layer.id) });
          visibleLayerIds.push(layer.id);
        }
      }
      continue;
    }

    const groupMatches =
      filterGroup?.({ document, group, query: normalizedQuery }) ??
      defaultGroupMatchesFilter(group, normalizedQuery);
    const matchingLayers = groupMatches
      ? groupLayers
      : groupLayers.filter((layer) =>
          layerMatchesFilter({
            document,
            filterLayer,
            layer,
            query: normalizedQuery,
            source: layer.sourceId ? (sourcesById.get(layer.sourceId) ?? null) : null,
          }),
        );

    if (groupMatches || matchingLayers.length > 0) {
      renderedGroups.push({
        forceExpanded: true,
        group,
        layers: matchingLayers,
      });
      items.push({ id: group.id, kind: "group", key: groupTreeItemKey(group.id) });
      for (const layer of matchingLayers) {
        items.push({ id: layer.id, kind: "layer", key: layerTreeItemKey(layer.id) });
        visibleLayerIds.push(layer.id);
      }
    }
  }

  const ungroupedLayers = document.layers.filter((layer) => {
    if (groupedLayerIds.has(layer.id)) {
      return false;
    }

    if (!hasFilter) {
      return true;
    }

    return layerMatchesFilter({
      document,
      filterLayer,
      layer,
      query: normalizedQuery,
      source: layer.sourceId ? (sourcesById.get(layer.sourceId) ?? null) : null,
    });
  });

  for (const layer of ungroupedLayers) {
    items.push({ id: layer.id, kind: "layer", key: layerTreeItemKey(layer.id) });
    visibleLayerIds.push(layer.id);
  }

  return {
    groups: renderedGroups,
    hasFilter,
    hasMatches: renderedGroups.length > 0 || ungroupedLayers.length > 0,
    treeItems: items,
    ungroupedLayers,
    visibleLayerIds,
  };
}

function layerMatchesFilter<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  document,
  filterLayer,
  layer,
  query,
  source,
}: {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  filterLayer?: (
    context: LayerEditorLayerFilterContext<TLayerData, TGroupData, TSourceData>,
  ) => boolean;
  layer: LayerEditorLayer<TLayerData>;
  query: string;
  source: LayerEditorSource<TSourceData> | null;
}) {
  return (
    filterLayer?.({ document, layer, query, source }) ??
    defaultLayerMatchesFilter(layer, source, query)
  );
}

function normalizeLayerEditorFilterQuery(query: string) {
  return query.trim().toLowerCase();
}

function defaultLayerMatchesFilter<TLayerData, TSourceData>(
  layer: LayerEditorLayer<TLayerData>,
  source: LayerEditorSource<TSourceData> | null,
  query: string,
) {
  return [layer.id, layer.kind, layer.label, source?.id, source?.kind, source?.label].some(
    (value) => value?.toLowerCase().includes(query),
  );
}

function defaultGroupMatchesFilter<TGroupData>(group: LayerEditorGroup<TGroupData>, query: string) {
  return [group.id, group.label].some((value) => value.toLowerCase().includes(query));
}
