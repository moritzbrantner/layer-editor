"use client";

import { TooltipProvider } from "@moritzbrantner/ui";
import { useCallback, useEffect, useMemo, useState } from "react";

import { joinClassNames } from "./react-class-names";
import { useLayerEditorController } from "./react-controller";
import { resolveLayerEditorPanelFeatures } from "./react-features";
import { getFilteredLayerEditorTree } from "./react-filtering";
import { LayerEditorPanelTree } from "./react-panel-tree";
import { LayerEditorSearchField, LayerEditorToolbar } from "./react-toolbar";
import { useLayerEditorPanelInteractions } from "./react-panel-interactions";
import { layerTreeItemKey } from "./react-tree-keys";
import type { LayerEditorDropTarget, LayerEditorPanelProps } from "./react-types";

export function LayerEditorPanel<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  className,
  createGroup,
  createLayer,
  document,
  filterGroup,
  filterLayer,
  filterPlaceholder = "Search layers",
  filterQuery,
  features,
  history,
  historyLimit,
  onDocumentChange,
  onFilterQueryChange,
  onHistoryChange,
  onSelectionChange,
  readOnly = false,
  renderGroupActions,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
  selection,
}: LayerEditorPanelProps<TLayerData, TGroupData, TSourceData>) {
  const resolvedFeatures = resolveLayerEditorPanelFeatures(
    features,
    Boolean(history && onHistoryChange),
  );
  const controller = useLayerEditorController({
    createGroup,
    createLayer,
    document,
    history,
    historyLimit,
    onDocumentChange,
    onHistoryChange,
    onSelectionChange,
    readOnly,
    selection,
  });

  const [uncontrolledFilterQuery, setUncontrolledFilterQuery] = useState("");
  const activeFilterQuery = filterQuery ?? uncontrolledFilterQuery;
  const setFilterQuery = useCallback(
    (query: string) => {
      if (filterQuery === undefined) {
        setUncontrolledFilterQuery(query);
      }
      onFilterQueryChange?.(query);
    },
    [filterQuery, onFilterQueryChange],
  );

  const renderedTree = useMemo(
    () =>
      getFilteredLayerEditorTree({
        document,
        filterGroup,
        filterLayer,
        query: activeFilterQuery,
      }),
    [activeFilterQuery, document, filterGroup, filterLayer],
  );
  const { groups, hasFilter, hasMatches, treeItems, ungroupedLayers, visibleLayerIds } =
    renderedTree;
  const firstTreeItemKey = treeItems[0]?.key ?? null;
  const [focusedTreeItemKey, setFocusedTreeItemKey] = useState<string | null>(() =>
    selection?.primaryLayerId ? layerTreeItemKey(selection.primaryLayerId) : firstTreeItemKey,
  );
  const [selectionAnchorLayerId, setSelectionAnchorLayerId] = useState<string | null>(
    selection?.primaryLayerId ?? null,
  );
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<LayerEditorDropTarget | null>(null);
  const [openLayerMenuLayerId, setOpenLayerMenuLayerId] = useState<string | null>(null);
  const [openGroupMenuGroupId, setOpenGroupMenuGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedTreeItemKey || !treeItems.some((item) => item.key === focusedTreeItemKey)) {
      setFocusedTreeItemKey(firstTreeItemKey);
    }
  }, [firstTreeItemKey, focusedTreeItemKey, treeItems]);

  const clearDragState = useCallback(() => {
    setDraggedLayerId(null);
    setActiveDropTarget(null);
  }, []);

  const { handleGroupDrop, handleLayerSelect, handlePanelKeyDown, handleTreeItemKeyDown } =
    useLayerEditorPanelInteractions({
      clearDragState,
      controller,
      draggedLayerId,
      readOnly,
      resolvedFeatures,
      selectionAnchorLayerId,
      setFocusedTreeItemKey,
      setSelectionAnchorLayerId,
      visibleLayerIds,
    });

  return (
    <TooltipProvider>
      <div className={joinClassNames("mb-layer-editor", className)} onKeyDown={handlePanelKeyDown}>
        {resolvedFeatures.toolbar ? (
          <LayerEditorToolbar controller={controller} features={resolvedFeatures} />
        ) : null}
        {resolvedFeatures.search ? (
          <LayerEditorSearchField
            placeholder={filterPlaceholder}
            query={activeFilterQuery}
            onQueryChange={setFilterQuery}
          />
        ) : null}
        <LayerEditorPanelTree
          activeDropTarget={activeDropTarget}
          controller={controller}
          document={document}
          draggedLayerId={draggedLayerId}
          features={resolvedFeatures}
          firstTreeItemKey={firstTreeItemKey}
          focusedTreeItemKey={focusedTreeItemKey}
          groups={groups}
          hasFilter={hasFilter}
          hasMatches={hasMatches}
          onDragLayerChange={setDraggedLayerId}
          onDragStateClear={clearDragState}
          onDropTargetChange={setActiveDropTarget}
          onGroupDrop={handleGroupDrop}
          onLayerSelect={handleLayerSelect}
          onOpenGroupMenuChange={setOpenGroupMenuGroupId}
          onOpenLayerMenuChange={setOpenLayerMenuLayerId}
          onTreeItemFocus={setFocusedTreeItemKey}
          onTreeItemKeyDown={handleTreeItemKeyDown}
          openGroupMenuGroupId={openGroupMenuGroupId}
          openLayerMenuLayerId={openLayerMenuLayerId}
          readOnly={readOnly}
          renderGroupActions={renderGroupActions}
          renderLayerActions={renderLayerActions}
          renderLayerLabel={renderLayerLabel}
          renderLayerMeta={renderLayerMeta}
          ungroupedLayers={ungroupedLayers}
        />
      </div>
    </TooltipProvider>
  );
}
