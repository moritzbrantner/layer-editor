"use client";

import { useCallback } from "react";

import {
  normalizeLayerEditorSelection,
  type LayerEditorDocument,
  type LayerEditorSelection,
} from "./core";
import {
  canRedoLayerEditorHistory,
  canUndoLayerEditorHistory,
  commitLayerEditorHistory,
} from "./history";
import type { LayerEditorController, LayerEditorPanelProps } from "./react-types";
import { useLayerEditorGroupActions } from "./react-controller-group-actions";
import { useLayerEditorHistoryActions } from "./react-controller-history-actions";
import { useLayerEditorLayerActions } from "./react-controller-layer-actions";
import { useLayerEditorSelectionActions } from "./react-controller-selection";

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

  const selectionActions = useLayerEditorSelectionActions({
    document,
    emitSelection,
    resolvedSelection,
  });
  const layerActions = useLayerEditorLayerActions({
    commitDocument,
    createLayer,
    document,
    readOnly,
    resolvedSelection,
  });
  const groupActions = useLayerEditorGroupActions({
    commitDocument,
    createGroup,
    document,
    readOnly,
    resolvedSelection,
  });
  const historyActions = useLayerEditorHistoryActions({
    canRedo,
    canUndo,
    emitSelection,
    history,
    onDocumentChange,
    onHistoryChange,
    readOnly,
    resolvedSelection,
  });

  return {
    ...groupActions,
    ...historyActions,
    ...layerActions,
    ...selectionActions,
    canRedo,
    canUndo,
    commitDocument,
    document,
    readOnly,
    selection: resolvedSelection,
  };
}
