import { updateLayerEditorLayers } from "./layer-operations";
import { resolveLayerEditorLayer } from "./render-stack";
import type { LayerEditorBounds, LayerEditorDocument } from "./types";

export type LayerEditorAlignment = "left" | "center-x" | "right" | "top" | "center-y" | "bottom";

export type LayerEditorDistributionAxis = "horizontal" | "vertical";

export type LayerEditorGridOptions = {
  size?: number;
  sizeX?: number;
  sizeY?: number;
  originX?: number;
  originY?: number;
};

export function translateLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  delta: { x: number; y: number },
) {
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    return document;
  }

  const editableIds = getEditableBoundedLayerIds(document, layerIds);
  return updateLayerEditorLayers(document, editableIds, (layer) => ({
    bounds: layer.bounds
      ? {
          ...layer.bounds,
          x: normalizeNumber(layer.bounds.x + delta.x),
          y: normalizeNumber(layer.bounds.y + delta.y),
        }
      : layer.bounds,
  }));
}

export function rotateLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  deltaDegrees: number,
) {
  if (!Number.isFinite(deltaDegrees)) {
    return document;
  }

  const editableIds = getEditableBoundedLayerIds(document, layerIds);
  return updateLayerEditorLayers(document, editableIds, (layer) => ({
    bounds: layer.bounds
      ? {
          ...layer.bounds,
          rotation: normalizeRotation((layer.bounds.rotation ?? 0) + deltaDegrees),
        }
      : layer.bounds,
  }));
}

export function snapLayerEditorLayersToGrid<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  options: LayerEditorGridOptions = {},
) {
  const fallback = positiveFinite(options.size) ?? 8;
  const sizeX = positiveFinite(options.sizeX) ?? fallback;
  const sizeY = positiveFinite(options.sizeY) ?? fallback;
  const originX = finiteOr(options.originX, 0);
  const originY = finiteOr(options.originY, 0);
  const editableIds = getEditableBoundedLayerIds(document, layerIds);

  return updateLayerEditorLayers(document, editableIds, (layer) => ({
    bounds: layer.bounds
      ? {
          ...layer.bounds,
          x: snapCoordinate(layer.bounds.x, originX, sizeX),
          y: snapCoordinate(layer.bounds.y, originY, sizeY),
        }
      : layer.bounds,
  }));
}

export function alignLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  alignment: LayerEditorAlignment,
) {
  const entries = getEditableBounds(document, layerIds);
  if (entries.length < 2) {
    return document;
  }

  const left = Math.min(...entries.map(({ bounds }) => bounds.x));
  const top = Math.min(...entries.map(({ bounds }) => bounds.y));
  const right = Math.max(...entries.map(({ bounds }) => bounds.x + bounds.width));
  const bottom = Math.max(...entries.map(({ bounds }) => bounds.y + bounds.height));
  const centerX = left + (right - left) / 2;
  const centerY = top + (bottom - top) / 2;
  const targetIds = entries.map(({ layerId }) => layerId);

  return updateLayerEditorLayers(document, targetIds, (layer) => {
    if (!layer.bounds) {
      return {};
    }

    const bounds = layer.bounds;
    switch (alignment) {
      case "left":
        return { bounds: { ...bounds, x: left } };
      case "center-x":
        return { bounds: { ...bounds, x: centerX - bounds.width / 2 } };
      case "right":
        return { bounds: { ...bounds, x: right - bounds.width } };
      case "top":
        return { bounds: { ...bounds, y: top } };
      case "center-y":
        return { bounds: { ...bounds, y: centerY - bounds.height / 2 } };
      case "bottom":
        return { bounds: { ...bounds, y: bottom - bounds.height } };
    }
  });
}

export function distributeLayerEditorLayers<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
  axis: LayerEditorDistributionAxis,
) {
  const entries = getEditableBounds(document, layerIds);
  if (entries.length < 3) {
    return document;
  }

  const ordered = [...entries].sort((left, right) =>
    axis === "horizontal"
      ? left.bounds.x - right.bounds.x || left.layerId.localeCompare(right.layerId)
      : left.bounds.y - right.bounds.y || left.layerId.localeCompare(right.layerId),
  );
  const first = ordered[0]!;
  const last = ordered.at(-1)!;
  const start = axis === "horizontal" ? first.bounds.x : first.bounds.y;
  const end =
    axis === "horizontal" ? last.bounds.x + last.bounds.width : last.bounds.y + last.bounds.height;
  const totalSize = ordered.reduce(
    (sum, entry) => sum + (axis === "horizontal" ? entry.bounds.width : entry.bounds.height),
    0,
  );
  const gap = (end - start - totalSize) / (ordered.length - 1);
  const positions = new Map<string, number>();
  let cursor = start;

  for (const entry of ordered) {
    positions.set(entry.layerId, cursor);
    cursor += (axis === "horizontal" ? entry.bounds.width : entry.bounds.height) + gap;
  }

  return updateLayerEditorLayers(
    document,
    ordered.map(({ layerId }) => layerId),
    (layer) => {
      const position = positions.get(layer.id);
      if (!layer.bounds || position === undefined) {
        return {};
      }
      return axis === "horizontal"
        ? { bounds: { ...layer.bounds, x: normalizeNumber(position) } }
        : { bounds: { ...layer.bounds, y: normalizeNumber(position) } };
    },
  );
}

function getEditableBoundedLayerIds<TLayerData, TGroupData, TSourceData>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
) {
  return getEditableBounds(document, layerIds).map(({ layerId }) => layerId);
}

function getEditableBounds<TLayerData, TGroupData, TSourceData>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  layerIds: readonly string[],
): Array<{ layerId: string; bounds: LayerEditorBounds }> {
  const selectedIds = new Set(layerIds);
  return document.layers.flatMap((layer) => {
    if (!selectedIds.has(layer.id) || !layer.bounds) {
      return [];
    }
    const resolved = resolveLayerEditorLayer(document, layer.id);
    return resolved?.effectiveLocked ? [] : [{ layerId: layer.id, bounds: layer.bounds }];
  });
}

function snapCoordinate(value: number, origin: number, size: number) {
  return normalizeNumber(origin + Math.round((value - origin) / size) * size);
}

function normalizeNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

function normalizeRotation(value: number) {
  const normalized = ((value % 360) + 360) % 360;
  return normalizeNumber(normalized);
}

function positiveFinite(value: number | undefined) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined;
}

function finiteOr(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}
