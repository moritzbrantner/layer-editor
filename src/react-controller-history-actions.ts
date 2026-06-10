"use client";

import { useCallback } from "react";

import {
  redoLayerEditorHistory,
  undoLayerEditorHistory,
  type LayerEditorHistoryState,
} from "./history";
import type { LayerEditorDocument, LayerEditorSelection } from "./core";

type LayerEditorHistoryActionOptions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  canRedo: boolean;
  canUndo: boolean;
  emitSelection: (
    document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
    selection: LayerEditorSelection,
  ) => void;
  history?: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>;
  onDocumentChange?: (document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>) => void;
  onHistoryChange?: (history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) => void;
  readOnly: boolean;
  resolvedSelection: LayerEditorSelection;
};

export function useLayerEditorHistoryActions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  canRedo,
  canUndo,
  emitSelection,
  history,
  onDocumentChange,
  onHistoryChange,
  readOnly,
  resolvedSelection,
}: LayerEditorHistoryActionOptions<TLayerData, TGroupData, TSourceData>) {
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

  return { redo, undo };
}
