import { normalizeLayerEditorDocument, type LayerEditorDocument } from "./core";

export const defaultLayerEditorHistoryLimit = 100;

export type LayerEditorHistoryState<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  past: Array<LayerEditorDocument<TLayerData, TGroupData, TSourceData>>;
  present: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  future: Array<LayerEditorDocument<TLayerData, TGroupData, TSourceData>>;
};

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
  return {
    future: [],
    past: [],
    present: normalizeLayerEditorDocument(document),
  };
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
  if (documentsEqual(history.present, nextDocument)) {
    return history;
  }

  const limit = Math.max(1, Math.trunc(options.limit ?? defaultLayerEditorHistoryLimit));
  return {
    future: [],
    past: [...history.past, history.present].slice(-limit),
    present: nextDocument,
  };
}

export function undoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  const previous = history.past.at(-1);
  if (!previous) {
    return history;
  }

  return {
    future: [history.present, ...history.future],
    past: history.past.slice(0, -1),
    present: previous,
  };
}

export function redoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  const next = history.future[0];
  if (!next) {
    return history;
  }

  return {
    future: history.future.slice(1),
    past: [...history.past, history.present],
    present: next,
  };
}

export function resetLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): LayerEditorHistoryState<TLayerData, TGroupData, TSourceData> {
  return createLayerEditorHistory(document);
}

export function canUndoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) {
  return history.past.length > 0;
}

export function canRedoLayerEditorHistory<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) {
  return history.future.length > 0;
}

function documentsEqual<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  left: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  right: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
) {
  return stableLayerEditorDocumentFingerprint(left) === stableLayerEditorDocumentFingerprint(right);
}

function stableLayerEditorDocumentFingerprint(value: unknown): string {
  return JSON.stringify(sortLayerEditorDocumentValue(value));
}

function sortLayerEditorDocumentValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortLayerEditorDocumentValue);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortLayerEditorDocumentValue(value[key])]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
