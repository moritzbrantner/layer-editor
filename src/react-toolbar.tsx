"use client";

import {
  Button,
  EditorToolbar,
  EditorToolbarButton,
  EditorToolbarGroup,
  Input,
} from "@moritzbrantner/ui";
import { Copy, FolderPlus, Plus, Redo2, Search, Trash2, Undo2, X } from "lucide-react";
import type { DragEvent } from "react";

import type { LayerEditorGroup } from "./core";
import { joinClassNames } from "./react-class-names";
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
  const shortcut = (hint: string) => (features.keyboardCommands ? hint : undefined);

  return (
    <EditorToolbar
      aria-label="Layer commands"
      className="mb-layer-editor__toolbar"
      density="compact"
    >
      <EditorToolbarGroup aria-label="Layer actions" className="mb-layer-editor__toolbar-group">
        <EditorToolbarButton
          className="mb-layer-editor__icon-button"
          disabled={controller.readOnly}
          icon={<Plus aria-hidden="true" size={16} />}
          label="Add layer"
          onClick={(event) => {
            event.stopPropagation();
            controller.addLayer();
          }}
        />
        <EditorToolbarButton
          className="mb-layer-editor__icon-button"
          disabled={controller.readOnly || !hasSelectedLayers}
          icon={<Copy aria-hidden="true" size={16} />}
          label="Duplicate selected layers"
          shortcut={shortcut("Mod+D")}
          onClick={(event) => {
            event.stopPropagation();
            controller.duplicateSelectedLayers();
          }}
        />
        <EditorToolbarButton
          className="mb-layer-editor__icon-button"
          disabled={controller.readOnly || !hasSelectedLayers}
          icon={<Trash2 aria-hidden="true" size={16} />}
          label="Delete selected layers"
          shortcut={shortcut("Delete")}
          onClick={(event) => {
            event.stopPropagation();
            controller.removeSelectedLayers();
          }}
        />
        <EditorToolbarButton
          className="mb-layer-editor__icon-button"
          disabled={controller.readOnly || !hasSelectedLayers}
          icon={<FolderPlus aria-hidden="true" size={16} />}
          label="Group selected layers"
          shortcut={shortcut("Mod+G")}
          onClick={(event) => {
            event.stopPropagation();
            controller.groupSelectedLayers();
          }}
        />
      </EditorToolbarGroup>
      {showHistoryControls ? (
        <EditorToolbarGroup aria-label="History" className="mb-layer-editor__toolbar-group">
          <EditorToolbarButton
            className="mb-layer-editor__icon-button"
            disabled={controller.readOnly || !controller.canUndo}
            icon={<Undo2 aria-hidden="true" size={16} />}
            label="Undo"
            shortcut={shortcut("Mod+Z")}
            onClick={(event) => {
              event.stopPropagation();
              controller.undo();
            }}
          />
          <EditorToolbarButton
            className="mb-layer-editor__icon-button"
            disabled={controller.readOnly || !controller.canRedo}
            icon={<Redo2 aria-hidden="true" size={16} />}
            label="Redo"
            shortcut={shortcut("Mod+Shift+Z")}
            onClick={(event) => {
              event.stopPropagation();
              controller.redo();
            }}
          />
        </EditorToolbarGroup>
      ) : null}
    </EditorToolbar>
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
