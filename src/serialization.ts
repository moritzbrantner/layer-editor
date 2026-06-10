import {
  readEditorDocument,
  serializeEditorDocument,
  type EditorDocumentAdapter,
} from "@moritzbrantner/editor-core";

import { isRecord } from "./document-guards";
import { normalizeLayerEditorDocument } from "./document-normalization";
import { layerEditorDocumentAdapter } from "./serialization-adapter";
import { readLayerEditorDocumentInput } from "./serialization-document-reader";
import { normalizeLayerEditorParseError, throwParseError } from "./serialization-errors";
import {
  assertValidSerializedLayerEditorEnvelope,
  createEditorCoreMigrations,
  resolveSerializedDocument,
} from "./serialization-migrations";
import {
  currentLayerEditorSchemaVersion,
  layerEditorDocumentFormat,
  type LayerEditorParseOptions,
  type SerializedLayerEditorDocument,
} from "./serialization-types";
import type { LayerEditorDocument } from "./types";

export {
  currentLayerEditorSchemaVersion,
  LayerEditorParseError,
  layerEditorDocumentFormat,
  type LayerEditorDocumentMigration,
  type LayerEditorParseIssue,
  type LayerEditorParseIssueCode,
  type LayerEditorParseOptions,
  type SerializedLayerEditorDocument,
} from "./serialization-types";
export { layerEditorDocumentAdapter } from "./serialization-adapter";

export function serializeLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): SerializedLayerEditorDocument<TLayerData, TGroupData, TSourceData> {
  return serializeEditorDocument(
    document,
    layerEditorDocumentAdapter as EditorDocumentAdapter<
      LayerEditorDocument<TLayerData, TGroupData, TSourceData>
    > & {
      format: typeof layerEditorDocumentFormat;
      schemaVersion: typeof currentLayerEditorSchemaVersion;
    },
    { exportedAt: false },
  );
}

export function parseLayerEditorDocument(
  input: unknown,
  options: LayerEditorParseOptions = {},
): LayerEditorDocument {
  if (!isRecord(input)) {
    throwParseError("invalid-input", "", "Expected an object.");
  }

  assertValidSerializedLayerEditorEnvelope(input, "", options);

  try {
    return readEditorDocument(input, layerEditorDocumentAdapter, {
      migrations: createEditorCoreMigrations(options),
    });
  } catch (error) {
    throw normalizeLayerEditorParseError(error);
  }
}

export function readLayerEditorDocument(
  input: unknown,
  path = "",
  options: LayerEditorParseOptions = {},
): LayerEditorDocument {
  if (!isRecord(input)) {
    throwParseError("invalid-input", path, "Expected an object.");
  }

  const maybeSerialized = resolveSerializedDocument(input, path, options);

  return normalizeLayerEditorDocument(readLayerEditorDocumentInput(maybeSerialized, path));
}
