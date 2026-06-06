import {
  canRedoEditorHistory,
  canUndoEditorHistory,
  commitEditorSnapshotHistory,
  createEditorSnapshotHistory,
  createStableEditorJsonEquals,
  redoEditorSnapshotHistory,
  resetEditorSnapshotHistory,
  undoEditorSnapshotHistory,
  type EditorSnapshotHistory,
} from "@moritzbrantner/editor-core";

import { normalizeLayerEditorDocument, type LayerEditorDocument } from "./core";

export const defaultLayerEditorHistoryLimit = 100;

export type LayerEditorHistoryState<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = EditorSnapshotHistory<LayerEditorDocument<TLayerData, TGroupData, TSourceData>>;

export type LayerEditorHistoryOptions = {
  limit?: number;
};

export function createLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  return createEditorSnapshotHistory(document, {
    normalize: normalizeLayerEditorDocument,
  });
}

export function commitLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>,
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  options: LayerEditorHistoryOptions = {},
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  const nextDocument = normalizeLayerEditorDocument(document);
  const equals =
    createStableEditorJsonEquals<LayerEditorDocument<TLayerData, TGroupData, TSourceData>>();
  if (equals(history.present, nextDocument)) {
    return history;
  }

  return commitEditorSnapshotHistory(history, nextDocument, {
    equals,
    limit: normalizeLayerEditorHistoryLimit(options.limit),
  });
}

export function undoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  return undoEditorSnapshotHistory(history);
}

export function redoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  return redoEditorSnapshotHistory(history);
}

export function resetLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  return resetEditorSnapshotHistory(document, {
    normalize: normalizeLayerEditorDocument,
  });
}

export function canUndoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) {
  return canUndoEditorHistory(history);
}

export function canRedoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) {
  return canRedoEditorHistory(history);
}

function normalizeLayerEditorHistoryLimit(limit: number | undefined) {
  return Math.max(1, Math.trunc(limit ?? defaultLayerEditorHistoryLimit));
}
