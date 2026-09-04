import { describe, expect, it } from "vitest";

import {
  alignLayerEditorLayers,
  distributeLayerEditorLayers,
  rotateLayerEditorLayers,
  snapLayerEditorLayersToGrid,
  translateLayerEditorLayers,
  type LayerEditorDocument,
} from "./core";

function createDocument(): LayerEditorDocument {
  return {
    groups: [{ id: "locked", label: "Locked", layerIds: ["d"], locked: true }],
    layers: [
      {
        id: "a",
        label: "A",
        kind: "shape",
        bounds: { x: 3, y: 7, width: 100, height: 40 },
      },
      {
        id: "b",
        label: "B",
        kind: "shape",
        bounds: { x: 153, y: 57, width: 80, height: 60 },
      },
      {
        id: "c",
        label: "C",
        kind: "shape",
        bounds: { x: 403, y: 107, width: 120, height: 50 },
      },
      {
        id: "d",
        label: "D",
        kind: "shape",
        parentGroupId: "locked",
        bounds: { x: 20, y: 20, width: 40, height: 40 },
      },
    ],
  };
}

describe("layer spatial editing", () => {
  it("translates editable layers while respecting effective group locking", () => {
    const document = translateLayerEditorLayers(createDocument(), ["a", "d"], { x: 10, y: -2 });

    expect(document.layers.find((layer) => layer.id === "a")?.bounds).toMatchObject({
      x: 13,
      y: 5,
    });
    expect(document.layers.find((layer) => layer.id === "d")?.bounds).toMatchObject({
      x: 20,
      y: 20,
    });
  });

  it("snaps layer origins to a configurable grid", () => {
    const document = snapLayerEditorLayersToGrid(createDocument(), ["a", "b"], {
      sizeX: 20,
      sizeY: 10,
      originX: 5,
      originY: 2,
    });

    expect(document.layers[0]?.bounds).toMatchObject({ x: 5, y: 12 });
    expect(document.layers[1]?.bounds).toMatchObject({ x: 145, y: 62 });
  });

  it("aligns measured bounds instead of only their origins", () => {
    const document = alignLayerEditorLayers(createDocument(), ["a", "b", "c"], "center-x");
    const centers = document.layers.slice(0, 3).map((layer) => {
      const bounds = layer.bounds!;
      return bounds.x + bounds.width / 2;
    });

    expect(centers[1]).toBeCloseTo(centers[0]!);
    expect(centers[2]).toBeCloseTo(centers[0]!);
  });

  it("distributes layers evenly while preserving the outer span", () => {
    const before = createDocument();
    const document = distributeLayerEditorLayers(before, ["a", "b", "c"], "horizontal");
    const [a, b, c] = document.layers;
    const firstGap = b!.bounds!.x - (a!.bounds!.x + a!.bounds!.width);
    const secondGap = c!.bounds!.x - (b!.bounds!.x + b!.bounds!.width);

    expect(a!.bounds!.x).toBe(before.layers[0]!.bounds!.x);
    expect(c!.bounds!.x + c!.bounds!.width).toBe(
      before.layers[2]!.bounds!.x + before.layers[2]!.bounds!.width,
    );
    expect(firstGap).toBeCloseTo(secondGap);
  });

  it("normalizes layer rotation into a stable turn", () => {
    const document = rotateLayerEditorLayers(createDocument(), ["a"], -450);

    expect(document.layers[0]?.bounds?.rotation).toBe(270);
  });
});
