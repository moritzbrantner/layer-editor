import { EditorJsonParseError, EditorMigrationError } from "@moritzbrantner/editor-core";

import { LayerEditorParseError, type LayerEditorParseIssueCode } from "./serialization-types";

export function normalizeLayerEditorParseError(error: unknown): LayerEditorParseError {
  if (error instanceof LayerEditorParseError) {
    return error;
  }

  if (error instanceof EditorJsonParseError) {
    return new LayerEditorParseError(
      error.issues.map((issue) => ({
        code: "invalid-document",
        message: issue.message,
        path: issue.path,
      })),
    );
  }

  if (error instanceof EditorMigrationError) {
    return new LayerEditorParseError([
      {
        code: "unsupported-schema-version",
        message: error.message,
        path: "schemaVersion",
      },
    ]);
  }

  throw error;
}

export function throwParseError(
  code: LayerEditorParseIssueCode,
  path: string,
  message: string,
): never {
  throw new LayerEditorParseError([{ code, message, path }]);
}
