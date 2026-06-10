"use client";

import { useCallback } from "react";

import {
  createLayerEditorUniqueId,
  groupLayerEditorLayers,
  removeLayerEditorGroup,
  ungroupLayerEditorGroup,
  updateLayerEditorGroup,
  type LayerEditorDocument,
  type LayerEditorGroup,
  type LayerEditorSelection,
} from "./core";
import type { LayerEditorCommitDocument } from "./react-controller-action-types";
import type { LayerEditorPanelProps } from "./react-types";

type LayerEditorGroupActionOptions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  commitDocument: LayerEditorCommitDocument<TLayerData, TGroupData, TSourceData>;
  createGroup?: LayerEditorPanelProps<TLayerData, TGroupData, TSourceData>["createGroup"];
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  readOnly: boolean;
  resolvedSelection: LayerEditorSelection;
};

export function useLayerEditorGroupActions<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  commitDocument,
  createGroup,
  document,
  readOnly,
  resolvedSelection,
}: LayerEditorGroupActionOptions<TLayerData, TGroupData, TSourceData>) {
  const addGroup = useCallback(
    (group?: LayerEditorGroup<TGroupData>) => {
      if (readOnly) {
        return;
      }

      const existingIds = new Set(document.groups?.map((item) => item.id) ?? []);
      const nextGroup =
        group ??
        createGroup?.({ document, existingIds, selection: resolvedSelection }) ??
        ({
          id: createLayerEditorUniqueId("group", existingIds),
          label: "Group",
          layerIds: resolvedSelection.layerIds,
        } as LayerEditorGroup<TGroupData>);
      const nextDocument = groupLayerEditorLayers(document, nextGroup);

      commitDocument(nextDocument, {
        ...resolvedSelection,
        groupIds: [nextGroup.id],
      });
    },
    [commitDocument, createGroup, document, readOnly, resolvedSelection],
  );

  const groupSelectedLayers = useCallback(() => {
    if (resolvedSelection.layerIds.length === 0) {
      return;
    }

    addGroup();
  }, [addGroup, resolvedSelection.layerIds.length]);

  const removeGroup = useCallback(
    (groupId: string, options: { removeLayers?: boolean } = {}) => {
      if (readOnly) {
        return;
      }

      const group = document.groups?.find((item) => item.id === groupId);
      const nextDocument = removeLayerEditorGroup(document, groupId, options);
      const nextLayerIds = options.removeLayers
        ? resolvedSelection.layerIds.filter((layerId) => !group?.layerIds.includes(layerId))
        : resolvedSelection.layerIds;

      commitDocument(nextDocument, {
        layerIds: nextLayerIds,
        groupIds: resolvedSelection.groupIds?.filter((id) => id !== groupId),
        primaryLayerId: nextLayerIds.includes(resolvedSelection.primaryLayerId ?? "")
          ? resolvedSelection.primaryLayerId
          : (nextLayerIds[0] ?? null),
      });
    },
    [commitDocument, document, readOnly, resolvedSelection],
  );

  const ungroupGroup = useCallback(
    (groupId: string) => {
      if (readOnly) {
        return;
      }

      commitDocument(ungroupLayerEditorGroup(document, groupId), {
        ...resolvedSelection,
        groupIds: resolvedSelection.groupIds?.filter((id) => id !== groupId),
      });
    },
    [commitDocument, document, readOnly, resolvedSelection],
  );

  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(updateLayerEditorGroup(document, groupId, { collapsed: !group.collapsed }));
    },
    [commitDocument, document],
  );

  const toggleGroupVisibility = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(
        updateLayerEditorGroup(document, groupId, { visible: !(group.visible ?? true) }),
      );
    },
    [commitDocument, document],
  );

  const toggleGroupLocked = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      commitDocument(
        updateLayerEditorGroup(document, groupId, { locked: !(group.locked ?? false) }),
      );
    },
    [commitDocument, document],
  );

  const renameGroup = useCallback(
    (groupId: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      commitDocument(updateLayerEditorGroup(document, groupId, { label: nextLabel }));
    },
    [commitDocument, document],
  );

  return {
    addGroup,
    groupSelectedLayers,
    removeGroup,
    renameGroup,
    toggleGroupCollapsed,
    toggleGroupLocked,
    toggleGroupVisibility,
    ungroupGroup,
  };
}
