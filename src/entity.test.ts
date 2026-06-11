import {
  createLayerEditorEntityCollection,
  createLayerEditorEntityDocument,
  layerEditorLayerAdapter,
  type LayerEditorDocument,
} from "./core";

const document: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    {
      id: "mask",
      kind: "mask",
      label: "Mask",
      blendMode: "multiply",
      bounds: { x: 1, y: 2, width: 3, height: 4 },
      locked: true,
      opacity: 0.5,
      parentGroupId: "content",
      visible: false,
    },
    { id: "labels", kind: "text", label: "Labels" },
  ],
};

describe("@moritzbrantner/layer-editor entity projection", () => {
  test("maps layers into core entities", () => {
    const collection = createLayerEditorEntityCollection(document);

    expect(collection.entities.background).toEqual({
      id: "background",
      label: "Background",
      layer: document.layers[0],
      metadata: {
        blendMode: "normal",
        kind: "image",
        opacity: 1,
      },
      order: 0,
      parentId: null,
      type: "image",
    });
    expect(collection.entities.mask).toEqual({
      id: "mask",
      label: "Mask",
      layer: document.layers[1],
      metadata: {
        blendMode: "multiply",
        kind: "mask",
        opacity: 0.5,
      },
      order: 1,
      parentId: "content",
      type: "mask",
    });
  });

  test("maps parent groups to parent ids and exposes ungrouped roots", () => {
    const collection = createLayerEditorEntityCollection(document);

    expect(collection.entities.mask?.parentId).toBe("content");
    expect(collection.entities.background?.parentId).toBeNull();
    expect(collection.entities.labels?.parentId).toBeNull();
    expect(collection.rootIds).toEqual(["background", "labels"]);
  });

  test("keeps the deprecated entity document helper as a collection alias", () => {
    expect(createLayerEditorEntityDocument(document)).toEqual(
      createLayerEditorEntityCollection(document),
    );
  });

  test("keeps the layer adapter defaults and layer-backed accessors stable", () => {
    const collection = createLayerEditorEntityCollection(document);
    const background = collection.entities.background;
    const mask = collection.entities.mask;

    expect(background).toBeDefined();
    expect(mask).toBeDefined();
    expect(layerEditorLayerAdapter.isVisible?.(background!)).toBe(true);
    expect(layerEditorLayerAdapter.isLocked?.(background!)).toBe(false);
    expect(layerEditorLayerAdapter.isVisible?.(mask!)).toBe(false);
    expect(layerEditorLayerAdapter.isLocked?.(mask!)).toBe(true);
    expect(layerEditorLayerAdapter.getBounds?.(mask!)).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
    expect(layerEditorLayerAdapter.getOrder?.(mask!)).toBe(1);
    expect(layerEditorLayerAdapter.getParentId?.(mask!)).toBe("content");
  });
});
