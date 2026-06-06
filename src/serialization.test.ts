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

  test("throws parse errors for unsupported wrapped schema versions", () => {
    expect(() =>
      parseLayerEditorDocument({
        document,
        format: layerEditorDocumentFormat,
        schemaVersion: 99,
      }),
    ).toThrow(LayerEditorParseError);

    try {
      parseLayerEditorDocument({
        document,
        format: layerEditorDocumentFormat,
        schemaVersion: 99,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LayerEditorParseError);
      expect((error as LayerEditorParseError).issues[0]?.code).toBe("unsupported-schema-version");
    }
  });

  test("throws parse errors for invalid wrapped schema versions", () => {
    try {
      parseLayerEditorDocument({
        document,
        format: layerEditorDocumentFormat,
        schemaVersion: Number.NaN,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(LayerEditorParseError);
      expect((error as LayerEditorParseError).issues[0]?.code).toBe("invalid-schema-version");
    }
  });

  test("supports explicit migrations for older wrapped schema versions", () => {
    const migrated = parseLayerEditorDocument(
      {
        document: {
          items: [{ id: "legacy", kind: "shape", label: "Legacy" }],
        },
        format: layerEditorDocumentFormat,
        schemaVersion: 0,
      },
      {
        migrations: {
          0: (legacyDocument) => ({
            layers: Array.isArray((legacyDocument as { items?: unknown }).items)
              ? (legacyDocument as { items: unknown[] }).items
              : [],
          }),
        },
      },
    );

    expect(migrated.layers[0]?.id).toBe("legacy");
  });

  test("round-trips domain data, style, groups, and sources", () => {
    const richDocument: LayerEditorDocument = {
      groups: [{ id: "group", label: "Group", layerIds: ["layer"], data: { domain: true } }],
      layers: [
        {
          data: { featureId: 42 },
          id: "layer",
          kind: "shape",
          label: "Layer",
          parentGroupId: "group",
          sourceId: "source",
          style: { fill: "#ffffff" },
        },
      ],
      sources: [{ id: "source", kind: "geojson", data: { url: "/data.json" } }],
    };

    const parsed = parseLayerEditorDocument(serializeLayerEditorDocument(richDocument));

    expect(parsed.layers[0]?.data).toEqual({ featureId: 42 });
    expect(parsed.layers[0]?.style).toEqual({ fill: "#ffffff" });
    expect(parsed.groups?.[0]?.data).toEqual({ domain: true });
    expect(parsed.sources?.[0]?.data).toEqual({ url: "/data.json" });
  });
});
