import type { LayerEditorDocumentDiagnostic } from "./types";

export class LayerEditorDocumentValidationError extends Error {
  diagnostics: LayerEditorDocumentDiagnostic[];

  constructor(diagnostics: LayerEditorDocumentDiagnostic[]) {
    super(diagnostics.map((diagnostic) => `${diagnostic.path}: ${diagnostic.message}`).join("; "));
    this.name = "LayerEditorDocumentValidationError";
    this.diagnostics = diagnostics;
  }
}
