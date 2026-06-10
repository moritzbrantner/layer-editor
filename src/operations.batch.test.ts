import {
  createLayerEditorDocument,
  normalizeLayerEditorSelection,
  patchLayerEditorLayerBounds,
  patchLayerEditorLayerStyle,
  removeLayerEditorLayer,
  setLayerEditorGroupBlendMode,
  setLayerEditorGroupLocked,
  setLayerEditorGroupOpacity,
  setLayerEditorGroupVisibility,
  setLayerEditorLayersBlendMode,
  setLayerEditorLayersLocked,
  setLayerEditorLayersOpacity,
  setLayerEditorLayersVisibility,
  updateLayerEditorLayer,
  updateLayerEditorLayers,
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

describe("@moritzbrantner/layer-editor batch operations", () => {
  test("batch updates layers and returns original documents for no-ops", () => {
    const normalizedDocument = createLayerEditorDocument(document);
    expect(updateLayerEditorLayers(normalizedDocument, ["missing"], { opacity: 0.2 })).toBe(
      normalizedDocument,
    );
    expect(setLayerEditorLayersVisibility(normalizedDocument, ["mask"], true)).toBe(
      normalizedDocument,
    );

    const hidden = setLayerEditorLayersVisibility(normalizedDocument, ["mask", "missing"], false);
    expect(hidden.layers.find((layer) => layer.id === "mask")?.visible).toBe(false);

    const locked = setLayerEditorLayersLocked(hidden, ["mask"], true);
    expect(locked.layers.find((layer) => layer.id === "mask")?.locked).toBe(true);

    const transparent = setLayerEditorLayersOpacity(locked, ["mask"], 2);
    expect(transparent.layers.find((layer) => layer.id === "mask")?.opacity).toBe(1);

    const blended = setLayerEditorLayersBlendMode(transparent, ["mask"], "multiply");
    expect(blended.layers.find((layer) => layer.id === "mask")?.blendMode).toBe("multiply");
  });

  test("patches layer style and bounds without changing ids", () => {
    const styled = updateLayerEditorLayer(document, "mask", {
      bounds: { height: 10, width: 20, x: 1, y: 2 },
      style: { fill: "#fff", stroke: "#000" },
    });

    const stylePatched = patchLayerEditorLayerStyle(styled, "mask", {
      fill: "#f00",
      strokeWidth: 2,
    });
    expect(stylePatched.layers.find((layer) => layer.id === "mask")?.style).toEqual({
      fill: "#f00",
      stroke: "#000",
      strokeWidth: 2,
    });

    const boundsPatched = patchLayerEditorLayerBounds(stylePatched, "mask", {
      height: Number.NaN,
      width: -10,
      x: 5,
    });
    expect(boundsPatched.layers.find((layer) => layer.id === "mask")?.bounds).toEqual({
      height: 0,
      width: 0,
      x: 5,
      y: 2,
    });
    expect(boundsPatched.layers.find((layer) => layer.id === "mask")?.id).toBe("mask");
  });

  test("updates group visual state and normalizes values", () => {
    const grouped = createLayerEditorDocument({
      groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
      layers: document.layers,
    });

    expect(setLayerEditorGroupVisibility(grouped, "missing", false)).toBe(grouped);
    expect(setLayerEditorGroupVisibility(grouped, "content", true)).toBe(grouped);

    const hidden = setLayerEditorGroupVisibility(grouped, "content", false);
    expect(hidden.groups?.[0]?.visible).toBe(false);

    const locked = setLayerEditorGroupLocked(hidden, "content", true);
    expect(locked.groups?.[0]?.locked).toBe(true);

    const transparent = setLayerEditorGroupOpacity(locked, "content", -1);
    expect(transparent.groups?.[0]?.opacity).toBe(0);

    const blended = setLayerEditorGroupBlendMode(transparent, "content", "screen");
    expect(blended.groups?.[0]?.blendMode).toBe("screen");
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
