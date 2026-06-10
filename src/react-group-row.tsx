"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@moritzbrantner/ui";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useRef, useState, type DragEvent, type MouseEvent, type ReactNode } from "react";

import type { LayerEditorDocument, LayerEditorGroup, LayerEditorLayer } from "./core";
import { joinClassNames } from "./react-class-names";
import { LayerEditorGroupMenu } from "./react-group-menu";
import { LayerEditorGroupDropZone } from "./react-toolbar";
import { groupTreeItemKey, treeItemTabIndex } from "./react-tree-keys";
import type {
  LayerEditorController,
  LayerEditorDropTarget,
  LayerEditorGroupActionContext,
  LayerEditorLayerActionContext,
  LayerEditorPanelFeatures,
  LayerEditorTreeItemKeyboardContext,
} from "./react-types";
import { LayerEditorLayerRow } from "./react-layer-row";

export type LayerEditorGroupRowProps<
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
  group: LayerEditorGroup<TGroupData>;
  layers: Array<LayerEditorLayer<TLayerData>>;
  onDragLayerChange: (layerId: string | null) => void;
  onDragStateClear: () => void;
  onDropTargetChange: (target: LayerEditorDropTarget | null) => void;
  onGroupDrop: (
    groupId: string | null,
    targetIndex: number | undefined,
    event: DragEvent<HTMLElement>,
  ) => void;
  onLayerSelect: (layerId: string, event: MouseEvent<HTMLDivElement>) => void;
  onOpenGroupMenuChange: (groupId: string | null) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openGroupMenuGroupId: string | null;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  showLayers: boolean;
};

export function LayerEditorGroupRow<
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
  group,
  layers,
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
  readOnly = false,
  renderGroupActions,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
  showLayers,
}: LayerEditorGroupRowProps<TLayerData, TGroupData, TSourceData>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const itemKey = groupTreeItemKey(group.id);
  const expanded = showLayers;
  const visible = group.visible ?? true;
  const locked = group.locked ?? false;
  const groupMenuOpen = openGroupMenuGroupId === group.id;
  const groupDropActive = activeDropTarget?.kind === "group" && activeDropTarget.id === group.id;

  const beginRename = () => {
    if (!readOnly) {
      setEditingLabel(group.label);
    }
  };

  const commitLabelEdit = () => {
    if (editingLabel !== null && editingLabel.trim() !== group.label) {
      controller.renameGroup(group.id, editingLabel);
    }
    setEditingLabel(null);
  };

  const cancelLabelEdit = () => {
    setEditingLabel(null);
    queueMicrotask(() => rowRef.current?.focus());
  };

  return (
    <Collapsible className="mb-layer-editor__group" open={expanded}>
      <div
        ref={rowRef}
        aria-expanded={expanded}
        className={joinClassNames(
          "mb-layer-editor__group-header",
          groupDropActive && "mb-layer-editor__group-header--drop-inside",
        )}
        data-layer-editor-tree-item-key={itemKey}
        role="treeitem"
        tabIndex={treeItemTabIndex(itemKey, focusedTreeItemKey, firstTreeItemKey)}
        onDragLeave={() => onDropTargetChange(null)}
        onDragOver={(event) => {
          if (readOnly || !draggedLayerId) {
            return;
          }

          event.preventDefault();
          onDropTargetChange({ id: group.id, kind: "group" });
        }}
        onDrop={(event) => onGroupDrop(group.id, undefined, event)}
        onFocus={() => onTreeItemFocus(itemKey)}
        onKeyDown={(event) => {
          if (event.key === "F2" && event.target === event.currentTarget && !readOnly) {
            event.preventDefault();
            beginRename();
            return;
          }

          onTreeItemKeyDown({ event, group, itemKey, kind: "group" });
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <Button
                aria-label={`${expanded ? "Collapse" : "Expand"} ${group.label}`}
                className="mb-layer-editor__icon-button"
                disabled={readOnly}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  controller.toggleGroupCollapsed(group.id);
                }}
              >
                {expanded ? (
                  <ChevronDown aria-hidden="true" size={16} />
                ) : (
                  <ChevronUp aria-hidden="true" size={16} />
                )}
              </Button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent>{expanded ? "Collapse group" : "Expand group"}</TooltipContent>
        </Tooltip>
        {editingLabel === null ? (
          <span className="mb-layer-editor__group-label" onDoubleClick={beginRename}>
            <Layers aria-hidden="true" size={16} /> {group.label}
          </span>
        ) : (
          <Input
            aria-label={`Rename group ${group.label}`}
            autoFocus={true}
            className="mb-layer-editor__layer-label-input"
            type="text"
            value={editingLabel}
            onBlur={commitLabelEdit}
            onChange={(event) => setEditingLabel(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                commitLabelEdit();
                queueMicrotask(() => rowRef.current?.focus());
              }

              if (event.key === "Escape") {
                cancelLabelEdit();
              }
            }}
          />
        )}
        <LayerEditorGroupMenu
          beginRename={beginRename}
          controller={controller}
          document={document}
          features={features}
          group={group}
          locked={locked}
          onOpenGroupMenuChange={onOpenGroupMenuChange}
          open={groupMenuOpen}
          readOnly={readOnly}
          renderGroupActions={renderGroupActions}
          visible={visible}
        />
      </div>
      <CollapsibleContent
        aria-label={group.label}
        className="mb-layer-editor__group-layers"
        role="group"
      >
        {layers.map((layer) => (
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
        {layers.length === 0 && draggedLayerId && !readOnly ? (
          <LayerEditorGroupDropZone
            active={groupDropActive}
            group={group}
            onDrop={(event) => onGroupDrop(group.id, 0, event)}
            onDropTargetChange={onDropTargetChange}
          />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
