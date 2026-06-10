import { normalizeLayerEditorDocument } from "./document-normalization";
import type { LayerEditorDocument } from "./types";

export function createLayerEditorUniqueId(baseId: string, existingIds: ReadonlySet<string>) {
  const normalizedBaseId = baseId.trim() || "item";
  if (!existingIds.has(normalizedBaseId)) {
    return normalizedBaseId;
  }

  let index = 2;
  let id = `${normalizedBaseId}-${index}`;
  while (existingIds.has(id)) {
    index += 1;
    id = `${normalizedBaseId}-${index}`;
  }

  return id;
}

export function normalizeChangedLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  currentDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  nextDocument: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
) {
  const normalizedNextDocument = normalizeLayerEditorDocument(nextDocument, { mode: "repair" });
  return layerEditorDocumentsEqual(currentDocument, normalizedNextDocument)
    ? currentDocument
    : normalizedNextDocument;
}

function layerEditorDocumentsEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function clampInsertIndex(index: number | undefined, length: number) {
  if (typeof index !== "number" || !Number.isFinite(index)) {
    return length;
  }

  return Math.min(length, Math.max(0, Math.trunc(index)));
}
