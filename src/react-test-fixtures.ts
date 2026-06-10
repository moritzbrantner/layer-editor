import { vi } from "vitest";

import type { LayerEditorDocument, LayerEditorSelection } from "./core";

export const document: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask", opacity: 0.5 },
  ],
};

export const maskSelection = {
  layerIds: ["mask"],
  primaryLayerId: "mask",
} satisfies LayerEditorSelection;

export const rangeDocument: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask", "labels"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask" },
    { id: "labels", kind: "text", label: "Labels" },
    { id: "overlay", kind: "shape", label: "Overlay" },
  ],
};

export function createDataTransfer(layerId: string) {
  const data = new Map<string, string>();
  data.set("text/plain", layerId);

  return {
    effectAllowed: "none",
    getData: vi.fn((key: string) => data.get(key) ?? ""),
    setData: vi.fn((key: string, value: string) => data.set(key, value)),
  } as unknown as DataTransfer;
}
