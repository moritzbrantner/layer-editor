import { EditorJsonParseError } from "@moritzbrantner/editor-core";

import { isRecord } from "./document-guards";
import { validateLayerEditorDocument } from "./document-validation";
import { throwParseError } from "./serialization-errors";
import { withPath } from "./serialization-path";
import {
  optionalBlendMode,
  optionalBoolean,
  optionalNumber,
  optionalString,
  requiredNumber,
  requiredString,
  requiredStringArray,
} from "./serialization-scalars";
import type { LayerEditorDocument } from "./types";

export function readValidatedLayerEditorDocument(input: unknown, path = ""): LayerEditorDocument {
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

export function readLayerEditorDocumentInput(input: unknown, path: string): LayerEditorDocument {
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
    blendMode: optionalBlendMode(input.blendMode, withPath(path, "blendMode")),
    collapsed: optionalBoolean(input.collapsed, withPath(path, "collapsed")),
    data: isRecord(input.data) ? input.data : undefined,
    locked: optionalBoolean(input.locked, withPath(path, "locked")),
    opacity: optionalNumber(input.opacity, withPath(path, "opacity")),
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
