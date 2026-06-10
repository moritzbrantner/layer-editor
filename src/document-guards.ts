import { isEditorRecord } from "@moritzbrantner/editor-core";

import {
  layerEditorBlendModes,
  type LayerEditorBlendMode,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorSource,
} from "./types";

export function isLayerLike(value: unknown): value is LayerEditorLayer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.label === "string" &&
    typeof value.kind === "string" &&
    value.kind.length > 0
  );
}

export function isGroupLike(value: unknown): value is LayerEditorGroup {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.label === "string" &&
    Array.isArray(value.layerIds) &&
    value.layerIds.every((layerId) => typeof layerId === "string")
  );
}

export function isSourceLike(value: unknown): value is LayerEditorSource {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.kind === "string" &&
    value.kind.length > 0
  );
}

export function isValidBounds(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.width) &&
    value.width >= 0 &&
    isFiniteNumber(value.height) &&
    value.height >= 0 &&
    (value.rotation === undefined || isFiniteNumber(value.rotation))
  );
}

export function isValidViewport(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.zoom) &&
    value.zoom > 0
  );
}

export function isLayerEditorBlendMode(value: unknown): value is LayerEditorBlendMode {
  return layerEditorBlendModes.includes(value as LayerEditorBlendMode);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isEditorRecord(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function finiteOr(value: unknown, fallback: number) {
  return isFiniteNumber(value) ? value : fallback;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
