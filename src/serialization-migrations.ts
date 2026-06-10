import {
  migrateEditorDocument,
  type EditorDocumentMigrations,
  type SerializedEditorDocument,
} from "@moritzbrantner/editor-core";

import { isRecord } from "./document-guards";
import { layerEditorDocumentAdapter } from "./serialization-adapter";
import { normalizeLayerEditorParseError, throwParseError } from "./serialization-errors";
import { withPath } from "./serialization-path";
import {
  currentLayerEditorSchemaVersion,
  layerEditorDocumentFormat,
  type LayerEditorParseOptions,
} from "./serialization-types";
import type { LayerEditorDocument } from "./types";

export function resolveSerializedDocument(
  input: Record<string, unknown>,
  path: string,
  options: LayerEditorParseOptions,
) {
  if (input.format !== layerEditorDocumentFormat) {
    return input;
  }

  assertValidSerializedLayerEditorEnvelope(input, path, options);

  try {
    const migrated = migrateEditorDocument(
      input,
      layerEditorDocumentAdapter,
      createEditorCoreMigrations(options),
    );

    if (isRecord(migrated) && migrated.format === layerEditorDocumentFormat) {
      return migrated.document;
    }

    return migrated;
  } catch (error) {
    throw normalizeLayerEditorParseError(error);
  }
}

export function assertValidSerializedLayerEditorEnvelope(
  input: unknown,
  path: string,
  options: LayerEditorParseOptions,
) {
  if (!isRecord(input) || input.format !== layerEditorDocumentFormat) {
    return;
  }

  if (!("schemaVersion" in input)) {
    throwParseError(
      "invalid-schema-version",
      withPath(path, "schemaVersion"),
      "Expected schema version.",
    );
  }

  if (typeof input.schemaVersion !== "number" || !Number.isFinite(input.schemaVersion)) {
    throwParseError(
      "invalid-schema-version",
      withPath(path, "schemaVersion"),
      "Expected finite schema version.",
    );
  }

  if (!isRecord(input.document)) {
    throwParseError("invalid-document", withPath(path, "document"), "Expected document object.");
  }

  if (input.schemaVersion === currentLayerEditorSchemaVersion) {
    return;
  }

  if (!isSupportedLayerEditorMigrationVersion(input.schemaVersion, options)) {
    throwParseError(
      "unsupported-schema-version",
      withPath(path, "schemaVersion"),
      `Unsupported schema version ${input.schemaVersion}.`,
    );
  }
}

export function createEditorCoreMigrations(
  options: LayerEditorParseOptions,
): EditorDocumentMigrations<LayerEditorDocument> {
  return {
    1: (input: SerializedEditorDocument<unknown>) => ({
      document: input.document,
      format: layerEditorDocumentFormat,
      schemaVersion: currentLayerEditorSchemaVersion,
    }),
    ...Object.fromEntries(
      Object.entries(options.migrations ?? {}).flatMap(([schemaVersion, migrate]) =>
        migrate
          ? [
              [
                schemaVersion,
                (input: SerializedEditorDocument<unknown>) => ({
                  document: migrate(input.document),
                  format: layerEditorDocumentFormat,
                  schemaVersion: currentLayerEditorSchemaVersion,
                }),
              ],
            ]
          : [],
      ),
    ),
  };
}

function isSupportedLayerEditorMigrationVersion(
  schemaVersion: number,
  options: LayerEditorParseOptions,
) {
  return schemaVersion === 1 || Boolean(options.migrations?.[schemaVersion]);
}
