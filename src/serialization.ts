import {
  EditorJsonParseError,
  EditorMigrationError,
  isEditorRecord,
  migrateEditorDocument,
  readEditorDocument,
  serializeEditorDocument,
  type EditorDocumentAdapter,
  type EditorDocumentMigrations,
  type SerializedEditorDocument,
} from "@moritzbrantner/editor-core";

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
> = SerializedEditorDocument<
  LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  typeof layerEditorDocumentFormat,
  typeof currentLayerEditorSchemaVersion
>;

export type LayerEditorParseIssueCode =
  | "invalid-input"
  | "invalid-document"
  | "invalid-format"
  | "invalid-schema-version"
  | "unsupported-schema-version";

export type LayerEditorParseIssue = {
  code: LayerEditorParseIssueCode;
  path: string;
  message: string;
};

export type LayerEditorDocumentMigration = (document: unknown) => unknown;

export type LayerEditorParseOptions = {
  migrations?: Partial<Record<number, LayerEditorDocumentMigration>>;
};

export class LayerEditorParseError extends Error {
  issues: LayerEditorParseIssue[];

  constructor(issues: LayerEditorParseIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "LayerEditorParseError";
    this.issues = issues;
  }
}

export const layerEditorDocumentAdapter: EditorDocumentAdapter<LayerEditorDocument> & {
  format: typeof layerEditorDocumentFormat;
  schemaVersion: typeof currentLayerEditorSchemaVersion;
} = {
  format: layerEditorDocumentFormat,
  normalize: normalizeLayerEditorDocument,
  read: readValidatedLayerEditorDocument,
  schemaVersion: currentLayerEditorSchemaVersion,
};

export function serializeLayerEditorDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>(
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
): SerializedLayerEditorDocument<TLayerData, TGroupData, TSourceData> {
  return serializeEditorDocument(
    document,
    layerEditorDocumentAdapter as EditorDocumentAdapter<
      LayerEditorDocument<TLayerData, TGroupData, TSourceData>
    > & {
      format: typeof layerEditorDocumentFormat;
      schemaVersion: typeof currentLayerEditorSchemaVersion;
    },
    { exportedAt: false },
  );
}

export function parseLayerEditorDocument(
  input: unknown,
  options: LayerEditorParseOptions = {},
): LayerEditorDocument {
  if (!isRecord(input)) {
    throwParseError("invalid-input", "", "Expected an object.");
  }

  assertValidSerializedLayerEditorEnvelope(input, "", options);

  try {
    return readEditorDocument(input, layerEditorDocumentAdapter, {
      migrations: createEditorCoreMigrations(options),
    });
  } catch (error) {
    throw normalizeLayerEditorParseError(error);
  }
}

export function readLayerEditorDocument(
  input: unknown,
  path = "",
  options: LayerEditorParseOptions = {},
): LayerEditorDocument {
  if (!isRecord(input)) {
    throwParseError("invalid-input", path, "Expected an object.");
  }

  const maybeSerialized = resolveSerializedDocument(input, path, options);

  return readLayerEditorDocumentInput(maybeSerialized, path);
}

function readValidatedLayerEditorDocument(input: unknown, path = ""): LayerEditorDocument {
  const document = readLayerEditorDocumentInput(input, path);
  const diagnostics = validateLayerEditorDocument(document);

  if (diagnostics.length > 0) {
    throw new EditorJsonParseError(
      diagnostics.map((diagnostic) => ({
        message: diagnostic.message,
        path: diagnostic.path,
      })),
    );
  }

  return document;
}

function readLayerEditorDocumentInput(input: unknown, path: string): LayerEditorDocument {
  const maybeSerialized = input;
  if (!isRecord(maybeSerialized)) {
    throwParseError("invalid-document", path, "Expected document object.");
  }

  if (!Array.isArray(maybeSerialized.layers)) {
    throwParseError("invalid-document", withPath(path, "layers"), "Expected layers array.");
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
    throwParseError("invalid-document", path, "Expected layer object.");
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
    throwParseError("invalid-document", path, "Expected group object.");
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
    throwParseError("invalid-document", path, "Expected source object.");
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
    throwParseError("invalid-document", path, "Expected bounds object.");
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
    throwParseError("invalid-document", path, "Expected viewport object.");
  }

  return {
    x: requiredNumber(input.x, withPath(path, "x")),
    y: requiredNumber(input.y, withPath(path, "y")),
    zoom: requiredNumber(input.zoom, withPath(path, "zoom")),
  };
}

function requiredString(input: unknown, path: string) {
  if (typeof input !== "string") {
    throwParseError("invalid-document", path, "Expected string.");
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
    throwParseError("invalid-document", path, "Expected layer blend mode.");
  }

  return value as LayerEditorBlendMode;
}

function requiredNumber(input: unknown, path: string) {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throwParseError("invalid-document", path, "Expected finite number.");
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
    throwParseError("invalid-document", path, "Expected boolean.");
  }

  return input;
}

function requiredStringArray(input: unknown, path: string) {
  if (!Array.isArray(input) || !input.every((item) => typeof item === "string")) {
    throwParseError("invalid-document", path, "Expected string array.");
  }

  return input;
}

function withPath(path: string, segment: string) {
  return path ? `${path}.${segment}` : segment;
}

function resolveSerializedDocument(
  input: Record<string, unknown>,
  path: string,
  options: LayerEditorParseOptions,
) {
  if (input.format !== layerEditorDocumentFormat) {
    return input;
  }

  assertValidSerializedLayerEditorEnvelope(input, path, options);

  try {
    const migrated = migrateEditorDocument(
      input,
      layerEditorDocumentAdapter,
      createEditorCoreMigrations(options),
    );

    if (isRecord(migrated) && migrated.format === layerEditorDocumentFormat) {
      return migrated.document;
    }

    return migrated;
  } catch (error) {
    throw normalizeLayerEditorParseError(error);
  }
}

function assertValidSerializedLayerEditorEnvelope(
  input: unknown,
  path: string,
  options: LayerEditorParseOptions,
) {
  if (!isRecord(input) || input.format !== layerEditorDocumentFormat) {
    return;
  }

  if (!("schemaVersion" in input)) {
    throwParseError(
      "invalid-schema-version",
      withPath(path, "schemaVersion"),
      "Expected schema version.",
    );
  }

  if (typeof input.schemaVersion !== "number" || !Number.isFinite(input.schemaVersion)) {
    throwParseError(
      "invalid-schema-version",
      withPath(path, "schemaVersion"),
      "Expected finite schema version.",
    );
  }

  if (!isRecord(input.document)) {
    throwParseError("invalid-document", withPath(path, "document"), "Expected document object.");
  }

  if (input.schemaVersion === currentLayerEditorSchemaVersion) {
    return;
  }

  if (!options.migrations?.[input.schemaVersion]) {
    throwParseError(
      "unsupported-schema-version",
      withPath(path, "schemaVersion"),
      `Unsupported schema version ${input.schemaVersion}.`,
    );
  }
}

function createEditorCoreMigrations(
  options: LayerEditorParseOptions,
): EditorDocumentMigrations<LayerEditorDocument> {
  return Object.fromEntries(
    Object.entries(options.migrations ?? {}).flatMap(([schemaVersion, migrate]) =>
      migrate
        ? [
            [
              schemaVersion,
              (input: SerializedEditorDocument<unknown>) => ({
                document: migrate(input.document),
                format: layerEditorDocumentFormat,
                schemaVersion: currentLayerEditorSchemaVersion,
              }),
            ],
          ]
        : [],
    ),
  );
}

function normalizeLayerEditorParseError(error: unknown): LayerEditorParseError {
  if (error instanceof LayerEditorParseError) {
    return error;
  }

  if (error instanceof EditorJsonParseError) {
    return new LayerEditorParseError(
      error.issues.map((issue) => ({
        code: "invalid-document",
        message: issue.message,
        path: issue.path,
      })),
    );
  }

  if (error instanceof EditorMigrationError) {
    return new LayerEditorParseError([
      {
        code: "unsupported-schema-version",
        message: error.message,
        path: "schemaVersion",
      },
    ]);
  }

  throw error;
}

function throwParseError(code: LayerEditorParseIssueCode, path: string, message: string): never {
  throw new LayerEditorParseError([{ code, message, path }]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isEditorRecord(value);
}
