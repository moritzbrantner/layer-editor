"use client";

import { Input } from "@moritzbrantner/ui";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import {
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import type { LayerEditorDocument, LayerEditorLayer, LayerEditorLayerDropPosition } from "./core";
import { IconButton } from "./react-icon-button";
import { joinClassNames } from "./react-class-names";
import { LayerEditorLayerMenu } from "./react-layer-menu";
import { layerTreeItemKey, treeItemTabIndex } from "./react-tree-keys";
import type {
  LayerEditorController,
  LayerEditorLayerActionContext,
  LayerEditorPanelFeatures,
  LayerEditorTreeItemKeyboardContext,
} from "./react-types";

export type LayerEditorLayerRowProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  draggedLayerId: string | null;
  features: Required<LayerEditorPanelFeatures>;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  layer: LayerEditorLayer<TLayerData>;
  onDragLayerChange: (layerId: string | null) => void;
  onDragStateClear: () => void;
  onLayerSelect: (layerId: string, event: MouseEvent<HTMLDivElement>) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorLayerRow<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  controller,
  document,
  draggedLayerId,
  features,
  firstTreeItemKey,
  focusedTreeItemKey,
  layer,
  onDragLayerChange,
  onDragStateClear,
  onLayerSelect,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openLayerMenuLayerId,
  readOnly = false,
  renderLayerActions,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorLayerRowProps<TLayerData, TGroupData, TSourceData>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<LayerEditorLayerDropPosition | null>(null);
  const itemKey = layerTreeItemKey(layer.id);
  const selected = controller.selection.layerIds.includes(layer.id);
  const layerIndex = document.layers.findIndex((item) => item.id === layer.id);
  const visible = layer.visible ?? true;
  const locked = layer.locked ?? false;
  const layerMenuOpen = openLayerMenuLayerId === layer.id;

  const beginRename = () => {
    if (!readOnly) {
      setEditingLabel(layer.label);
    }
  };

  const handleSelect = (event: MouseEvent<HTMLDivElement>) => {
    onLayerSelect(layer.id, event);
  };

  const commitLabelEdit = () => {
    if (editingLabel !== null && editingLabel.trim() !== layer.label) {
      controller.renameLayer(layer.id, editingLabel);
    }
    setEditingLabel(null);
  };

  const cancelLabelEdit = () => {
    setEditingLabel(null);
    queueMicrotask(() => rowRef.current?.focus());
  };

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      commitLabelEdit();
      queueMicrotask(() => rowRef.current?.focus());
    }

    if (event.key === "Escape") {
      cancelLabelEdit();
    }
  };

  const resolveDropPosition = (event: DragEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY <= bounds.top + bounds.height / 2 ? "before" : "after";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly || !draggedLayerId || draggedLayerId === layer.id) {
      return;
    }

    event.preventDefault();
    setDropPosition(resolveDropPosition(event));
  };

  return (
    <div
      ref={rowRef}
      aria-selected={selected}
      className={joinClassNames(
        "mb-layer-editor__layer",
        selected && "mb-layer-editor__layer--selected",
        draggedLayerId === layer.id && "mb-layer-editor__layer--dragging",
        dropPosition === "before" && "mb-layer-editor__layer--drop-before",
        dropPosition === "after" && "mb-layer-editor__layer--drop-after",
      )}
      data-layer-editor-tree-item-key={itemKey}
      draggable={!readOnly}
      role="treeitem"
      tabIndex={treeItemTabIndex(itemKey, focusedTreeItemKey, firstTreeItemKey)}
      onClick={handleSelect}
      onDragEnd={() => {
        onDragStateClear();
        setDropPosition(null);
      }}
      onDragLeave={() => setDropPosition(null)}
      onDragOver={handleDragOver}
      onDragStart={(event) => {
        if (readOnly) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", layer.id);
        onDragLayerChange(layer.id);
      }}
      onDrop={(event) => {
        if (readOnly || !dropPosition) {
          return;
        }

        event.preventDefault();
        const sourceLayerId = event.dataTransfer.getData("text/plain") || draggedLayerId;
        if (sourceLayerId) {
          controller.moveLayerRelativeTo(sourceLayerId, layer.id, dropPosition);
        }
        onDragStateClear();
        setDropPosition(null);
      }}
      onDoubleClick={beginRename}
      onFocus={() => onTreeItemFocus(itemKey)}
      onKeyDown={(event) => {
        if (event.key === "F2" && event.target === event.currentTarget && !readOnly) {
          event.preventDefault();
          beginRename();
          return;
        }

        onTreeItemKeyDown({ event, itemKey, kind: "layer", layer });
      }}
    >
      <IconButton
        disabled={readOnly}
        label={`${visible ? "Hide" : "Show"} ${layer.label}`}
        tooltip={visible ? "Hide layer" : "Show layer"}
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerVisibility(layer.id);
        }}
      >
        {visible ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}
      </IconButton>
      <IconButton
        disabled={readOnly}
        label={`${locked ? "Unlock" : "Lock"} ${layer.label}`}
        tooltip={locked ? "Unlock layer" : "Lock layer"}
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerLocked(layer.id);
        }}
      >
        {locked ? <Lock aria-hidden="true" size={16} /> : <Unlock aria-hidden="true" size={16} />}
      </IconButton>
      <div className="mb-layer-editor__layer-main">
        {editingLabel === null ? (
          <span
            className="mb-layer-editor__layer-label"
            onDoubleClick={(event) => {
              event.stopPropagation();
              beginRename();
            }}
          >
            {renderLayerLabel ? renderLayerLabel(layer) : layer.label}
          </span>
        ) : (
          <Input
            aria-label={`Rename ${layer.label}`}
            autoFocus={true}
            className="mb-layer-editor__layer-label-input"
            type="text"
            value={editingLabel}
            onBlur={commitLabelEdit}
            onChange={(event) => setEditingLabel(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleLabelKeyDown}
          />
        )}
        <span className="mb-layer-editor__layer-meta">
          {renderLayerMeta ? renderLayerMeta(layer) : `${Math.round((layer.opacity ?? 1) * 100)}%`}
        </span>
      </div>
      <div className="mb-layer-editor__layer-options">
        <LayerEditorLayerMenu
          beginRename={beginRename}
          controller={controller}
          document={document}
          features={features}
          layer={layer}
          locked={locked}
          onOpenLayerMenuChange={onOpenLayerMenuChange}
          open={layerMenuOpen}
          readOnly={readOnly}
          renderLayerActions={renderLayerActions}
          visible={visible}
        />
      </div>
      <IconButton
        disabled={readOnly || layerIndex <= 0}
        label={`Move ${layer.label} up`}
        tooltip="Move layer up"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "up");
        }}
      >
        <ChevronUp aria-hidden="true" size={16} />
      </IconButton>
      <IconButton
        disabled={readOnly || layerIndex < 0 || layerIndex >= document.layers.length - 1}
        label={`Move ${layer.label} down`}
        tooltip="Move layer down"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "down");
        }}
      >
        <ChevronDown aria-hidden="true" size={16} />
      </IconButton>
    </div>
  );
}
