import {
  createLayerEditorDocument,
  getLayerEditorGroupIds,
  getLayerEditorGroupLayers,
  getLayerEditorGroupsById,
  getLayerEditorLayerIds,
  getLayerEditorLayersById,
  getLayerEditorRenderStack,
  getLayerEditorSourcesById,
  getLayerEditorUngroupedLayers,
  resolveLayerEditorLayer,
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

describe("@moritzbrantner/layer-editor query and render operations", () => {
  test("exposes ids, lookup maps, group layers, and ungrouped layers", () => {
    const grouped = createLayerEditorDocument({
      groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
      layers: document.layers.map((layer) =>
        layer.id === "mask" ? { ...layer, parentGroupId: "content" } : layer,
      ),
      sources: document.sources,
    });

    expect(getLayerEditorLayerIds(grouped)).toEqual(["background", "mask", "labels"]);
    expect(getLayerEditorGroupIds(grouped)).toEqual(["content"]);
    expect(getLayerEditorLayersById(grouped).get("mask")?.label).toBe("Mask");
    expect(getLayerEditorGroupsById(grouped).get("content")?.label).toBe("Content");
    expect(getLayerEditorSourcesById(grouped).get("image-source")?.kind).toBe("image");
    expect(getLayerEditorGroupLayers(grouped, "content").map((layer) => layer.id)).toEqual([
      "mask",
    ]);
    expect(getLayerEditorUngroupedLayers(grouped).map((layer) => layer.id)).toEqual([
      "background",
      "labels",
    ]);
  });

  test("resolves effective render state and render stack order", () => {
    const renderDocument = createLayerEditorDocument({
      groups: [
        {
          blendMode: "multiply",
          id: "content",
          label: "Content",
          layerIds: ["mask", "labels"],
          locked: true,
          opacity: 0.5,
          visible: true,
        },
      ],
      layers: [
        { id: "background", kind: "image", label: "Background" },
        {
          id: "mask",
          kind: "mask",
          label: "Mask",
          opacity: 0.5,
          parentGroupId: "content",
          sourceId: "image-source",
        },
        {
          blendMode: "screen",
          id: "labels",
          kind: "text",
          label: "Labels",
          parentGroupId: "content",
          visible: false,
        },
      ],
      sources: [{ id: "image-source", kind: "image", label: "Photo" }],
    });

    expect(resolveLayerEditorLayer(renderDocument, "missing")).toBeNull();

    const resolved = resolveLayerEditorLayer(renderDocument, "mask");
    expect(resolved).toEqual(
      expect.objectContaining({
        effectiveBlendMode: "multiply",
        effectiveLocked: true,
        effectiveOpacity: 0.25,
        effectiveVisible: true,
        groupIndex: 0,
        index: 1,
      }),
    );
    expect(resolved?.group?.id).toBe("content");
    expect(resolved?.source?.id).toBe("image-source");

    expect(getLayerEditorRenderStack(renderDocument).map((entry) => entry.layer.id)).toEqual([
      "background",
      "mask",
    ]);
    expect(
      getLayerEditorRenderStack(renderDocument, { order: "reverse-document" }).map(
        (entry) => entry.layer.id,
      ),
    ).toEqual(["mask", "background"]);
    expect(
      getLayerEditorRenderStack(renderDocument, { includeLocked: false }).map(
        (entry) => entry.layer.id,
      ),
    ).toEqual(["background"]);
    expect(
      getLayerEditorRenderStack(renderDocument, { includeHidden: true }).map(
        (entry) => entry.layer.id,
      ),
    ).toEqual(["background", "mask", "labels"]);
  });
});
