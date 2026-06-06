"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@moritzbrantner/ui";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  FolderMinus,
  FolderPlus,
  Layers,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  Unlock,
  Undo2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  addLayerEditorLayer,
  createLayerEditorUniqueId,
  duplicateLayerEditorLayers,
  groupLayerEditorLayers,
  moveLayerEditorLayer,
  moveLayerEditorLayerRelativeTo,
  normalizeLayerEditorSelection,
  removeLayerEditorGroup,
  removeLayerEditorLayers,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  ungroupLayerEditorGroup,
  updateLayerEditorGroup,
  updateLayerEditorLayer,
  type LayerEditorDocument,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorLayerDropPosition,
  type LayerEditorSelection,
} from "./core";
import {
  canRedoLayerEditorHistory,
  canUndoLayerEditorHistory,
  commitLayerEditorHistory,
  redoLayerEditorHistory,
  undoLayerEditorHistory,
  type LayerEditorHistoryState,
} from "./history";

type LayerEditorTreeItem =
  | { id: string; kind: "group"; key: string }
  | { id: string; kind: "layer"; key: string };

type LayerEditorTreeItemKeyboardContext = {
  event: KeyboardEvent<HTMLDivElement>;
  group?: { collapsed?: boolean; id: string };
  itemKey: string;
  kind: "group" | "layer";
  layer?: { id: string };
};

export type LayerEditorPanelFeatures = {
  groupMenus?: boolean;
  historyControls?: boolean;
  keyboardCommands?: boolean;
  layerMenus?: boolean;
  toolbar?: boolean;
};

export type LayerEditorCreateLayerContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  existingIds: ReadonlySet<string>;
  selection: LayerEditorSelection;
};

export type LayerEditorCreateGroupContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  existingIds: ReadonlySet<string>;
  selection: LayerEditorSelection;
};

export type LayerEditorLayerActionContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  layer: LayerEditorLayer<TLayerData>;
  selection: LayerEditorSelection;
};

export type LayerEditorGroupActionContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  group: LayerEditorGroup<TGroupData>;
  selection: LayerEditorSelection;
};

export type LayerEditorPanelProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  className?: string;
  createGroup?: (
    context: LayerEditorCreateGroupContext<TLayerData, TGroupData, TSourceData>,
  ) => LayerEditorGroup<TGroupData>;
  createLayer?: (
    context: LayerEditorCreateLayerContext<TLayerData, TGroupData, TSourceData>,
  ) => LayerEditorLayer<TLayerData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  features?: LayerEditorPanelFeatures;
  history?: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>;
  historyLimit?: number;
  selection?: LayerEditorSelection;
  readOnly?: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  onDocumentChange?: (document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>) => void;
  onHistoryChange?: (history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) => void;
  onSelectionChange?: (selection: LayerEditorSelection) => void;
};

export type LayerEditorController<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  canRedo: boolean;
  canUndo: boolean;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  readOnly: boolean;
  selection: LayerEditorSelection;
  addGroup: (group?: LayerEditorGroup<TGroupData>) => void;
  addLayer: (layer?: LayerEditorLayer<TLayerData>) => void;
  clearSelection: () => void;
  commitDocument: (
    document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
    selection?: LayerEditorSelection,
  ) => void;
  duplicateLayers: (layerIds: readonly string[]) => void;
  duplicateSelectedLayers: () => void;
  groupSelectedLayers: () => void;
  moveLayer: (layerId: string, direction: "down" | "up") => void;
  moveLayerRelativeTo: (
    layerId: string,
    targetLayerId: string,
    position: LayerEditorLayerDropPosition,
  ) => void;
  redo: () => void;
  removeGroup: (groupId: string, options?: { removeLayers?: boolean }) => void;
  removeLayers: (layerIds: readonly string[]) => void;
  removeSelectedLayers: () => void;
  renameGroup: (groupId: string, label: string) => void;
  renameLayer: (layerId: string, label: string) => void;
  selectLayer: (layerId: string, additive?: boolean) => void;
  selectLayers: (layerIds: readonly string[], primaryLayerId?: string | null) => void;
  toggleGroupLocked: (groupId: string) => void;
  toggleGroupCollapsed: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  toggleLayerLocked: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  undo: () => void;
  ungroupGroup: (groupId: string) => void;
};

export function useLayerEditorController<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  createGroup,
  createLayer,
  document,
  history,
  historyLimit,
  onHistoryChange,
  readOnly = false,
  selection,
  onDocumentChange,
  onSelectionChange,
}: Pick<
  LayerEditorPanelProps<TLayerData, TGroupData, TSourceData>,
  | "createGroup"
  | "createLayer"
  | "document"
  | "history"
  | "historyLimit"
  | "onDocumentChange"
  | "onHistoryChange"
  | "onSelectionChange"
  | "readOnly"
  | "selection"
>): LayerEditorController<TLayerData, TGroupData, TSourceData> {
  const resolvedSelection = normalizeLayerEditorSelection(
    document,
    selection ?? { layerIds: [], primaryLayerId: null },
  );
  const canUndo = history ? canUndoLayerEditorHistory(history) : false;
  const canRedo = history ? canRedoLayerEditorHistory(history) : false;

  const emitSelection = useCallback(
    (
      nextDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
      nextSelection: LayerEditorSelection,
    ) => {
      onSelectionChange?.(normalizeLayerEditorSelection(nextDocument, nextSelection));
    },
    [onSelectionChange],
  );

  const commitDocument = useCallback(
    (
      nextDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
      nextSelection = resolvedSelection,
    ) => {
      if (readOnly) {
        return;
      }

      if (history && onHistoryChange) {
        const nextHistory = commitLayerEditorHistory(history, nextDocument, {
          limit: historyLimit,
        });
        onHistoryChange(nextHistory);
        onDocumentChange?.(nextHistory.present);
        emitSelection(nextHistory.present, nextSelection);
        return;
      }

      onDocumentChange?.(nextDocument);
      emitSelection(nextDocument, nextSelection);
    },
    [
      emitSelection,
      history,
      historyLimit,
      onDocumentChange,
      onHistoryChange,
      readOnly,
      resolvedSelection,
    ],
  );

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

  const addGroup = useCallback(
    (group?: LayerEditorGroup<TGroupData>) => {
      if (readOnly) {
        return;
      }

      const existingIds = new Set(document.groups?.map((item) => item.id) ?? []);
      const nextGroup =
        group ??
        createGroup?.({ document, existingIds, selection: resolvedSelection }) ??
        ({
          id: createLayerEditorUniqueId("group", existingIds),
          label: "Group",
          layerIds: resolvedSelection.layerIds,
        } as LayerEditorGroup<TGroupData>);
      const nextDocument = groupLayerEditorLayers(document, nextGroup);

      commitDocument(nextDocument, {
        ...resolvedSelection,
        groupIds: [nextGroup.id],
      });
    },
    [commitDocument, createGroup, document, readOnly, resolvedSelection],
  );

  const groupSelectedLayers = useCallback(() => {
    if (resolvedSelection.layerIds.length === 0) {
      return;
    }

    addGroup();
  }, [addGroup, resolvedSelection.layerIds.length]);

  const removeGroup = useCallback(
    (groupId: string, options: { removeLayers?: boolean } = {}) => {
      if (readOnly) {
        return;
      }

      const group = document.groups?.find((item) => item.id === groupId);
      const nextDocument = removeLayerEditorGroup(document, groupId, options);
      const nextLayerIds = options.removeLayers
        ? resolvedSelection.layerIds.filter((layerId) => !group?.layerIds.includes(layerId))
        : resolvedSelection.layerIds;

      commitDocument(nextDocument, {
        layerIds: nextLayerIds,
        groupIds: resolvedSelection.groupIds?.filter((id) => id !== groupId),
        primaryLayerId: nextLayerIds.includes(resolvedSelection.primaryLayerId ?? "")
          ? resolvedSelection.primaryLayerId
          : (nextLayerIds[0] ?? null),
      });
    },
    [commitDocument, document, readOnly, resolvedSelection],
  );

  const ungroupGroup = useCallback(
    (groupId: string) => {
      if (readOnly) {
        return;
      }

      commitDocument(ungroupLayerEditorGroup(document, groupId), {
        ...resolvedSelection,
        groupIds: resolvedSelection.groupIds?.filter((id) => id !== groupId),
      });
    },
    [commitDocument, document, readOnly, resolvedSelection],
  );

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

  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(updateLayerEditorGroup(document, groupId, { collapsed: !group.collapsed }));
    },
    [commitDocument, document],
  );

  const toggleGroupVisibility = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(
        updateLayerEditorGroup(document, groupId, { visible: !(group.visible ?? true) }),
      );
    },
    [commitDocument, document],
  );

  const toggleGroupLocked = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(
        updateLayerEditorGroup(document, groupId, { locked: !(group.locked ?? false) }),
      );
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

  const renameGroup = useCallback(
    (groupId: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      commitDocument(updateLayerEditorGroup(document, groupId, { label: nextLabel }));
    },
    [commitDocument, document],
  );

  const undo = useCallback(() => {
    if (readOnly || !history || !onHistoryChange || !canUndo) {
      return;
    }

    const nextHistory = undoLayerEditorHistory(history);
    onHistoryChange(nextHistory);
    onDocumentChange?.(nextHistory.present);
    emitSelection(nextHistory.present, resolvedSelection);
  }, [
    canUndo,
    emitSelection,
    history,
    onDocumentChange,
    onHistoryChange,
    readOnly,
    resolvedSelection,
  ]);

  const redo = useCallback(() => {
    if (readOnly || !history || !onHistoryChange || !canRedo) {
      return;
    }

    const nextHistory = redoLayerEditorHistory(history);
    onHistoryChange(nextHistory);
    onDocumentChange?.(nextHistory.present);
    emitSelection(nextHistory.present, resolvedSelection);
  }, [
    canRedo,
    emitSelection,
    history,
    onDocumentChange,
    onHistoryChange,
    readOnly,
    resolvedSelection,
  ]);

  const groupSelectedLayersCallback = groupSelectedLayers;

  const removeSelectedLayersCallback = removeSelectedLayers;

  const duplicateSelectedLayersCallback = duplicateSelectedLayers;

  const addGroupCallback = addGroup;

  const addLayerCallback = addLayer;

  const removeGroupCallback = removeGroup;

  const ungroupGroupCallback = ungroupGroup;

  const selectLayersCallback = selectLayers;

  const clearSelectionCallback = clearSelection;

  const duplicateLayersCallback = duplicateLayers;

  const removeLayersCallback = removeLayers;

  const toggleGroupLockedCallback = toggleGroupLocked;

  const toggleGroupVisibilityCallback = toggleGroupVisibility;

  const renameGroupCallback = renameGroup;

  const undoCallback = undo;

  const redoCallback = redo;

  const commitDocumentCallback = commitDocument;

  const moveLayerCallback = moveLayer;

  const moveLayerRelativeToCallback = moveLayerRelativeTo;

  const renameLayerCallback = renameLayer;

  const selectLayerCallback = selectLayer;

  const toggleGroupCollapsedCallback = toggleGroupCollapsed;

  const toggleLayerLockedCallback = toggleLayerLocked;

  const toggleLayerVisibilityCallback = toggleLayerVisibility;

  return {
    addGroup: addGroupCallback,
    addLayer: addLayerCallback,
    canRedo,
    canUndo,
    clearSelection: clearSelectionCallback,
    commitDocument: commitDocumentCallback,
    document,
    duplicateLayers: duplicateLayersCallback,
    duplicateSelectedLayers: duplicateSelectedLayersCallback,
    groupSelectedLayers: groupSelectedLayersCallback,
    moveLayer: moveLayerCallback,
    moveLayerRelativeTo: moveLayerRelativeToCallback,
    readOnly,
    redo: redoCallback,
    removeGroup: removeGroupCallback,
    removeLayers: removeLayersCallback,
    removeSelectedLayers: removeSelectedLayersCallback,
    renameGroup: renameGroupCallback,
    renameLayer: renameLayerCallback,
    selection: resolvedSelection,
    selectLayer: selectLayerCallback,
    selectLayers: selectLayersCallback,
    toggleGroupCollapsed: toggleGroupCollapsedCallback,
    toggleGroupLocked: toggleGroupLockedCallback,
    toggleGroupVisibility: toggleGroupVisibilityCallback,
    toggleLayerLocked: toggleLayerLockedCallback,
    toggleLayerVisibility: toggleLayerVisibilityCallback,
    undo: undoCallback,
    ungroupGroup: ungroupGroupCallback,
  };
}

function nearestSurvivingLayerSelection<
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

export function LayerEditorPanel<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  className,
  createGroup,
  createLayer,
  document,
  features,
  history,
  historyLimit,
  onDocumentChange,
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
  const groups = document.groups ?? [];
  const groupedLayerIds = new Set(groups.flatMap((group) => group.layerIds));
  const ungroupedLayers = document.layers.filter((layer) => !groupedLayerIds.has(layer.id));
  const treeItems = useMemo(
    () => getVisibleTreeItems(document, groupedLayerIds),
    [document, groupedLayerIds],
  );
  const firstTreeItemKey = treeItems[0]?.key ?? null;
  const [focusedTreeItemKey, setFocusedTreeItemKey] = useState<string | null>(() =>
    selection?.primaryLayerId ? layerTreeItemKey(selection.primaryLayerId) : firstTreeItemKey,
  );
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [openLayerMenuLayerId, setOpenLayerMenuLayerId] = useState<string | null>(null);
  const [openGroupMenuGroupId, setOpenGroupMenuGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedTreeItemKey || !treeItems.some((item) => item.key === focusedTreeItemKey)) {
      setFocusedTreeItemKey(firstTreeItemKey);
    }
  }, [firstTreeItemKey, focusedTreeItemKey, treeItems]);

  const handleTreeItemKeyDown = useCallback(
    ({ event, group, kind, layer }: LayerEditorTreeItemKeyboardContext) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        focusRelativeTreeItem(event.currentTarget, offset, setFocusedTreeItemKey);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        focusEdgeTreeItem(
          event.currentTarget,
          event.key === "Home" ? "first" : "last",
          setFocusedTreeItemKey,
        );
        return;
      }

      if (kind === "group" && group) {
        if ((event.key === "Enter" || event.key === " ") && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }

        if (event.key === "ArrowRight" && group.collapsed && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }

        if (event.key === "ArrowLeft" && !group.collapsed && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }
        return;
      }

      if (kind !== "layer" || !layer) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        controller.selectLayer(layer.id, event.shiftKey || event.ctrlKey || event.metaKey);
      }
    },
    [controller, readOnly],
  );

  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!resolvedFeatures.keyboardCommands || isEditableKeyboardTarget(event.target)) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      if ((event.key === "Delete" || event.key === "Backspace") && !readOnly) {
        event.preventDefault();
        controller.removeSelectedLayers();
        return;
      }

      if (modifier && event.key.toLowerCase() === "d" && !readOnly) {
        event.preventDefault();
        controller.duplicateSelectedLayers();
        return;
      }

      if (modifier && event.key.toLowerCase() === "g" && !readOnly) {
        event.preventDefault();
        controller.groupSelectedLayers();
        return;
      }

      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          controller.redo();
        } else {
          controller.undo();
        }
      }
    },
    [controller, readOnly, resolvedFeatures.keyboardCommands],
  );

  return (
    <TooltipProvider>
      <div className={joinClassNames("mb-layer-editor", className)} onKeyDown={handlePanelKeyDown}>
        {resolvedFeatures.toolbar ? (
          <LayerEditorToolbar controller={controller} features={resolvedFeatures} />
        ) : null}
        <div aria-multiselectable="true" role="tree">
          {groups.length === 0 && ungroupedLayers.length === 0 ? (
            <p className="mb-layer-editor__empty">No layers.</p>
          ) : null}
          {groups.map((group) => (
            <LayerEditorGroupRow
              key={group.id}
              controller={controller}
              document={document}
              draggedLayerId={draggedLayerId}
              features={resolvedFeatures}
              firstTreeItemKey={firstTreeItemKey}
              focusedTreeItemKey={focusedTreeItemKey}
              group={group}
              onDragLayerChange={setDraggedLayerId}
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
            />
          ))}
          {ungroupedLayers.map((layer) => (
            <LayerEditorLayerRow
              key={layer.id}
              controller={controller}
              document={document}
              draggedLayerId={draggedLayerId}
              features={resolvedFeatures}
              firstTreeItemKey={firstTreeItemKey}
              focusedTreeItemKey={focusedTreeItemKey}
              layer={layer}
              onDragLayerChange={setDraggedLayerId}
              onOpenLayerMenuChange={setOpenLayerMenuLayerId}
              onTreeItemFocus={setFocusedTreeItemKey}
              onTreeItemKeyDown={handleTreeItemKeyDown}
              openLayerMenuLayerId={openLayerMenuLayerId}
              readOnly={readOnly}
              renderLayerActions={renderLayerActions}
              renderLayerLabel={renderLayerLabel}
              renderLayerMeta={renderLayerMeta}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

export type LayerEditorGroupRowProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  draggedLayerId: string | null;
  features: Required<LayerEditorPanelFeatures>;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  group: LayerEditorGroup<TGroupData>;
  onDragLayerChange: (layerId: string | null) => void;
  onOpenGroupMenuChange: (groupId: string | null) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openGroupMenuGroupId: string | null;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorGroupRow<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  controller,
  document,
  draggedLayerId,
  features,
  firstTreeItemKey,
  focusedTreeItemKey,
  group,
  onDragLayerChange,
  onOpenGroupMenuChange,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openGroupMenuGroupId,
  openLayerMenuLayerId,
  readOnly = false,
  renderGroupActions,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorGroupRowProps<TLayerData, TGroupData, TSourceData>) {
  const layers = group.layerIds
    .map((layerId) => document.layers.find((layer) => layer.id === layerId))
    .filter((layer): layer is LayerEditorLayer<TLayerData> => Boolean(layer));
  const rowRef = useRef<HTMLDivElement>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const itemKey = groupTreeItemKey(group.id);
  const collapsed = group.collapsed ?? false;
  const visible = group.visible ?? true;
  const locked = group.locked ?? false;
  const groupMenuOpen = openGroupMenuGroupId === group.id;

  const beginRename = () => {
    if (!readOnly) {
      setEditingLabel(group.label);
    }
  };

  const commitLabelEdit = () => {
    if (editingLabel !== null && editingLabel.trim() !== group.label) {
      controller.renameGroup(group.id, editingLabel);
    }
    setEditingLabel(null);
  };

  const cancelLabelEdit = () => {
    setEditingLabel(null);
    queueMicrotask(() => rowRef.current?.focus());
  };

  return (
    <Collapsible className="mb-layer-editor__group" open={!collapsed}>
      <div
        ref={rowRef}
        aria-expanded={!collapsed}
        className="mb-layer-editor__group-header"
        data-layer-editor-tree-item-key={itemKey}
        role="treeitem"
        tabIndex={treeItemTabIndex(itemKey, focusedTreeItemKey, firstTreeItemKey)}
        onFocus={() => onTreeItemFocus(itemKey)}
        onKeyDown={(event) => {
          if (event.key === "F2" && event.target === event.currentTarget && !readOnly) {
            event.preventDefault();
            beginRename();
            return;
          }

          onTreeItemKeyDown({ event, group, itemKey, kind: "group" });
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <Button
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.label}`}
                className="mb-layer-editor__icon-button"
                disabled={readOnly}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  controller.toggleGroupCollapsed(group.id);
                }}
              >
                {collapsed ? (
                  <ChevronUp aria-hidden="true" size={16} />
                ) : (
                  <ChevronDown aria-hidden="true" size={16} />
                )}
              </Button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent>{collapsed ? "Expand group" : "Collapse group"}</TooltipContent>
        </Tooltip>
        {editingLabel === null ? (
          <span className="mb-layer-editor__group-label" onDoubleClick={beginRename}>
            <Layers aria-hidden="true" size={16} /> {group.label}
          </span>
        ) : (
          <Input
            aria-label={`Rename group ${group.label}`}
            autoFocus={true}
            className="mb-layer-editor__layer-label-input"
            type="text"
            value={editingLabel}
            onBlur={commitLabelEdit}
            onChange={(event) => setEditingLabel(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                commitLabelEdit();
                queueMicrotask(() => rowRef.current?.focus());
              }

              if (event.key === "Escape") {
                cancelLabelEdit();
              }
            }}
          />
        )}
        {features.groupMenus ? (
          <div className="mb-layer-editor__group-actions">
            <DropdownMenu
              open={groupMenuOpen}
              onOpenChange={(open) => onOpenGroupMenuChange(open ? group.id : null)}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label={`Group menu ${group.label}`}
                      className="mb-layer-editor__icon-button"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenGroupMenuChange(groupMenuOpen ? null : group.id);
                      }}
                    >
                      <MoreHorizontal aria-hidden="true" size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Group actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent
                align="end"
                aria-label={`${group.label} options`}
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuItem disabled={readOnly} onSelect={beginRename}>
                  <Pencil aria-hidden="true" size={16} />
                  Rename group
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={readOnly}
                  onSelect={() => controller.ungroupGroup(group.id)}
                >
                  <FolderMinus aria-hidden="true" size={16} />
                  Ungroup
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={readOnly}
                  onSelect={() => controller.toggleGroupVisibility(group.id)}
                >
                  {visible ? (
                    <EyeOff aria-hidden="true" size={16} />
                  ) : (
                    <Eye aria-hidden="true" size={16} />
                  )}
                  {visible ? "Hide group" : "Show group"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={readOnly}
                  onSelect={() => controller.toggleGroupLocked(group.id)}
                >
                  {locked ? (
                    <Unlock aria-hidden="true" size={16} />
                  ) : (
                    <Lock aria-hidden="true" size={16} />
                  )}
                  {locked ? "Unlock group" : "Lock group"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="mb-layer-editor__menu-danger"
                  disabled={readOnly}
                  onSelect={() => controller.removeGroup(group.id)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Delete group only
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="mb-layer-editor__menu-danger"
                  disabled={readOnly}
                  onSelect={() => controller.removeGroup(group.id, { removeLayers: true })}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Delete group and layers
                </DropdownMenuItem>
                {renderGroupActions?.({
                  controller,
                  document,
                  group,
                  selection: controller.selection,
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
      <CollapsibleContent
        aria-label={group.label}
        className="mb-layer-editor__group-layers"
        role="group"
      >
        {collapsed
          ? null
          : layers.map((layer) => (
              <LayerEditorLayerRow
                key={layer.id}
                controller={controller}
                document={document}
                draggedLayerId={draggedLayerId}
                features={features}
                firstTreeItemKey={firstTreeItemKey}
                focusedTreeItemKey={focusedTreeItemKey}
                layer={layer}
                onDragLayerChange={onDragLayerChange}
                onOpenLayerMenuChange={onOpenLayerMenuChange}
                onTreeItemFocus={onTreeItemFocus}
                onTreeItemKeyDown={onTreeItemKeyDown}
                openLayerMenuLayerId={openLayerMenuLayerId}
                readOnly={readOnly}
                renderLayerActions={renderLayerActions}
                renderLayerLabel={renderLayerLabel}
                renderLayerMeta={renderLayerMeta}
              />
            ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export type LayerEditorLayerRowProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  draggedLayerId: string | null;
  features: Required<LayerEditorPanelFeatures>;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  layer: LayerEditorLayer<TLayerData>;
  onDragLayerChange: (layerId: string | null) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorLayerRow<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  controller,
  document,
  draggedLayerId,
  features,
  firstTreeItemKey,
  focusedTreeItemKey,
  layer,
  onDragLayerChange,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openLayerMenuLayerId,
  readOnly = false,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorLayerRowProps<TLayerData, TGroupData, TSourceData>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<LayerEditorLayerDropPosition | null>(null);
  const itemKey = layerTreeItemKey(layer.id);
  const selected = controller.selection.layerIds.includes(layer.id);
  const layerIndex = document.layers.findIndex((item) => item.id === layer.id);
  const visible = layer.visible ?? true;
  const locked = layer.locked ?? false;
  const layerMenuOpen = openLayerMenuLayerId === layer.id;

  const beginRename = () => {
    if (!readOnly) {
      setEditingLabel(layer.label);
    }
  };

  const handleSelect = (event: MouseEvent<HTMLDivElement>) => {
    controller.selectLayer(layer.id, event.shiftKey || event.ctrlKey || event.metaKey);
  };

  const commitLabelEdit = () => {
    if (editingLabel !== null && editingLabel.trim() !== layer.label) {
      controller.renameLayer(layer.id, editingLabel);
    }
    setEditingLabel(null);
  };

  const cancelLabelEdit = () => {
    setEditingLabel(null);
    queueMicrotask(() => rowRef.current?.focus());
  };

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      commitLabelEdit();
      queueMicrotask(() => rowRef.current?.focus());
    }

    if (event.key === "Escape") {
      cancelLabelEdit();
    }
  };

  const resolveDropPosition = (event: DragEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY <= bounds.top + bounds.height / 2 ? "before" : "after";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly || !draggedLayerId || draggedLayerId === layer.id) {
      return;
    }

    event.preventDefault();
    setDropPosition(resolveDropPosition(event));
  };

  return (
    <div
      ref={rowRef}
      aria-selected={selected}
      className={joinClassNames(
        "mb-layer-editor__layer",
        selected && "mb-layer-editor__layer--selected",
        draggedLayerId === layer.id && "mb-layer-editor__layer--dragging",
        dropPosition === "before" && "mb-layer-editor__layer--drop-before",
        dropPosition === "after" && "mb-layer-editor__layer--drop-after",
      )}
      data-layer-editor-tree-item-key={itemKey}
      draggable={!readOnly}
      role="treeitem"
      tabIndex={treeItemTabIndex(itemKey, focusedTreeItemKey, firstTreeItemKey)}
      onClick={handleSelect}
      onDragEnd={() => {
        onDragLayerChange(null);
        setDropPosition(null);
      }}
      onDragLeave={() => setDropPosition(null)}
      onDragOver={handleDragOver}
      onDragStart={(event) => {
        if (readOnly) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", layer.id);
        onDragLayerChange(layer.id);
      }}
      onDrop={(event) => {
        if (readOnly || !dropPosition) {
          return;
        }

        event.preventDefault();
        const sourceLayerId = event.dataTransfer.getData("text/plain") || draggedLayerId;
        if (sourceLayerId) {
          controller.moveLayerRelativeTo(sourceLayerId, layer.id, dropPosition);
        }
        onDragLayerChange(null);
        setDropPosition(null);
      }}
      onDoubleClick={beginRename}
      onFocus={() => onTreeItemFocus(itemKey)}
      onKeyDown={(event) => {
        if (event.key === "F2" && event.target === event.currentTarget && !readOnly) {
          event.preventDefault();
          beginRename();
          return;
        }

        onTreeItemKeyDown({ event, itemKey, kind: "layer", layer });
      }}
    >
      <IconButton
        disabled={readOnly}
        label={`${visible ? "Hide" : "Show"} ${layer.label}`}
        tooltip={visible ? "Hide layer" : "Show layer"}
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerVisibility(layer.id);
        }}
      >
        {visible ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}
      </IconButton>
      <IconButton
        disabled={readOnly}
        label={`${locked ? "Unlock" : "Lock"} ${layer.label}`}
        tooltip={locked ? "Unlock layer" : "Lock layer"}
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerLocked(layer.id);
        }}
      >
        {locked ? <Lock aria-hidden="true" size={16} /> : <Unlock aria-hidden="true" size={16} />}
      </IconButton>
      <div className="mb-layer-editor__layer-main">
        {editingLabel === null ? (
          <span
            className="mb-layer-editor__layer-label"
            onDoubleClick={(event) => {
              event.stopPropagation();
              beginRename();
            }}
          >
            {renderLayerLabel ? renderLayerLabel(layer) : layer.label}
          </span>
        ) : (
          <Input
            aria-label={`Rename ${layer.label}`}
            autoFocus={true}
            className="mb-layer-editor__layer-label-input"
            type="text"
            value={editingLabel}
            onBlur={commitLabelEdit}
            onChange={(event) => setEditingLabel(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleLabelKeyDown}
          />
        )}
        <span className="mb-layer-editor__layer-meta">
          {renderLayerMeta ? renderLayerMeta(layer) : `${Math.round((layer.opacity ?? 1) * 100)}%`}
        </span>
      </div>
      <div className="mb-layer-editor__layer-options">
        {features.layerMenus ? (
          <DropdownMenu
            open={layerMenuOpen}
            onOpenChange={(open) => onOpenLayerMenuChange(open ? layer.id : null)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={`Layer menu ${layer.label}`}
                    className="mb-layer-editor__icon-button"
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenLayerMenuChange(layerMenuOpen ? null : layer.id);
                    }}
                  >
                    <MoreHorizontal aria-hidden="true" size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Layer actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              aria-label={`${layer.label} options`}
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenuItem disabled={readOnly} onSelect={beginRename}>
                <Pencil aria-hidden="true" size={16} />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={readOnly}
                onSelect={() => controller.duplicateLayers([layer.id])}
              >
                <Copy aria-hidden="true" size={16} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="mb-layer-editor__menu-danger"
                disabled={readOnly}
                onSelect={() => controller.removeLayers([layer.id])}
              >
                <Trash2 aria-hidden="true" size={16} />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={readOnly}
                onSelect={() => {
                  controller.toggleLayerVisibility(layer.id);
                  onOpenLayerMenuChange(null);
                }}
              >
                {visible ? (
                  <EyeOff aria-hidden="true" size={16} />
                ) : (
                  <Eye aria-hidden="true" size={16} />
                )}
                {visible ? "Hide" : "Show"}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={readOnly}
                onSelect={() => {
                  controller.toggleLayerLocked(layer.id);
                  onOpenLayerMenuChange(null);
                }}
              >
                {locked ? (
                  <Unlock aria-hidden="true" size={16} />
                ) : (
                  <Lock aria-hidden="true" size={16} />
                )}
                {locked ? "Unlock" : "Lock"}
              </DropdownMenuItem>
              {renderLayerActions?.({
                controller,
                document,
                layer,
                selection: controller.selection,
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <IconButton
        disabled={readOnly || layerIndex <= 0}
        label={`Move ${layer.label} up`}
        tooltip="Move layer up"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "up");
        }}
      >
        <ChevronUp aria-hidden="true" size={16} />
      </IconButton>
      <IconButton
        disabled={readOnly || layerIndex < 0 || layerIndex >= document.layers.length - 1}
        label={`Move ${layer.label} down`}
        tooltip="Move layer down"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "down");
        }}
      >
        <ChevronDown aria-hidden="true" size={16} />
      </IconButton>
    </div>
  );
}

function LayerEditorToolbar<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  controller,
  features,
}: {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  features: Required<LayerEditorPanelFeatures>;
}) {
  const hasSelectedLayers = controller.selection.layerIds.length > 0;
  const showHistoryControls = features.historyControls;

  return (
    <div className="mb-layer-editor__toolbar" role="toolbar">
      <div className="mb-layer-editor__toolbar-group">
        <IconButton
          disabled={controller.readOnly}
          label="Add layer"
          tooltip="Add layer"
          onClick={(event) => {
            event.stopPropagation();
            controller.addLayer();
          }}
        >
          <Plus aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Duplicate selected layers"
          tooltip="Duplicate selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.duplicateSelectedLayers();
          }}
        >
          <Copy aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Delete selected layers"
          tooltip="Delete selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.removeSelectedLayers();
          }}
        >
          <Trash2 aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Group selected layers"
          tooltip="Group selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.groupSelectedLayers();
          }}
        >
          <FolderPlus aria-hidden="true" size={16} />
        </IconButton>
      </div>
      {showHistoryControls ? (
        <div className="mb-layer-editor__toolbar-group">
          <IconButton
            disabled={controller.readOnly || !controller.canUndo}
            label="Undo"
            tooltip="Undo"
            onClick={(event) => {
              event.stopPropagation();
              controller.undo();
            }}
          >
            <Undo2 aria-hidden="true" size={16} />
          </IconButton>
          <IconButton
            disabled={controller.readOnly || !controller.canRedo}
            label="Redo"
            tooltip="Redo"
            onClick={(event) => {
              event.stopPropagation();
              controller.redo();
            }}
          >
            <Redo2 aria-hidden="true" size={16} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
  tooltip,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="mb-layer-editor__icon-button"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function resolveLayerEditorPanelFeatures(
  features: LayerEditorPanelFeatures | undefined,
  hasHistoryHandlers: boolean,
): Required<LayerEditorPanelFeatures> {
  return {
    groupMenus: features?.groupMenus ?? true,
    historyControls: (features?.historyControls ?? false) && hasHistoryHandlers,
    keyboardCommands: features?.keyboardCommands ?? true,
    layerMenus: features?.layerMenus ?? true,
    toolbar: features?.toolbar ?? true,
  };
}

function isEditableKeyboardTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'),
  );
}

function getVisibleTreeItems(
  document: LayerEditorDocument<unknown, unknown, unknown>,
  groupedLayerIds: ReadonlySet<string>,
): LayerEditorTreeItem[] {
  const items: LayerEditorTreeItem[] = [];

  for (const group of document.groups ?? []) {
    items.push({ id: group.id, kind: "group", key: groupTreeItemKey(group.id) });

    if (!group.collapsed) {
      for (const layerId of group.layerIds) {
        if (document.layers.some((layer) => layer.id === layerId)) {
          items.push({ id: layerId, kind: "layer", key: layerTreeItemKey(layerId) });
        }
      }
    }
  }

  for (const layer of document.layers) {
    if (!groupedLayerIds.has(layer.id)) {
      items.push({ id: layer.id, kind: "layer", key: layerTreeItemKey(layer.id) });
    }
  }

  return items;
}

function focusRelativeTreeItem(
  currentItem: HTMLElement,
  offset: number,
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  const index = items.indexOf(currentItem);
  const target = items[Math.min(items.length - 1, Math.max(0, index + offset))];
  focusTreeItem(target, onTreeItemFocus);
}

function focusEdgeTreeItem(
  currentItem: HTMLElement,
  edge: "first" | "last",
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  focusTreeItem(edge === "first" ? items[0] : items.at(-1), onTreeItemFocus);
}

function focusTreeItem(item: HTMLElement | undefined, onTreeItemFocus: (itemKey: string) => void) {
  if (!item) {
    return;
  }

  const itemKey = item.dataset.layerEditorTreeItemKey;
  if (itemKey) {
    onTreeItemFocus(itemKey);
  }
  item.focus();
}

function getTreeItemElements(currentItem: HTMLElement) {
  const tree = currentItem.closest('[role="tree"]');
  if (!tree) {
    return [currentItem];
  }

  return Array.from(tree.querySelectorAll<HTMLElement>("[data-layer-editor-tree-item-key]"));
}

function treeItemTabIndex(
  itemKey: string,
  focusedTreeItemKey: string | null,
  firstTreeItemKey: string | null,
) {
  return itemKey === (focusedTreeItemKey ?? firstTreeItemKey) ? 0 : -1;
}

function groupTreeItemKey(groupId: string) {
  return `group:${groupId}`;
}

function layerTreeItemKey(layerId: string) {
  return `layer:${layerId}`;
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
