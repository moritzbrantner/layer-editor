import { createLayerEditorDocument } from "@moritzbrantner/layer-editor";

import type { ExampleDocument } from "./example-types";

export function createSvgDocument(): ExampleDocument {
  return createLayerEditorDocument({
    groups: [
      {
        id: "badge",
        label: "Badge",
        layerIds: ["wordmark", "spark-path", "dot", "panel", "halo"],
      },
    ],
    layers: [
      {
        bounds: { height: 0, width: 0, x: 245, y: 268 },
        data: { kind: "svg-shape", shape: "text", text: "LAYER" },
        id: "wordmark",
        kind: "svg-text",
        label: "Wordmark",
        opacity: 1,
        style: { fill: "#273632" },
      },
      {
        data: {
          kind: "svg-shape",
          path: "M183 226 C235 120 367 114 411 207 C451 292 569 270 606 172",
          shape: "path",
        },
        id: "spark-path",
        kind: "svg-path",
        label: "Spark path",
        opacity: 1,
        style: { fill: "none", stroke: "#eb6f4c", strokeWidth: 14 },
      },
      {
        bounds: { height: 44, width: 44, x: 570, y: 145 },
        data: { kind: "svg-shape", shape: "circle" },
        id: "dot",
        kind: "svg-circle",
        label: "Endpoint",
        opacity: 1,
        style: { fill: "#3159a5", stroke: "#f7f5ee", strokeWidth: 8 },
      },
      {
        bounds: { height: 188, width: 420, x: 170, y: 140 },
        data: { kind: "svg-shape", shape: "rect" },
        id: "panel",
        kind: "svg-rect",
        label: "Panel",
        opacity: 0.92,
        style: { fill: "#e2d6b8", stroke: "#273632", strokeWidth: 4 },
      },
      {
        bounds: { height: 320, width: 320, x: 220, y: 78 },
        data: { kind: "svg-shape", shape: "circle" },
        id: "halo",
        kind: "svg-circle",
        label: "Halo",
        opacity: 0.5,
        style: { fill: "#87b1aa" },
      },
    ],
  });
}
