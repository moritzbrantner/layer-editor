"use client";

import type { Dispatch, DragEvent, MouseEvent, SetStateAction } from "react";

import type { LayerEditorDocument, LayerEditorLayer } from "./core";
import { LayerEditorGroupRow } from "./react-group-row";
import { LayerEditorLayerRow } from "./react-layer-row";
import { LayerEditorRootDropZone } from "./react-toolbar";
import type {
  LayerEditorController,
  LayerEditorDropTarget,
  LayerEditorGroupActionContext,
  LayerEditorLayerActionContext,
  LayerEditorPanelFeatures,
  LayerEditorRenderedGroup,
  LayerEditorTreeItemKeyboardContext,
} from "./react-types";

type LayerEditorPanelTreeProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  activeDropTarget: LayerEditorDropTarget | null;
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  draggedLayerId: string | null;
  features: Required<LayerEditorPanelFeatures>;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  groups: Array<LayerEditorRenderedGroup<TLayerData, TGroupData>>;
  hasFilter: boolean;
  hasMatches: boolean;
  onDragLayerChange: Dispatch<SetStateAction<string | null>>;
  onDragStateClear: () => void;
  onDropTargetChange: Dispatch<SetStateAction<LayerEditorDropTarget | null>>;
  onGroupDrop: (
    groupId: string | null,
    targetIndex: number | undefined,
    event: DragEvent<HTMLElement>,
  ) => void;
  onLayerSelect: (layerId: string, event: MouseEvent<HTMLDivElement>) => void;
  onOpenGroupMenuChange: Dispatch<SetStateAction<string | null>>;
  onOpenLayerMenuChange: Dispatch<SetStateAction<string | null>>;
  onTreeItemFocus: Dispatch<SetStateAction<string | null>>;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openGroupMenuGroupId: string | null;
  openLayerMenuLayerId: string | null;
  readOnly: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => React.ReactNode;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => React.ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => React.ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => React.ReactNode;
  ungroupedLayers: Array<LayerEditorLayer<TLayerData>>;
};

export function LayerEditorPanelTree<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  activeDropTarget,
  controller,
  document,
  draggedLayerId,
  features,
  firstTreeItemKey,
  focusedTreeItemKey,
  groups,
  hasFilter,
  hasMatches,
  onDragLayerChange,
  onDragStateClear,
  onDropTargetChange,
  onGroupDrop,
  onLayerSelect,
  onOpenGroupMenuChange,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openGroupMenuGroupId,
  openLayerMenuLayerId,
  readOnly,
  renderGroupActions,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
  ungroupedLayers,
}: LayerEditorPanelTreeProps<TLayerData, TGroupData, TSourceData>) {
  return (
    <div aria-multiselectable="true" role="tree">
      {groups.length === 0 && ungroupedLayers.length === 0 && !hasFilter ? (
        <p className="mb-layer-editor__empty">No layers.</p>
      ) : null}
      {hasFilter && !hasMatches ? (
        <p className="mb-layer-editor__empty">No matching layers.</p>
      ) : null}
      {groups.map((renderedGroup) => (
        <LayerEditorGroupRow
          key={renderedGroup.group.id}
          activeDropTarget={activeDropTarget}
          controller={controller}
          document={document}
          draggedLayerId={draggedLayerId}
          features={features}
          firstTreeItemKey={firstTreeItemKey}
          focusedTreeItemKey={focusedTreeItemKey}
          group={renderedGroup.group}
          layers={renderedGroup.layers}
          onDragLayerChange={onDragLayerChange}
          onDragStateClear={onDragStateClear}
          onDropTargetChange={onDropTargetChange}
          onGroupDrop={onGroupDrop}
          onLayerSelect={onLayerSelect}
          onOpenGroupMenuChange={onOpenGroupMenuChange}
          onOpenLayerMenuChange={onOpenLayerMenuChange}
          onTreeItemFocus={onTreeItemFocus}
          onTreeItemKeyDown={onTreeItemKeyDown}
          openGroupMenuGroupId={openGroupMenuGroupId}
          openLayerMenuLayerId={openLayerMenuLayerId}
          readOnly={readOnly}
          renderGroupActions={renderGroupActions}
          renderLayerActions={renderLayerActions}
          renderLayerLabel={renderLayerLabel}
          renderLayerMeta={renderLayerMeta}
          showLayers={renderedGroup.forceExpanded || !(renderedGroup.group.collapsed ?? false)}
        />
      ))}
      {ungroupedLayers.map((layer) => (
        <LayerEditorLayerRow
          key={layer.id}
          controller={controller}
          document={document}
          draggedLayerId={draggedLayerId}
          features={features}
          firstTreeItemKey={firstTreeItemKey}
          focusedTreeItemKey={focusedTreeItemKey}
          layer={layer}
          onDragLayerChange={onDragLayerChange}
          onDragStateClear={onDragStateClear}
          onLayerSelect={onLayerSelect}
          onOpenLayerMenuChange={onOpenLayerMenuChange}
          onTreeItemFocus={onTreeItemFocus}
          onTreeItemKeyDown={onTreeItemKeyDown}
          openLayerMenuLayerId={openLayerMenuLayerId}
          readOnly={readOnly}
          renderLayerActions={renderLayerActions}
          renderLayerLabel={renderLayerLabel}
          renderLayerMeta={renderLayerMeta}
        />
      ))}
      {draggedLayerId && !readOnly ? (
        <LayerEditorRootDropZone
          active={activeDropTarget?.kind === "root"}
          onDrop={(event) => onGroupDrop(null, undefined, event)}
          onDropTargetChange={onDropTargetChange}
        />
      ) : null}
    </div>
  );
}
