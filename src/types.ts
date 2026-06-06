import type { EditorBounds, EditorViewportState } from "@moritzbrantner/editor-core";

export type LayerEditorLayerKind = string;

export type LayerEditorBlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

export const layerEditorBlendModes = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
] as const satisfies readonly LayerEditorBlendMode[];

export type LayerEditorBounds = EditorBounds & {
  rotation?: number;
};

export type LayerEditorSource<TSourceData = Record<string, unknown>> = {
  id: string;
  kind: string;
  label?: string;
  data?: TSourceData;
};

export type LayerEditorLayer<TLayerData = Record<string, unknown>> = {
  id: string;
  label: string;
  kind: LayerEditorLayerKind;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  blendMode?: LayerEditorBlendMode;
  parentGroupId?: string;
  sourceId?: string;
  bounds?: LayerEditorBounds;
  style?: Record<string, unknown>;
  data?: TLayerData;
};

export type LayerEditorGroup<TGroupData = Record<string, unknown>> = {
  id: string;
  label: string;
  layerIds: string[];
  collapsed?: boolean;
  locked?: boolean;
  visible?: boolean;
  data?: TGroupData;
};

export type LayerEditorViewport = EditorViewportState;

export type LayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  layers: Array<LayerEditorLayer<TLayerData>>;
  groups?: Array<LayerEditorGroup<TGroupData>>;
  sources?: Array<LayerEditorSource<TSourceData>>;
  viewport?: LayerEditorViewport;
};

export type LayerEditorSelection = {
  layerIds: string[];
  groupIds?: string[];
  primaryLayerId?: string | null;
};

export type LayerEditorDocumentNormalizationMode = "strict" | "repair";

export type LayerEditorDocumentNormalizationOptions = {
  mode?: LayerEditorDocumentNormalizationMode;
};

export type LayerEditorDocumentDiagnosticCode =
  | "invalid-document"
  | "invalid-layer"
  | "invalid-group"
  | "invalid-source"
  | "duplicate-layer-id"
  | "duplicate-group-id"
  | "duplicate-source-id"
  | "missing-layer-group"
  | "missing-layer-source"
  | "missing-group-layer"
  | "duplicate-group-layer"
  | "invalid-layer-opacity"
  | "invalid-layer-bounds"
  | "invalid-viewport";

export type LayerEditorDocumentDiagnostic = {
  code: LayerEditorDocumentDiagnosticCode;
  message: string;
  path: string;
  layerId?: string;
  groupId?: string;
  sourceId?: string;
};

export type LayerEditorAddLayerOptions = {
  index?: number;
};

export type LayerEditorDuplicateLayerOptions = {
  createId?: (layerId: string, existingIds: ReadonlySet<string>) => string;
  index?: number;
};

export type LayerEditorRemoveGroupOptions = {
  removeLayers?: boolean;
};

export type LayerEditorRemoveSourceOptions = {
  removeLayers?: boolean;
};

export const defaultLayerEditorViewport: LayerEditorViewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const defaultLayerEditorSelection: LayerEditorSelection = {
  layerIds: [],
  primaryLayerId: null,
};
