import {
  addLayerEditorGroup,
  addLayerEditorLayer,
  addLayerEditorSource,
  createLayerEditorDocument,
  duplicateLayerEditorLayer,
  LayerEditorDocumentValidationError,
  moveLayerEditorLayer,
  moveLayerEditorLayerToGroup,
  normalizeLayerEditorDocument,
  normalizeLayerEditorSelection,
  removeLayerEditorGroup,
  removeLayerEditorLayer,
  removeLayerEditorSource,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  updateLayerEditorLayer,
  validateLayerEditorDocument,
  type LayerEditorDocument,
} from "./core";

const document: LayerEditorDocument = {
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask", opacity: 0.5 },
    { id: "labels", kind: "text", label: "Labels" },
  ],
  sources: [{ id: "image-source", kind: "image" }],
};

describe("@moritzbrantner/layer-editor core", () => {
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

  test("throws in strict normalization mode", () => {
    expect(() =>
      normalizeLayerEditorDocument({
        layers: [{ id: "layer", kind: "shape", label: "Layer", opacity: Number.NaN }],
      }),
    ).toThrow(LayerEditorDocumentValidationError);
  });

  test("adds, updates, removes, duplicates, and reorders layers", () => {
    const withLayer = addLayerEditorLayer(document, {
      id: "foreground",
      kind: "shape",
      label: "Foreground",
    });
    expect(withLayer.layers.map((layer) => layer.id)).toEqual([
      "background",
      "mask",
      "labels",
      "foreground",
    ]);

    const updated = updateLayerEditorLayer(withLayer, "foreground", { opacity: 0.25 });
    expect(updated.layers.at(-1)?.opacity).toBe(0.25);

    const duplicated = duplicateLayerEditorLayer(updated, "foreground");
    expect(duplicated.layers.map((layer) => layer.id)).toContain("foreground-copy");

    const moved = moveLayerEditorLayer(duplicated, "foreground-copy", 0);
    expect(moved.layers[0]?.id).toBe("foreground-copy");

    const removed = removeLayerEditorLayer(moved, "foreground-copy");
    expect(removed.layers.map((layer) => layer.id)).not.toContain("foreground-copy");
  });

  test("toggles visibility and lock state", () => {
    expect(setLayerEditorLayerVisibility(document, "mask", false).layers[1]?.visible).toBe(false);
    expect(setLayerEditorLayerLocked(document, "mask", true).layers[1]?.locked).toBe(true);
  });

  test("repairs group membership and supports moving layers to groups", () => {
    const grouped = addLayerEditorGroup(document, {
      id: "content",
      label: "Content",
      layerIds: ["mask", "labels"],
    });
    expect(grouped.groups?.[0]?.layerIds).toEqual(["mask", "labels"]);
    expect(grouped.layers.find((layer) => layer.id === "mask")?.parentGroupId).toBe("content");

    const moved = moveLayerEditorLayerToGroup(grouped, "background", "content", 1);
    expect(moved.groups?.[0]?.layerIds).toEqual(["mask", "background", "labels"]);

    const ungrouped = removeLayerEditorGroup(moved, "content");
    expect(ungrouped.groups).toBeUndefined();
    expect(ungrouped.layers.every((layer) => layer.parentGroupId === undefined)).toBe(true);
  });

  test("adds and removes sources", () => {
    const withSource = addLayerEditorSource(document, { id: "mask-source", kind: "raster" });
    const withReference = updateLayerEditorLayer(withSource, "mask", {
      sourceId: "mask-source",
    });
    const removed = removeLayerEditorSource(withReference, "mask-source");
    expect(removed.sources?.map((source) => source.id)).toEqual(["image-source"]);
    expect(removed.layers.find((layer) => layer.id === "mask")?.sourceId).toBeUndefined();
  });

  test("normalizes selection after deleted layers", () => {
    expect(
      normalizeLayerEditorSelection(removeLayerEditorLayer(document, "mask"), {
        layerIds: ["mask", "labels", "labels"],
        primaryLayerId: "mask",
      }),
    ).toEqual({
      layerIds: ["labels"],
      primaryLayerId: "labels",
    });
  });
});
