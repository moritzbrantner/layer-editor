import {
  createLayerEditorHistory,
  createLayerEditorUniqueId,
  type LayerEditorLayer,
} from "@moritzbrantner/layer-editor";

import { createGeoJsonDocument } from "./geojson-document";
import { createImageDocument, createSampleImageDataUrl } from "./image-document";
import { createSvgDocument } from "./svg-document";
import type {
  ExampleDocuments,
  ExampleHistories,
  ExampleKey,
  ExampleLayerData,
} from "./example-types";

export async function loadExampleDocuments(): Promise<ExampleDocuments> {
  const sampleImageSrc = createSampleImageDataUrl();

  return {
    geojson: createGeoJsonDocument(),
    image: createImageDocument(sampleImageSrc),
    svg: createSvgDocument(),
  };
}

export function createExampleHistories(documents: ExampleDocuments): ExampleHistories {
  return {
    geojson: createLayerEditorHistory(documents.geojson),
    image: createLayerEditorHistory(documents.image),
    svg: createLayerEditorHistory(documents.svg),
  };
}

export function createExampleLayer(
  example: ExampleKey,
  existingIds: ReadonlySet<string>,
): LayerEditorLayer<ExampleLayerData> {
  if (example === "image") {
    const id = createLayerEditorUniqueId("overlay", existingIds);
    return {
      bounds: { height: 240, width: 360, x: 200, y: 120 },
      data: { kind: "image-overlay" },
      id,
      kind: "image-overlay",
      label: "Overlay",
      opacity: 0.4,
      style: { fill: "#3159a5" },
    };
  }

  if (example === "svg") {
    const id = createLayerEditorUniqueId("rect", existingIds);
    return {
      bounds: { height: 120, width: 220, x: 270, y: 180 },
      data: { kind: "svg-shape", shape: "rect" },
      id,
      kind: "svg-rect",
      label: "Rectangle",
      opacity: 1,
      style: { fill: "#87b1aa", stroke: "#273632", strokeWidth: 4 },
    };
  }

  const id = createLayerEditorUniqueId("layer", existingIds);
  return {
    data: { kind: "geojson", symbol: "area" },
    id,
    kind: "geojson",
    label: "Layer",
    opacity: 1,
  };
}
