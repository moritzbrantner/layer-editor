import type { CSSProperties } from "react";

import type { LayerEditorLayer } from "@moritzbrantner/layer-editor";
import type {
  ExampleDocument,
  ExampleLayerData,
  ExampleSourceData,
  GeoPoint,
} from "./example-types";

export function renderLayerMeta(layer: LayerEditorLayer<ExampleLayerData>) {
  return `${layer.kind} / ${Math.round((layer.opacity ?? 1) * 100)}%`;
}

export function visibleLayers(document: ExampleDocument) {
  return document.layers
    .filter((layer) => layer.visible ?? true)
    .slice()
    .reverse();
}

export function findSource(document: ExampleDocument, sourceId: string | undefined) {
  return document.sources?.find((source) => source.id === sourceId) ?? null;
}

export function isGeoJsonSourceData(
  data: ExampleSourceData | undefined,
): data is Extract<ExampleSourceData, { kind: "geojson" }> {
  return data?.kind === "geojson";
}

export function isImageSourceData(
  data: ExampleSourceData | undefined,
): data is Extract<ExampleSourceData, { kind: "image" }> {
  return data?.kind === "image";
}

export function pointsToString(points: GeoPoint[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

export function pointsToPath(points: GeoPoint[]) {
  const [firstPoint, ...restPoints] = points;
  if (!firstPoint) {
    return "";
  }

  return `M ${firstPoint[0]} ${firstPoint[1]} ${restPoints
    .map(([x, y]) => `L ${x} ${y}`)
    .join(" ")} Z`;
}

export function boundsStyle(layer: LayerEditorLayer<ExampleLayerData>): CSSProperties {
  const bounds = layer.bounds ?? { height: 100, width: 100, x: 0, y: 0 };

  return {
    height: `${bounds.height}px`,
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    transform: bounds.rotation ? `rotate(${bounds.rotation}deg)` : undefined,
    width: `${bounds.width}px`,
  };
}

export function stringStyle(
  layer: LayerEditorLayer<ExampleLayerData>,
  key: string,
  fallback: string,
) {
  const value = layer.style?.[key];
  return typeof value === "string" ? value : fallback;
}

export function numberStyle(
  layer: LayerEditorLayer<ExampleLayerData>,
  key: string,
  fallback: number,
) {
  const value = layer.style?.[key];
  return typeof value === "number" ? value : fallback;
}

export function normalizeColorValue(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#18312c";
}
