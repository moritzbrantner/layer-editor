import {
  addLayerEditorGroup,
  addLayerEditorLayer,
  addLayerEditorSource,
  createLayerEditorDocument,
  createLayerEditorUniqueId,
  duplicateLayerEditorLayer,
  duplicateLayerEditorLayers,
  groupLayerEditorLayers,
  moveLayerEditorLayer,
  moveLayerEditorLayerRelativeTo,
  moveLayerEditorLayerToGroup,
  removeLayerEditorGroup,
  removeLayerEditorLayer,
  removeLayerEditorLayers,
  removeLayerEditorSource,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  ungroupLayerEditorGroup,
  updateLayerEditorLayer,
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

describe("@moritzbrantner/layer-editor layer operations", () => {
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

  test("creates unique ids from a base id", () => {
    expect(createLayerEditorUniqueId("layer", new Set(["other"]))).toBe("layer");
    expect(createLayerEditorUniqueId("layer", new Set(["layer", "layer-2"]))).toBe("layer-3");
    expect(createLayerEditorUniqueId(" ", new Set(["item"]))).toBe("item-2");
  });

  test("removes multiple layers and repairs groups", () => {
    const grouped = addLayerEditorGroup(document, {
      id: "content",
      label: "Content",
      layerIds: ["mask", "labels"],
    });
    const removed = removeLayerEditorLayers(grouped, ["mask", "labels"]);

    expect(removed.layers.map((layer) => layer.id)).toEqual(["background"]);
    expect(removed.groups).toBeUndefined();
  });

  test("duplicates multiple layers in document order", () => {
    const duplicated = duplicateLayerEditorLayers(document, ["labels", "background"]);

    expect(duplicated.layers.map((layer) => layer.id)).toEqual([
      "background",
      "background-copy",
      "mask",
      "labels",
      "labels-copy",
    ]);
  });

  test("duplicates grouped layers into the same group", () => {
    const grouped = addLayerEditorGroup(document, {
      id: "content",
      label: "Content",
      layerIds: ["mask", "labels"],
    });
    const duplicated = duplicateLayerEditorLayers(grouped, ["mask"]);

    expect(duplicated.layers.map((layer) => layer.id)).toEqual([
      "background",
      "mask",
      "mask-copy",
      "labels",
    ]);
    expect(duplicated.groups?.[0]?.layerIds).toEqual(["mask", "mask-copy", "labels"]);
    expect(duplicated.layers.find((layer) => layer.id === "mask-copy")?.parentGroupId).toBe(
      "content",
    );
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

  test("groups and ungroups layers with semantic helpers", () => {
    const grouped = groupLayerEditorLayers(document, {
      id: "content",
      label: "Content",
      layerIds: ["labels", "missing", "mask", "mask"],
    });

    expect(grouped.groups?.[0]?.layerIds).toEqual(["labels", "mask"]);
    expect(grouped.layers.find((layer) => layer.id === "mask")?.parentGroupId).toBe("content");

    const ungrouped = ungroupLayerEditorGroup(grouped, "content");
    expect(ungrouped.groups).toBeUndefined();
    expect(ungrouped.layers.map((layer) => layer.parentGroupId)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  test("moves ungrouped layers relative to grouped targets", () => {
    const grouped = addLayerEditorGroup(document, {
      id: "content",
      label: "Content",
      layerIds: ["mask", "labels"],
    });
    const moved = moveLayerEditorLayerRelativeTo(grouped, "background", "mask", "before");

    expect(moved.layers.map((layer) => layer.id)).toEqual(["background", "mask", "labels"]);
    expect(moved.groups?.[0]?.layerIds).toEqual(["background", "mask", "labels"]);
    expect(moved.layers.find((layer) => layer.id === "background")?.parentGroupId).toBe("content");
  });

  test("moves grouped layers between groups relative to target layers", () => {
    const grouped: LayerEditorDocument = createLayerEditorDocument({
      groups: [
        { id: "base", label: "Base", layerIds: ["background"] },
        { id: "content", label: "Content", layerIds: ["mask", "labels"] },
      ],
      layers: document.layers.map((layer) => ({
        ...layer,
        parentGroupId:
          layer.id === "background"
            ? "base"
            : layer.id === "mask" || layer.id === "labels"
              ? "content"
              : undefined,
      })),
    });

    const moved = moveLayerEditorLayerRelativeTo(grouped, "background", "labels", "after");

    expect(moved.layers.map((layer) => layer.id)).toEqual(["mask", "labels", "background"]);
    expect(moved.groups?.find((group) => group.id === "base")).toBeUndefined();
    expect(moved.groups?.find((group) => group.id === "content")?.layerIds).toEqual([
      "mask",
      "labels",
      "background",
    ]);
    expect(moved.layers.find((layer) => layer.id === "background")?.parentGroupId).toBe("content");
  });

  test("moves grouped layers relative to ungrouped targets", () => {
    const grouped = addLayerEditorGroup(document, {
      id: "content",
      label: "Content",
      layerIds: ["mask"],
    });
    const moved = moveLayerEditorLayerRelativeTo(grouped, "mask", "background", "after");

    expect(moved.groups).toBeUndefined();
    expect(moved.layers.map((layer) => layer.id)).toEqual(["background", "mask", "labels"]);
    expect(moved.layers.find((layer) => layer.id === "mask")?.parentGroupId).toBeUndefined();
  });

  test("returns original documents for invalid relative layer moves", () => {
    expect(moveLayerEditorLayerRelativeTo(document, "missing", "mask", "before")).toBe(document);
    expect(moveLayerEditorLayerRelativeTo(document, "mask", "missing", "before")).toBe(document);
    expect(moveLayerEditorLayerRelativeTo(document, "mask", "mask", "before")).toBe(document);
  });

  test("repairs duplicate group membership during relative layer moves", () => {
    const repaired = moveLayerEditorLayerRelativeTo(
      {
        groups: [{ id: "content", label: "Content", layerIds: ["mask", "labels", "labels"] }],
        layers: [
          { id: "background", kind: "image", label: "Background" },
          { id: "mask", kind: "mask", label: "Mask", parentGroupId: "content" },
          { id: "labels", kind: "text", label: "Labels", parentGroupId: "content" },
        ],
      },
      "labels",
      "mask",
      "before",
    );

    expect(repaired.groups?.[0]?.layerIds).toEqual(["labels", "mask"]);
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
});
