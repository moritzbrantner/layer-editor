import type { EditorDocumentAdapter } from "@moritzbrantner/editor-core";

import { normalizeLayerEditorDocument } from "./document-normalization";
import { readValidatedLayerEditorDocument } from "./serialization-document-reader";
import { currentLayerEditorSchemaVersion, layerEditorDocumentFormat } from "./serialization-types";
import type { LayerEditorDocument } from "./types";

export const layerEditorDocumentAdapter: EditorDocumentAdapter<LayerEditorDocument> & {
  format: typeof layerEditorDocumentFormat;
  schemaVersion: typeof currentLayerEditorSchemaVersion;
} = {
  format: layerEditorDocumentFormat,
  normalize: normalizeLayerEditorDocument,
  read: readValidatedLayerEditorDocument,
  schemaVersion: currentLayerEditorSchemaVersion,
};
