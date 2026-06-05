import {
  LayerEditorParseError,
  layerEditorDocumentFormat,
  parseLayerEditorDocument,
  readLayerEditorDocument,
  serializeLayerEditorDocument,
} from "./serialization";
import type { LayerEditorDocument } from "./core";

const document: LayerEditorDocument = {
  layers: [{ id: "layer", kind: "shape", label: "Layer" }],
};

describe("@moritzbrantner/layer-editor serialization", () => {
  test("serializes and parses wrapped documents", () => {
    const serialized = serializeLayerEditorDocument(document);
    expect(serialized.format).toBe(layerEditorDocumentFormat);
    expect(parseLayerEditorDocument(serialized)).toEqual({
      layers: [
        {
          blendMode: "normal",
          id: "layer",
          kind: "shape",
          label: "Layer",
          locked: false,
          opacity: 1,
          visible: true,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  });

  test("reads raw documents", () => {
    expect(readLayerEditorDocument(document).layers[0]?.id).toBe("layer");
  });

  test("throws parse errors for invalid inputs", () => {
    expect(() => parseLayerEditorDocument({ layers: [{ id: 1 }] })).toThrow(LayerEditorParseError);
  });
});
