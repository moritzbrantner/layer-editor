"use client";

import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Lock,
  MoreHorizontal,
  Unlock,
} from "lucide-react";
import {
  useCallback,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  moveLayerEditorLayer,
  normalizeLayerEditorSelection,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  updateLayerEditorGroup,
  updateLayerEditorLayer,
  type LayerEditorDocument,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorSelection,
} from "./core";

type LayerEditorDropPosition = "after" | "before";

export type LayerEditorPanelProps<TLayerData = Record<string, unknown>> = {
  className?: string;
  document: LayerEditorDocument<TLayerData>;
  selection?: LayerEditorSelection;
  readOnly?: boolean;
  onLayerMenuClick?: (
    layer: LayerEditorLayer<TLayerData>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  onDocumentChange?: (document: LayerEditorDocument<TLayerData>) => void;
  onSelectionChange?: (selection: LayerEditorSelection) => void;
};

export type LayerEditorController<TLayerData = Record<string, unknown>> = {
  document: LayerEditorDocument<TLayerData>;
  selection: LayerEditorSelection;
  moveLayer: (layerId: string, direction: "down" | "up") => void;
  moveLayerRelativeTo: (
    layerId: string,
    targetLayerId: string,
    position: LayerEditorDropPosition,
  ) => void;
  renameLayer: (layerId: string, label: string) => void;
  selectLayer: (layerId: string, additive?: boolean) => void;
  toggleLayerLocked: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
};

export function useLayerEditorController<TLayerData = Record<string, unknown>>({
  document,
  selection,
  onDocumentChange,
  onSelectionChange,
}: Pick<
  LayerEditorPanelProps<TLayerData>,
  "document" | "onDocumentChange" | "onSelectionChange" | "selection"
>): LayerEditorController<TLayerData> {
  const resolvedSelection = normalizeLayerEditorSelection(
    document,
    selection ?? { layerIds: [], primaryLayerId: null },
  );

  const selectLayer = useCallback(
    (layerId: string, additive = false) => {
      const selected = resolvedSelection.layerIds.includes(layerId);
      const nextLayerIds =
        additive && selected
          ? resolvedSelection.layerIds.filter((selectedLayerId) => selectedLayerId !== layerId)
          : additive
            ? [...resolvedSelection.layerIds, layerId]
            : [layerId];

      onSelectionChange?.(
        normalizeLayerEditorSelection(document, {
          layerIds: nextLayerIds,
          primaryLayerId: nextLayerIds.includes(layerId) ? layerId : (nextLayerIds[0] ?? null),
        }),
      );
    },
    [document, onSelectionChange, resolvedSelection.layerIds],
  );

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      const layer = document.layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      onDocumentChange?.(
        setLayerEditorLayerVisibility(document, layerId, !(layer.visible ?? true)),
      );
    },
    [document, onDocumentChange],
  );

  const toggleLayerLocked = useCallback(
    (layerId: string) => {
      const layer = document.layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      onDocumentChange?.(setLayerEditorLayerLocked(document, layerId, !(layer.locked ?? false)));
    },
    [document, onDocumentChange],
  );

  const moveLayer = useCallback(
    (layerId: string, direction: "down" | "up") => {
      const index = document.layers.findIndex((layer) => layer.id === layerId);
      if (index < 0) {
        return;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      onDocumentChange?.(moveLayerEditorLayer(document, layerId, targetIndex));
    },
    [document, onDocumentChange],
  );

  const moveLayerRelativeTo = useCallback(
    (layerId: string, targetLayerId: string, position: LayerEditorDropPosition) => {
      if (layerId === targetLayerId) {
        return;
      }

      const sourceIndex = document.layers.findIndex((layer) => layer.id === layerId);
      const targetIndex = document.layers.findIndex((layer) => layer.id === targetLayerId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return;
      }

      let insertionIndex = position === "before" ? targetIndex : targetIndex + 1;
      if (sourceIndex < insertionIndex) {
        insertionIndex -= 1;
      }

      let nextDocument = moveLayerEditorLayer(document, layerId, insertionIndex);
      const sourceGroup = document.groups?.find((group) => group.layerIds.includes(layerId));
      const targetGroup = document.groups?.find((group) => group.layerIds.includes(targetLayerId));

      if (sourceGroup && sourceGroup.id === targetGroup?.id) {
        const sourceGroupIndex = sourceGroup.layerIds.indexOf(layerId);
        const targetGroupIndex = sourceGroup.layerIds.indexOf(targetLayerId);
        let groupInsertionIndex = position === "before" ? targetGroupIndex : targetGroupIndex + 1;

        if (sourceGroupIndex < groupInsertionIndex) {
          groupInsertionIndex -= 1;
        }

        const layerIds = [...sourceGroup.layerIds];
        const [groupLayerId] = layerIds.splice(sourceGroupIndex, 1);
        layerIds.splice(groupInsertionIndex, 0, groupLayerId);
        nextDocument = updateLayerEditorGroup(nextDocument, sourceGroup.id, { layerIds });
      }

      onDocumentChange?.(nextDocument);
    },
    [document, onDocumentChange],
  );

  const renameLayer = useCallback(
    (layerId: string, label: string) => {
      const nextLabel = label.trim();
      if (!nextLabel) {
        return;
      }

      onDocumentChange?.(updateLayerEditorLayer(document, layerId, { label: nextLabel }));
    },
    [document, onDocumentChange],
  );

  return {
    document,
    moveLayer,
    moveLayerRelativeTo,
    renameLayer,
    selection: resolvedSelection,
    selectLayer,
    toggleLayerLocked,
    toggleLayerVisibility,
  };
}

export function LayerEditorPanel<TLayerData = Record<string, unknown>>({
  className,
  document,
  onLayerMenuClick,
  onDocumentChange,
  onSelectionChange,
  readOnly = false,
  renderLayerLabel,
  renderLayerMeta,
  selection,
}: LayerEditorPanelProps<TLayerData>) {
  const controller = useLayerEditorController({
    document,
    onDocumentChange,
    onSelectionChange,
    selection,
  });
  const groups = document.groups ?? [];
  const groupedLayerIds = new Set(groups.flatMap((group) => group.layerIds));
  const ungroupedLayers = document.layers.filter((layer) => !groupedLayerIds.has(layer.id));
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  return (
    <div className={joinClassNames("mb-layer-editor", className)} role="tree">
      {groups.map((group) => (
        <LayerEditorGroupRow
          key={group.id}
          controller={controller}
          document={document}
          draggedLayerId={draggedLayerId}
          group={group}
          onDragLayerChange={setDraggedLayerId}
          onLayerMenuClick={onLayerMenuClick}
          readOnly={readOnly}
          renderLayerLabel={renderLayerLabel}
          renderLayerMeta={renderLayerMeta}
        />
      ))}
      {ungroupedLayers.map((layer) => (
        <LayerEditorLayerRow
          key={layer.id}
          controller={controller}
          document={document}
          draggedLayerId={draggedLayerId}
          layer={layer}
          onDragLayerChange={setDraggedLayerId}
          onLayerMenuClick={onLayerMenuClick}
          readOnly={readOnly}
          renderLayerLabel={renderLayerLabel}
          renderLayerMeta={renderLayerMeta}
        />
      ))}
    </div>
  );
}

export type LayerEditorGroupRowProps<TLayerData = Record<string, unknown>> = {
  controller: LayerEditorController<TLayerData>;
  document: LayerEditorDocument<TLayerData>;
  draggedLayerId: string | null;
  group: LayerEditorGroup;
  onDragLayerChange: (layerId: string | null) => void;
  onLayerMenuClick?: (
    layer: LayerEditorLayer<TLayerData>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  readOnly?: boolean;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorGroupRow<TLayerData = Record<string, unknown>>({
  controller,
  document,
  draggedLayerId,
  group,
  onDragLayerChange,
  onLayerMenuClick,
  readOnly = false,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorGroupRowProps<TLayerData>) {
  const layers = group.layerIds
    .map((layerId) => document.layers.find((layer) => layer.id === layerId))
    .filter((layer): layer is LayerEditorLayer<TLayerData> => Boolean(layer));

  return (
    <div className="mb-layer-editor__group" role="group" aria-label={group.label}>
      <div className="mb-layer-editor__group-header">
        <Layers aria-hidden="true" size={16} />
        <span className="mb-layer-editor__group-label">{group.label}</span>
      </div>
      <div className="mb-layer-editor__group-layers">
        {layers.map((layer) => (
          <LayerEditorLayerRow
            key={layer.id}
            controller={controller}
            document={document}
            draggedLayerId={draggedLayerId}
            layer={layer}
            onDragLayerChange={onDragLayerChange}
            onLayerMenuClick={onLayerMenuClick}
            readOnly={readOnly}
            renderLayerLabel={renderLayerLabel}
            renderLayerMeta={renderLayerMeta}
          />
        ))}
      </div>
    </div>
  );
}

export type LayerEditorLayerRowProps<TLayerData = Record<string, unknown>> = {
  controller: LayerEditorController<TLayerData>;
  document: LayerEditorDocument<TLayerData>;
  draggedLayerId: string | null;
  layer: LayerEditorLayer<TLayerData>;
  onDragLayerChange: (layerId: string | null) => void;
  onLayerMenuClick?: (
    layer: LayerEditorLayer<TLayerData>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  readOnly?: boolean;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorLayerRow<TLayerData = Record<string, unknown>>({
  controller,
  document,
  draggedLayerId,
  layer,
  onDragLayerChange,
  onLayerMenuClick,
  readOnly = false,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorLayerRowProps<TLayerData>) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<LayerEditorDropPosition | null>(null);
  const selected = controller.selection.layerIds.includes(layer.id);
  const layerIndex = document.layers.findIndex((item) => item.id === layer.id);
  const visible = layer.visible ?? true;
  const locked = layer.locked ?? false;

  const handleSelect = (event: MouseEvent<HTMLDivElement>) => {
    controller.selectLayer(layer.id, event.shiftKey || event.ctrlKey || event.metaKey);
  };

  const commitLabelEdit = () => {
    if (editingLabel !== null && editingLabel.trim() !== layer.label) {
      controller.renameLayer(layer.id, editingLabel);
    }
    setEditingLabel(null);
  };

  const handleLabelKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      commitLabelEdit();
    }

    if (event.key === "Escape") {
      setEditingLabel(null);
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
      className={joinClassNames(
        "mb-layer-editor__layer",
        selected && "mb-layer-editor__layer--selected",
        draggedLayerId === layer.id && "mb-layer-editor__layer--dragging",
        dropPosition === "before" && "mb-layer-editor__layer--drop-before",
        dropPosition === "after" && "mb-layer-editor__layer--drop-after",
      )}
      draggable={!readOnly}
      role="treeitem"
      aria-selected={selected}
      tabIndex={0}
      onClick={handleSelect}
      onDragEnd={() => {
        onDragLayerChange(null);
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
        onDragLayerChange(null);
        setDropPosition(null);
      }}
    >
      <button
        aria-label={`${visible ? "Hide" : "Show"} ${layer.label}`}
        className="mb-layer-editor__icon-button"
        disabled={readOnly}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerVisibility(layer.id);
        }}
      >
        {visible ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}
      </button>
      <button
        aria-label={`${locked ? "Unlock" : "Lock"} ${layer.label}`}
        className="mb-layer-editor__icon-button"
        disabled={readOnly}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          controller.toggleLayerLocked(layer.id);
        }}
      >
        {locked ? <Lock aria-hidden="true" size={16} /> : <Unlock aria-hidden="true" size={16} />}
      </button>
      <div className="mb-layer-editor__layer-main">
        {editingLabel === null ? (
          <span
            className="mb-layer-editor__layer-label"
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (!readOnly) {
                setEditingLabel(layer.label);
              }
            }}
          >
            {renderLayerLabel ? renderLayerLabel(layer) : layer.label}
          </span>
        ) : (
          <input
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
      <button
        aria-haspopup="menu"
        aria-label={`Layer menu ${layer.label}`}
        className="mb-layer-editor__icon-button"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onLayerMenuClick?.(layer, event);
        }}
      >
        <MoreHorizontal aria-hidden="true" size={16} />
      </button>
      <button
        aria-label={`Move ${layer.label} up`}
        className="mb-layer-editor__icon-button"
        disabled={readOnly || layerIndex <= 0}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "up");
        }}
      >
        <ChevronUp aria-hidden="true" size={16} />
      </button>
      <button
        aria-label={`Move ${layer.label} down`}
        className="mb-layer-editor__icon-button"
        disabled={readOnly || layerIndex < 0 || layerIndex >= document.layers.length - 1}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          controller.moveLayer(layer.id, "down");
        }}
      >
        <ChevronDown aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
