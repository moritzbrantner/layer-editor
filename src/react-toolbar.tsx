"use client";

import { Button, Input } from "@moritzbrantner/ui";
import { Copy, FolderPlus, Plus, Redo2, Search, Trash2, Undo2, X } from "lucide-react";
import type { DragEvent } from "react";

import type { LayerEditorGroup } from "./core";
import { joinClassNames } from "./react-class-names";
import { IconButton } from "./react-icon-button";
import type {
  LayerEditorController,
  LayerEditorDropTarget,
  LayerEditorPanelFeatures,
} from "./react-types";

export function LayerEditorToolbar<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  controller,
  features,
}: {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  features: Required<LayerEditorPanelFeatures>;
}) {
  const hasSelectedLayers = controller.selection.layerIds.length > 0;
  const showHistoryControls = features.historyControls;

  return (
    <div className="mb-layer-editor__toolbar" role="toolbar">
      <div className="mb-layer-editor__toolbar-group">
        <IconButton
          disabled={controller.readOnly}
          label="Add layer"
          tooltip="Add layer"
          onClick={(event) => {
            event.stopPropagation();
            controller.addLayer();
          }}
        >
          <Plus aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Duplicate selected layers"
          tooltip="Duplicate selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.duplicateSelectedLayers();
          }}
        >
          <Copy aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Delete selected layers"
          tooltip="Delete selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.removeSelectedLayers();
          }}
        >
          <Trash2 aria-hidden="true" size={16} />
        </IconButton>
        <IconButton
          disabled={controller.readOnly || !hasSelectedLayers}
          label="Group selected layers"
          tooltip="Group selected layers"
          onClick={(event) => {
            event.stopPropagation();
            controller.groupSelectedLayers();
          }}
        >
          <FolderPlus aria-hidden="true" size={16} />
        </IconButton>
      </div>
      {showHistoryControls ? (
        <div className="mb-layer-editor__toolbar-group">
          <IconButton
            disabled={controller.readOnly || !controller.canUndo}
            label="Undo"
            tooltip="Undo"
            onClick={(event) => {
              event.stopPropagation();
              controller.undo();
            }}
          >
            <Undo2 aria-hidden="true" size={16} />
          </IconButton>
          <IconButton
            disabled={controller.readOnly || !controller.canRedo}
            label="Redo"
            tooltip="Redo"
            onClick={(event) => {
              event.stopPropagation();
              controller.redo();
            }}
          >
            <Redo2 aria-hidden="true" size={16} />
          </IconButton>
        </div>
      ) : null}
    </div>
  );
}

export function LayerEditorSearchField({
  placeholder,
  query,
  onQueryChange,
}: {
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  return (
    <div className="mb-layer-editor__search">
      <Search aria-hidden="true" className="mb-layer-editor__search-icon" size={16} />
      <Input
        aria-label={placeholder}
        className="mb-layer-editor__search-input"
        placeholder={placeholder}
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {query ? (
        <Button
          aria-label="Clear layer search"
          className="mb-layer-editor__search-clear"
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={() => onQueryChange("")}
        >
          <X aria-hidden="true" size={14} />
        </Button>
      ) : null}
    </div>
  );
}

export function LayerEditorGroupDropZone<TGroupData = Record<string, unknown>>({
  active,
  group,
  onDrop,
  onDropTargetChange,
}: {
  active: boolean;
  group: LayerEditorGroup<TGroupData>;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDropTargetChange: (target: LayerEditorDropTarget | null) => void;
}) {
  return (
    <div
      aria-label={`Drop layer into ${group.label}`}
      className={joinClassNames(
        "mb-layer-editor__drop-zone",
        active && "mb-layer-editor__drop-zone--active",
      )}
      role="presentation"
      onDragLeave={() => onDropTargetChange(null)}
      onDragOver={(event) => {
        event.preventDefault();
        onDropTargetChange({ id: group.id, kind: "group" });
      }}
      onDrop={onDrop}
    >
      Drop layer into group
    </div>
  );
}

export function LayerEditorRootDropZone({
  active,
  onDrop,
  onDropTargetChange,
}: {
  active: boolean;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDropTargetChange: (target: LayerEditorDropTarget | null) => void;
}) {
  return (
    <div
      aria-label="Drop layer at root"
      className={joinClassNames(
        "mb-layer-editor__drop-zone",
        active && "mb-layer-editor__drop-zone--active",
      )}
      role="presentation"
      onDragLeave={() => onDropTargetChange(null)}
      onDragOver={(event) => {
        event.preventDefault();
        onDropTargetChange({ id: null, kind: "root" });
      }}
      onDrop={onDrop}
    >
      Drop layer outside groups
    </div>
  );
}
