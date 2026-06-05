import { bench, describe } from "vitest";

import {
  duplicateLayerEditorLayer,
  moveLayerEditorLayer,
  normalizeLayerEditorDocument,
  validateLayerEditorDocument,
} from "./operations";
import type { LayerEditorDocument } from "./types";

const largeDocument = createDocument(1_000);

describe("layer editor operations", () => {
  bench("normalize 1,000 layers", () => {
    normalizeLayerEditorDocument(largeDocument);
  });

  bench("validate 1,000 layers", () => {
    validateLayerEditorDocument(largeDocument);
  });

  bench("duplicate a middle layer", () => {
    duplicateLayerEditorLayer(largeDocument, "layer-500");
  });

  bench("move last layer to front", () => {
    moveLayerEditorLayer(largeDocument, "layer-999", 0);
  });
});

function createDocument(layerCount: number): LayerEditorDocument {
  const layers = Array.from({ length: layerCount }, (_, index) => ({
    id: `layer-${index}`,
    label: `Layer ${index}`,
    kind: "shape",
    sourceId: `source-${index % 25}`,
    bounds: {
      x: index,
      y: index * 2,
      width: 100 + (index % 20),
      height: 80 + (index % 10),
      rotation: index % 360,
    },
    data: {
      zIndex: index,
    },
  }));

  return {
    layers,
    groups: [
      {
        id: "group-1",
        label: "Group 1",
        layerIds: layers.slice(0, 250).map((layer) => layer.id),
      },
      {
        id: "group-2",
        label: "Group 2",
        layerIds: layers.slice(250, 500).map((layer) => layer.id),
      },
    ],
    sources: Array.from({ length: 25 }, (_, index) => ({
      id: `source-${index}`,
      kind: "asset",
      label: `Source ${index}`,
    })),
    viewport: {
      x: 100,
      y: 200,
      zoom: 1.5,
    },
  };
}
