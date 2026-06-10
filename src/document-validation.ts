import { LayerEditorDocumentValidationError } from "./document-errors";
import {
  isFiniteNumber,
  isGroupLike,
  isLayerEditorBlendMode,
  isLayerLike,
  isRecord,
  isSourceLike,
  isValidBounds,
  isValidViewport,
} from "./document-guards";
import type { LayerEditorDocument, LayerEditorDocumentDiagnostic } from "./types";

export function validateLayerEditorDocument(input: unknown): LayerEditorDocumentDiagnostic[] {
  const diagnostics: LayerEditorDocumentDiagnostic[] = [];

  if (!isRecord(input)) {
    return [
      {
        code: "invalid-document",
        message: "Expected document to be an object.",
        path: "",
      },
    ];
  }

  if (!Array.isArray(input.layers)) {
    diagnostics.push({
      code: "invalid-document",
      message: "Expected layers array.",
      path: "layers",
    });
    return diagnostics;
  }

  const layerIds = new Set<string>();
  const duplicateLayerIds = new Set<string>();

  input.layers.forEach((layer, index) => {
    const path = `layers[${index}]`;
    if (!isLayerLike(layer)) {
      diagnostics.push({
        code: "invalid-layer",
        message: "Expected layer with string id, label, and kind.",
        path,
      });
      return;
    }

    if (layerIds.has(layer.id)) {
      duplicateLayerIds.add(layer.id);
      diagnostics.push({
        code: "duplicate-layer-id",
        layerId: layer.id,
        message: `Duplicate layer id "${layer.id}".`,
        path: `${path}.id`,
      });
    }
    layerIds.add(layer.id);

    if (layer.opacity !== undefined && !isFiniteNumber(layer.opacity)) {
      diagnostics.push({
        code: "invalid-layer-opacity",
        layerId: layer.id,
        message: "Expected layer opacity to be a finite number.",
        path: `${path}.opacity`,
      });
    }

    if (layer.blendMode !== undefined && !isLayerEditorBlendMode(layer.blendMode)) {
      diagnostics.push({
        code: "invalid-layer-blend-mode",
        layerId: layer.id,
        message: "Expected layer blend mode.",
        path: `${path}.blendMode`,
      });
    }

    if (layer.bounds !== undefined && !isValidBounds(layer.bounds)) {
      diagnostics.push({
        code: "invalid-layer-bounds",
        layerId: layer.id,
        message: "Expected finite bounds with non-negative width and height.",
        path: `${path}.bounds`,
      });
    }
  });

  const sourceIds = new Set<string>();
  if (input.sources !== undefined && !Array.isArray(input.sources)) {
    diagnostics.push({
      code: "invalid-source",
      message: "Expected sources array.",
      path: "sources",
    });
  } else {
    input.sources?.forEach((source, index) => {
      const path = `sources[${index}]`;
      if (!isSourceLike(source)) {
        diagnostics.push({
          code: "invalid-source",
          message: "Expected source with string id and kind.",
          path,
        });
        return;
      }

      if (sourceIds.has(source.id)) {
        diagnostics.push({
          code: "duplicate-source-id",
          message: `Duplicate source id "${source.id}".`,
          path: `${path}.id`,
          sourceId: source.id,
        });
      }
      sourceIds.add(source.id);
    });
  }

  const groupIds = new Set<string>();
  const groupedLayerIds = new Set<string>();
  if (input.groups !== undefined && !Array.isArray(input.groups)) {
    diagnostics.push({
      code: "invalid-group",
      message: "Expected groups array.",
      path: "groups",
    });
  } else {
    input.groups?.forEach((group, groupIndex) => {
      const path = `groups[${groupIndex}]`;
      if (!isGroupLike(group)) {
        diagnostics.push({
          code: "invalid-group",
          message: "Expected group with string id, label, and layerIds.",
          path,
        });
        return;
      }

      if (groupIds.has(group.id)) {
        diagnostics.push({
          code: "duplicate-group-id",
          groupId: group.id,
          message: `Duplicate group id "${group.id}".`,
          path: `${path}.id`,
        });
      }
      groupIds.add(group.id);

      if (group.opacity !== undefined && !isFiniteNumber(group.opacity)) {
        diagnostics.push({
          code: "invalid-group-opacity",
          groupId: group.id,
          message: "Expected group opacity to be a finite number.",
          path: `${path}.opacity`,
        });
      }

      if (group.blendMode !== undefined && !isLayerEditorBlendMode(group.blendMode)) {
        diagnostics.push({
          code: "invalid-group-blend-mode",
          groupId: group.id,
          message: "Expected group blend mode.",
          path: `${path}.blendMode`,
        });
      }

      const groupLayerIds = new Set<string>();
      group.layerIds.forEach((layerId, layerIndex) => {
        const layerPath = `${path}.layerIds[${layerIndex}]`;
        if (!layerIds.has(layerId)) {
          diagnostics.push({
            code: "missing-group-layer",
            groupId: group.id,
            layerId,
            message: `Group references missing layer "${layerId}".`,
            path: layerPath,
          });
          return;
        }

        if (groupLayerIds.has(layerId) || groupedLayerIds.has(layerId)) {
          diagnostics.push({
            code: "duplicate-group-layer",
            groupId: group.id,
            layerId,
            message: `Layer "${layerId}" appears more than once in groups.`,
            path: layerPath,
          });
        }

        groupLayerIds.add(layerId);
        groupedLayerIds.add(layerId);
      });
    });
  }

  input.layers.forEach((layer, index) => {
    if (!isLayerLike(layer)) {
      return;
    }

    if (layer.parentGroupId && !groupIds.has(layer.parentGroupId)) {
      diagnostics.push({
        code: "missing-layer-group",
        layerId: layer.id,
        groupId: layer.parentGroupId,
        message: `Layer references missing group "${layer.parentGroupId}".`,
        path: `layers[${index}].parentGroupId`,
      });
    }

    if (layer.sourceId && !sourceIds.has(layer.sourceId)) {
      diagnostics.push({
        code: "missing-layer-source",
        layerId: layer.id,
        sourceId: layer.sourceId,
        message: `Layer references missing source "${layer.sourceId}".`,
        path: `layers[${index}].sourceId`,
      });
    }

    if (duplicateLayerIds.has(layer.id)) {
      return;
    }
  });

  if (input.viewport !== undefined && !isValidViewport(input.viewport)) {
    diagnostics.push({
      code: "invalid-viewport",
      message: "Expected viewport with finite x, y, and positive zoom.",
      path: "viewport",
    });
  }

  return diagnostics;
}

export function assertLayerEditorDocument(
  document: unknown,
): asserts document is LayerEditorDocument {
  const diagnostics = validateLayerEditorDocument(document);
  if (diagnostics.length > 0) {
    throw new LayerEditorDocumentValidationError(diagnostics);
  }
}
