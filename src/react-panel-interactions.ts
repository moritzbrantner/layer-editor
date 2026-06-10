"use client";

import {
  useCallback,
  type Dispatch,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SetStateAction,
} from "react";

import {
  focusEdgeTreeItem,
  focusRelativeTreeItem,
  focusTreeItem,
  getLayerSelectionRange,
  getRelativeVisibleLayerId,
  getTreeItemElement,
  isEditableKeyboardTarget,
  mergeLayerSelections,
  resolveLayerSelectionAnchor,
} from "./react-keyboard";
import { layerTreeItemKey } from "./react-tree-keys";
import type {
  LayerEditorController,
  LayerEditorPanelFeatures,
  LayerEditorTreeItemKeyboardContext,
} from "./react-types";

type LayerEditorPanelInteractionOptions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  clearDragState: () => void;
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  draggedLayerId: string | null;
  readOnly: boolean;
  resolvedFeatures: Required<LayerEditorPanelFeatures>;
  selectionAnchorLayerId: string | null;
  setFocusedTreeItemKey: Dispatch<SetStateAction<string | null>>;
  setSelectionAnchorLayerId: Dispatch<SetStateAction<string | null>>;
  visibleLayerIds: string[];
};

export function useLayerEditorPanelInteractions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  clearDragState,
  controller,
  draggedLayerId,
  readOnly,
  resolvedFeatures,
  selectionAnchorLayerId,
  setFocusedTreeItemKey,
  setSelectionAnchorLayerId,
  visibleLayerIds,
}: LayerEditorPanelInteractionOptions<TLayerData, TGroupData, TSourceData>) {
  const handleLayerSelect = useCallback(
    (layerId: string, event: MouseEvent<HTMLDivElement>) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (event.shiftKey) {
        const anchorLayerId = resolveLayerSelectionAnchor(
          selectionAnchorLayerId,
          controller.selection,
          visibleLayerIds,
          layerId,
        );
        const rangeLayerIds = getLayerSelectionRange(visibleLayerIds, anchorLayerId, layerId);
        const nextLayerIds = modifier
          ? mergeLayerSelections(controller.selection.layerIds, rangeLayerIds)
          : rangeLayerIds;

        setSelectionAnchorLayerId(anchorLayerId);
        controller.selectLayers(nextLayerIds, layerId);
        return;
      }

      if (modifier) {
        const selected = controller.selection.layerIds.includes(layerId);
        controller.selectLayer(layerId, true);
        if (!selected) {
          setSelectionAnchorLayerId(layerId);
        }
        return;
      }

      setSelectionAnchorLayerId(layerId);
      controller.selectLayer(layerId);
    },
    [controller, selectionAnchorLayerId, visibleLayerIds],
  );

  const handleGroupDrop = useCallback(
    (groupId: string | null, targetIndex: number | undefined, event: DragEvent<HTMLElement>) => {
      if (readOnly || !draggedLayerId) {
        return;
      }

      event.preventDefault();
      const sourceLayerId = event.dataTransfer.getData("text/plain") || draggedLayerId;
      if (sourceLayerId) {
        controller.moveLayerToGroup(sourceLayerId, groupId, targetIndex);
      }
      clearDragState();
    },
    [clearDragState, controller, draggedLayerId, readOnly],
  );

  const handleTreeItemKeyDown = useCallback(
    ({ event, group, kind, layer }: LayerEditorTreeItemKeyboardContext) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (kind === "layer" && layer && event.shiftKey) {
          const offset = event.key === "ArrowDown" ? 1 : -1;
          const targetLayerId = getRelativeVisibleLayerId(visibleLayerIds, layer.id, offset);
          if (!targetLayerId) {
            return;
          }

          const anchorLayerId = resolveLayerSelectionAnchor(
            selectionAnchorLayerId,
            controller.selection,
            visibleLayerIds,
            layer.id,
          );
          const rangeLayerIds = getLayerSelectionRange(
            visibleLayerIds,
            anchorLayerId,
            targetLayerId,
          );

          setSelectionAnchorLayerId(anchorLayerId);
          controller.selectLayers(rangeLayerIds, targetLayerId);
          focusTreeItem(
            getTreeItemElement(event.currentTarget, layerTreeItemKey(targetLayerId)) ?? undefined,
            setFocusedTreeItemKey,
          );
          return;
        }

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
        if (event.shiftKey) {
          const anchorLayerId = resolveLayerSelectionAnchor(
            selectionAnchorLayerId,
            controller.selection,
            visibleLayerIds,
            layer.id,
          );
          const rangeLayerIds = getLayerSelectionRange(visibleLayerIds, anchorLayerId, layer.id);
          const nextLayerIds =
            event.ctrlKey || event.metaKey
              ? mergeLayerSelections(controller.selection.layerIds, rangeLayerIds)
              : rangeLayerIds;
          setSelectionAnchorLayerId(anchorLayerId);
          controller.selectLayers(nextLayerIds, layer.id);
          return;
        }

        controller.selectLayer(layer.id, event.ctrlKey || event.metaKey);
        setSelectionAnchorLayerId(layer.id);
      }
    },
    [controller, readOnly, selectionAnchorLayerId, visibleLayerIds],
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

  return {
    handleGroupDrop,
    handleLayerSelect,
    handlePanelKeyDown,
    handleTreeItemKeyDown,
  };
}
