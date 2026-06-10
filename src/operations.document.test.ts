import {
  createLayerEditorDocument,
  LayerEditorDocumentValidationError,
  normalizeLayerEditorDocument,
  validateLayerEditorDocument,
  type LayerEditorDocument,
} from "./core";

describe("@moritzbrantner/layer-editor document operations", () => {
  test("creates documents with default viewport", () => {
    expect(createLayerEditorDocument()).toEqual({
      layers: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  });

  test("normalizes layer defaults and clamps editable numeric state", () => {
    expect(
      normalizeLayerEditorDocument(
        {
          layers: [
            {
              bounds: { height: -10, rotation: Number.NaN, width: -1, x: Number.NaN, y: 2 },
              id: "layer",
              kind: "shape",
              label: "Layer",
              opacity: 2,
            },
          ],
          viewport: { x: Number.NaN, y: 5, zoom: -1 },
        },
        { mode: "repair" },
      ),
    ).toEqual({
      layers: [
        {
          blendMode: "normal",
          bounds: { height: 0, rotation: 0, width: 0, x: 0, y: 2 },
          id: "layer",
          kind: "shape",
          label: "Layer",
          locked: false,
          opacity: 1,
          visible: true,
        },
      ],
      viewport: { x: 0, y: 5, zoom: Number.EPSILON },
    });
  });

  test("normalizes group visual defaults and repairs group visual state", () => {
    const normalized = normalizeLayerEditorDocument(
      {
        groups: [
          {
            blendMode: "missing",
            id: "content",
            label: "Content",
            layerIds: ["layer"],
            opacity: 2,
          },
        ],
        layers: [{ id: "layer", kind: "shape", label: "Layer", parentGroupId: "content" }],
      } as LayerEditorDocument,
      { mode: "repair" },
    );

    expect(normalized.groups?.[0]).toEqual(
      expect.objectContaining({
        blendMode: "normal",
        locked: false,
        opacity: 1,
        visible: true,
      }),
    );

    const defaulted = createLayerEditorDocument({
      groups: [{ id: "content", label: "Content", layerIds: ["layer"] }],
      layers: [{ id: "layer", kind: "shape", label: "Layer" }],
    });
    expect(defaulted.groups?.[0]).toEqual(
      expect.objectContaining({
        blendMode: "normal",
        opacity: 1,
      }),
    );
  });

  test("reports duplicate ids and missing references", () => {
    expect(
      validateLayerEditorDocument({
        groups: [{ id: "group", label: "Group", layerIds: ["missing", "a", "a"] }],
        layers: [
          { id: "a", kind: "shape", label: "A", parentGroupId: "missing-group", sourceId: "s" },
          { id: "a", kind: "shape", label: "A duplicate" },
        ],
        sources: [
          { id: "s", kind: "image" },
          { id: "s", kind: "image" },
        ],
      }).map((diagnostic) => diagnostic.code),
    ).toEqual([
      "duplicate-layer-id",
      "duplicate-source-id",
      "missing-group-layer",
      "duplicate-group-layer",
      "missing-layer-group",
    ]);
  });

  test("reports invalid blend modes and group opacity", () => {
    expect(
      validateLayerEditorDocument({
        groups: [
          {
            blendMode: "unsupported",
            id: "group",
            label: "Group",
            layerIds: ["layer"],
            opacity: Number.NaN,
          },
        ],
        layers: [
          {
            blendMode: "unsupported",
            id: "layer",
            kind: "shape",
            label: "Layer",
            parentGroupId: "group",
          },
        ],
      }).map((diagnostic) => diagnostic.code),
    ).toEqual(["invalid-layer-blend-mode", "invalid-group-opacity", "invalid-group-blend-mode"]);
  });

  test("throws in strict normalization mode for invalid group visual state", () => {
    expect(() =>
      normalizeLayerEditorDocument({
        groups: [
          {
            blendMode: "missing",
            id: "group",
            label: "Group",
            layerIds: ["layer"],
            opacity: Number.NaN,
          },
        ],
        layers: [{ id: "layer", kind: "shape", label: "Layer" }],
      } as LayerEditorDocument),
    ).toThrow(LayerEditorDocumentValidationError);
  });

  test("throws in strict normalization mode", () => {
    expect(() =>
      normalizeLayerEditorDocument({
        layers: [{ id: "layer", kind: "shape", label: "Layer", opacity: Number.NaN }],
      }),
    ).toThrow(LayerEditorDocumentValidationError);
  });
});
