import { layerEditorBlendModes, type LayerEditorBlendMode } from "./types";
import { throwParseError } from "./serialization-errors";

export function requiredString(input: unknown, path: string) {
  if (typeof input !== "string") {
    throwParseError("invalid-document", path, "Expected string.");
  }

  return input;
}

export function optionalString(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  return requiredString(input, path);
}

export function optionalBlendMode(input: unknown, path: string): LayerEditorBlendMode | undefined {
  if (input === undefined) {
    return undefined;
  }

  const value = requiredString(input, path);
  if (!layerEditorBlendModes.includes(value as LayerEditorBlendMode)) {
    throwParseError("invalid-document", path, "Expected layer blend mode.");
  }

  return value as LayerEditorBlendMode;
}

export function requiredNumber(input: unknown, path: string) {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throwParseError("invalid-document", path, "Expected finite number.");
  }

  return input;
}

export function optionalNumber(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  return requiredNumber(input, path);
}

export function optionalBoolean(input: unknown, path: string) {
  if (input === undefined) {
    return undefined;
  }

  if (typeof input !== "boolean") {
    throwParseError("invalid-document", path, "Expected boolean.");
  }

  return input;
}

export function requiredStringArray(input: unknown, path: string) {
  if (!Array.isArray(input) || !input.every((item) => typeof item === "string")) {
    throwParseError("invalid-document", path, "Expected string array.");
  }

  return input;
}
