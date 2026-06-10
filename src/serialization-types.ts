import type { SerializedEditorDocument } from "@moritzbrantner/editor-core";

import type { LayerEditorDocument } from "./types";

export const currentLayerEditorSchemaVersion = 2;
export const layerEditorDocumentFormat = "@moritzbrantner/layer-editor/document";

export type SerializedLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = SerializedEditorDocument<
  LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  typeof layerEditorDocumentFormat,
  typeof currentLayerEditorSchemaVersion
>;

export type LayerEditorParseIssueCode =
  | "invalid-input"
  | "invalid-document"
  | "invalid-format"
  | "invalid-schema-version"
  | "unsupported-schema-version";

export type LayerEditorParseIssue = {
  code: LayerEditorParseIssueCode;
  path: string;
  message: string;
};

export type LayerEditorDocumentMigration = (document: unknown) => unknown;

export type LayerEditorParseOptions = {
  migrations?: Partial<Record<number, LayerEditorDocumentMigration>>;
};

export class LayerEditorParseError extends Error {
  issues: LayerEditorParseIssue[];

  constructor(issues: LayerEditorParseIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "LayerEditorParseError";
    this.issues = issues;
  }
}
