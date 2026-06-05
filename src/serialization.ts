import {
  normalizeLayerEditorDocument,
  validateLayerEditorDocument,
  layerEditorBlendModes,
  type LayerEditorDocument,
  type LayerEditorBlendMode,
} from "./core";

export const currentLayerEditorSchemaVersion = 1;
export const layerEditorDocumentFormat = "@moritzbrantner/layer-editor/document";

export type SerializedLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  format: typeof layerEditorDocumentFormat;
  schemaVersion: typeof currentLayerEditorSchemaVersion;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
};

export class LayerEditorParseError extends Error {
  issues: Array<{ path: string; message: string }>;

  constructor(issues: Array<{ path: string; message: string }>) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "LayerEditorParseError";
    this.issues = issues;
  }
}

export function serializeLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): SerializedLayerEditorDocument<TLayerData, TGroupData, TSourceData> {
  return {
    document: normalizeLayerEditorDocument(document),
    format: layerEditorDocumentFormat,
    schemaVersion: currentLayerEditorSchemaVersion,
  };
}

export function parseLayerEditorDocument(input: unknown): LayerEditorDocument {
  const document = readLayerEditorDocument(input);
  const diagnostics = validateLayerEditorDocument(document);

  if (diagnostics.length > 0) {
    throw new LayerEditorParseError(
      diagnostics.map((diagnostic) => ({
        message: diagnostic.message,
        path: diagnostic.path,
      })),
    );
  }

  return normalizeLayerEditorDocument(document);
}

export function readLayerEditorDocument(input: unknown, path = ""): LayerEditorDocument {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected an object.", path }]);
  }

  const maybeSerialized =
    input.format === layerEditorDocumentFormat &&
    input.schemaVersion === currentLayerEditorSchemaVersion &&
    isRecord(input.document)
      ? input.document
      : input;

  if (!isRecord(maybeSerialized)) {
    throw new LayerEditorParseError([{ message: "Expected document object.", path }]);
  }

  if (!Array.isArray(maybeSerialized.layers)) {
    throw new LayerEditorParseError([
      { message: "Expected layers array.", path: withPath(path, "layers") },
    ]);
  }

  const document: LayerEditorDocument = {
    layers: maybeSerialized.layers.map((layer, index) =>
      readLayer(layer, withPath(path, `layers[${index}]`)),
    ),
    groups: Array.isArray(maybeSerialized.groups)
      ? maybeSerialized.groups.map((group, index) =>
          readGroup(group, withPath(path, `groups[${index}]`)),
        )
      : undefined,
    sources: Array.isArray(maybeSerialized.sources)
      ? maybeSerialized.sources.map((source, index) =>
          readSource(source, withPath(path, `sources[${index}]`)),
        )
      : undefined,
    viewport:
      maybeSerialized.viewport === undefined
        ? undefined
        : readViewport(maybeSerialized.viewport, withPath(path, "viewport")),
  };

  return document;
}

function readLayer(input: unknown, path: string) {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected layer object.", path }]);
  }

  return {
    id: requiredString(input.id, withPath(path, "id")),
    label: requiredString(input.label, withPath(path, "label")),
    kind: requiredString(input.kind, withPath(path, "kind")),
    blendMode: optionalBlendMode(input.blendMode, withPath(path, "blendMode")),
    bounds:
      input.bounds === undefined ? undefined : readBounds(input.bounds, withPath(path, "bounds")),
    data: isRecord(input.data) ? input.data : undefined,
    locked: optionalBoolean(input.locked, withPath(path, "locked")),
    opacity: optionalNumber(input.opacity, withPath(path, "opacity")),
    parentGroupId: optionalString(input.parentGroupId, withPath(path, "parentGroupId")),
    sourceId: optionalString(input.sourceId, withPath(path, "sourceId")),
    style: isRecord(input.style) ? input.style : undefined,
    visible: optionalBoolean(input.visible, withPath(path, "visible")),
  };
}

function readGroup(input: unknown, path: string) {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected group object.", path }]);
  }

  return {
    id: requiredString(input.id, withPath(path, "id")),
    label: requiredString(input.label, withPath(path, "label")),
    layerIds: requiredStringArray(input.layerIds, withPath(path, "layerIds")),
    collapsed: optionalBoolean(input.collapsed, withPath(path, "collapsed")),
    data: isRecord(input.data) ? input.data : undefined,
    locked: optionalBoolean(input.locked, withPath(path, "locked")),
    visible: optionalBoolean(input.visible, withPath(path, "visible")),
  };
}

function readSource(input: unknown, path: string) {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected source object.", path }]);
  }

  return {
    id: requiredString(input.id, withPath(path, "id")),
    kind: requiredString(input.kind, withPath(path, "kind")),
    data: isRecord(input.data) ? input.data : undefined,
    label: optionalString(input.label, withPath(path, "label")),
  };
}

function readBounds(input: unknown, path: string) {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected bounds object.", path }]);
  }

  return {
    x: requiredNumber(input.x, withPath(path, "x")),
    y: requiredNumber(input.y, withPath(path, "y")),
    width: requiredNumber(input.width, withPath(path, "width")),
    height: requiredNumber(input.height, withPath(path, "height")),
    rotation: optionalNumber(input.rotation, withPath(path, "rotation")),
  };
}

function readViewport(input: unknown, path: string) {
  if (!isRecord(input)) {
    throw new LayerEditorParseError([{ message: "Expected viewport object.", path }]);
  }

  return {
    x: requiredNumber(input.x, withPath(path, "x")),
    y: requiredNumber(input.y, withPath(path, "y")),
    zoom: requiredNumber(input.zoom, withPath(path, "zoom")),
  };
}

function requiredString(input: unknown, path: string) {
  if (typeof input !== "string") {
    throw new LayerEditorParseError([{ message: "Expected string.", path }]);
  }

  return input;
}

function optionalString(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  return requiredString(input, path);
}

function optionalBlendMode(input: unknown, path: string): LayerEditorBlendMode | undefined {
  if (input === undefined) {
    return undefined;
  }

  const value = requiredString(input, path);
  if (!layerEditorBlendModes.includes(value as LayerEditorBlendMode)) {
    throw new LayerEditorParseError([{ message: "Expected layer blend mode.", path }]);
  }

  return value as LayerEditorBlendMode;
}

function requiredNumber(input: unknown, path: string) {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throw new LayerEditorParseError([{ message: "Expected finite number.", path }]);
  }

  return input;
}

function optionalNumber(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  return requiredNumber(input, path);
}

function optionalBoolean(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "boolean") {
    throw new LayerEditorParseError([{ message: "Expected boolean.", path }]);
  }

  return input;
}

function requiredStringArray(input: unknown, path: string) {
  if (!Array.isArray(input) || !input.every((item) => typeof item === "string")) {
    throw new LayerEditorParseError([{ message: "Expected string array.", path }]);
  }

  return input;
}

function withPath(path: string, segment: string) {
  return path ? `${path}.${segment}` : segment;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
