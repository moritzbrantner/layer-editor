"use client";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@moritzbrantner/ui";
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
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  moveLayerEditorLayer,
  moveLayerEditorLayerRelativeTo,
  normalizeLayerEditorSelection,
  setLayerEditorLayerLocked,
  setLayerEditorLayerVisibility,
  updateLayerEditorGroup,
  updateLayerEditorLayer,
  type LayerEditorDocument,
  type LayerEditorGroup,
  type LayerEditorLayer,
  type LayerEditorLayerDropPosition,
  type LayerEditorSelection,
} from "./core";

type LayerEditorTreeItem =
  | { id: string; kind: "group"; key: string }
  | { id: string; kind: "layer"; key: string };

type LayerEditorTreeItemKeyboardContext = {
  event: KeyboardEvent<HTMLDivElement>;
  group?: { collapsed?: boolean; id: string };
  itemKey: string;
  kind: "group" | "layer";
  layer?: { id: string };
};

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
    position: LayerEditorLayerDropPosition,
  ) => void;
  renameLayer: (layerId: string, label: string) => void;
  selectLayer: (layerId: string, additive?: boolean) => void;
  toggleGroupCollapsed: (groupId: string) => void;
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

  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      const group = document.groups?.find((item) => item.id === groupId);
      if (!group) {
        return;
      }

      onDocumentChange?.(
        updateLayerEditorGroup(document, groupId, { collapsed: !group.collapsed }),
      );
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
    (layerId: string, targetLayerId: string, position: LayerEditorLayerDropPosition) => {
      onDocumentChange?.(
        moveLayerEditorLayerRelativeTo(document, layerId, targetLayerId, position),
      );
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
    toggleGroupCollapsed,
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
  const treeItems = useMemo(
    () => getVisibleTreeItems(document, groupedLayerIds),
    [document, groupedLayerIds],
  );
  const firstTreeItemKey = treeItems[0]?.key ?? null;
  const [focusedTreeItemKey, setFocusedTreeItemKey] = useState<string | null>(() =>
    selection?.primaryLayerId ? layerTreeItemKey(selection.primaryLayerId) : firstTreeItemKey,
  );
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [openLayerMenuLayerId, setOpenLayerMenuLayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusedTreeItemKey || !treeItems.some((item) => item.key === focusedTreeItemKey)) {
      setFocusedTreeItemKey(firstTreeItemKey);
    }
  }, [firstTreeItemKey, focusedTreeItemKey, treeItems]);

  const handleTreeItemKeyDown = useCallback(
    ({ event, group, kind, layer }: LayerEditorTreeItemKeyboardContext) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        focusRelativeTreeItem(event.currentTarget, offset, setFocusedTreeItemKey);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        focusEdgeTreeItem(
          event.currentTarget,
          event.key === "Home" ? "first" : "last",
          setFocusedTreeItemKey,
        );
        return;
      }

      if (kind === "group" && group) {
        if ((event.key === "Enter" || event.key === " ") && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }

        if (event.key === "ArrowRight" && group.collapsed && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }

        if (event.key === "ArrowLeft" && !group.collapsed && !readOnly) {
          event.preventDefault();
          controller.toggleGroupCollapsed(group.id);
        }
        return;
      }

      if (kind !== "layer" || !layer) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        controller.selectLayer(layer.id, event.shiftKey || event.ctrlKey || event.metaKey);
      }
    },
    [controller, readOnly],
  );

  return (
    <TooltipProvider>
      <div
        aria-multiselectable="true"
        className={joinClassNames("mb-layer-editor", className)}
        role="tree"
      >
        {groups.map((group) => (
          <LayerEditorGroupRow
            key={group.id}
            controller={controller}
            document={document}
            draggedLayerId={draggedLayerId}
            firstTreeItemKey={firstTreeItemKey}
            focusedTreeItemKey={focusedTreeItemKey}
            group={group}
            onDragLayerChange={setDraggedLayerId}
            onLayerMenuClick={onLayerMenuClick}
            onOpenLayerMenuChange={setOpenLayerMenuLayerId}
            onTreeItemFocus={setFocusedTreeItemKey}
            onTreeItemKeyDown={handleTreeItemKeyDown}
            openLayerMenuLayerId={openLayerMenuLayerId}
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
            firstTreeItemKey={firstTreeItemKey}
            focusedTreeItemKey={focusedTreeItemKey}
            layer={layer}
            onDragLayerChange={setDraggedLayerId}
            onLayerMenuClick={onLayerMenuClick}
            onOpenLayerMenuChange={setOpenLayerMenuLayerId}
            onTreeItemFocus={setFocusedTreeItemKey}
            onTreeItemKeyDown={handleTreeItemKeyDown}
            openLayerMenuLayerId={openLayerMenuLayerId}
            readOnly={readOnly}
            renderLayerLabel={renderLayerLabel}
            renderLayerMeta={renderLayerMeta}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

export type LayerEditorGroupRowProps<TLayerData = Record<string, unknown>> = {
  controller: LayerEditorController<TLayerData>;
  document: LayerEditorDocument<TLayerData>;
  draggedLayerId: string | null;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  group: LayerEditorGroup;
  onDragLayerChange: (layerId: string | null) => void;
  onLayerMenuClick?: (
    layer: LayerEditorLayer<TLayerData>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorGroupRow<TLayerData = Record<string, unknown>>({
  controller,
  document,
  draggedLayerId,
  firstTreeItemKey,
  focusedTreeItemKey,
  group,
  onDragLayerChange,
  onLayerMenuClick,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openLayerMenuLayerId,
  readOnly = false,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorGroupRowProps<TLayerData>) {
  const layers = group.layerIds
    .map((layerId) => document.layers.find((layer) => layer.id === layerId))
    .filter((layer): layer is LayerEditorLayer<TLayerData> => Boolean(layer));
  const itemKey = groupTreeItemKey(group.id);
  const collapsed = group.collapsed ?? false;

  return (
    <Collapsible className="mb-layer-editor__group" open={!collapsed}>
      <div
        aria-expanded={!collapsed}
        className="mb-layer-editor__group-header"
        data-layer-editor-tree-item-key={itemKey}
        role="treeitem"
        tabIndex={treeItemTabIndex(itemKey, focusedTreeItemKey, firstTreeItemKey)}
        onFocus={() => onTreeItemFocus(itemKey)}
        onKeyDown={(event) => onTreeItemKeyDown({ event, group, itemKey, kind: "group" })}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <Button
                aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.label}`}
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
                {collapsed ? (
                  <ChevronUp aria-hidden="true" size={16} />
                ) : (
                  <ChevronDown aria-hidden="true" size={16} />
                )}
              </Button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent>{collapsed ? "Expand group" : "Collapse group"}</TooltipContent>
        </Tooltip>
        <span className="mb-layer-editor__group-label">
          <Layers aria-hidden="true" size={16} /> {group.label}
        </span>
      </div>
      <CollapsibleContent
        aria-label={group.label}
        className="mb-layer-editor__group-layers"
        role="group"
      >
        {collapsed
          ? null
          : layers.map((layer) => (
              <LayerEditorLayerRow
                key={layer.id}
                controller={controller}
                document={document}
                draggedLayerId={draggedLayerId}
                firstTreeItemKey={firstTreeItemKey}
                focusedTreeItemKey={focusedTreeItemKey}
                layer={layer}
                onDragLayerChange={onDragLayerChange}
                onLayerMenuClick={onLayerMenuClick}
                onOpenLayerMenuChange={onOpenLayerMenuChange}
                onTreeItemFocus={onTreeItemFocus}
                onTreeItemKeyDown={onTreeItemKeyDown}
                openLayerMenuLayerId={openLayerMenuLayerId}
                readOnly={readOnly}
                renderLayerLabel={renderLayerLabel}
                renderLayerMeta={renderLayerMeta}
              />
            ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export type LayerEditorLayerRowProps<TLayerData = Record<string, unknown>> = {
  controller: LayerEditorController<TLayerData>;
  document: LayerEditorDocument<TLayerData>;
  draggedLayerId: string | null;
  firstTreeItemKey: string | null;
  focusedTreeItemKey: string | null;
  layer: LayerEditorLayer<TLayerData>;
  onDragLayerChange: (layerId: string | null) => void;
  onLayerMenuClick?: (
    layer: LayerEditorLayer<TLayerData>,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  onTreeItemFocus: (itemKey: string) => void;
  onTreeItemKeyDown: (context: LayerEditorTreeItemKeyboardContext) => void;
  openLayerMenuLayerId: string | null;
  readOnly?: boolean;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
};

export function LayerEditorLayerRow<TLayerData = Record<string, unknown>>({
  controller,
  document,
  draggedLayerId,
  firstTreeItemKey,
  focusedTreeItemKey,
  layer,
  onDragLayerChange,
  onLayerMenuClick,
  onOpenLayerMenuChange,
  onTreeItemFocus,
  onTreeItemKeyDown,
  openLayerMenuLayerId,
  readOnly = false,
  renderLayerLabel,
  renderLayerMeta,
}: LayerEditorLayerRowProps<TLayerData>) {
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
    controller.selectLayer(layer.id, event.shiftKey || event.ctrlKey || event.metaKey);
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
        <DropdownMenu
          open={layerMenuOpen}
          onOpenChange={(open) => onOpenLayerMenuChange(open ? layer.id : null)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={`Layer menu ${layer.label}`}
                  className="mb-layer-editor__icon-button"
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onLayerMenuClick?.(layer, event);
                    if (event.defaultPrevented) {
                      onOpenLayerMenuChange(null);
                      return;
                    }

                    onOpenLayerMenuChange(layerMenuOpen ? null : layer.id);
                  }}
                >
                  <MoreHorizontal aria-hidden="true" size={16} />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Layer actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="end"
            aria-label={`${layer.label} options`}
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem
              disabled={readOnly}
              onSelect={() => {
                controller.toggleLayerVisibility(layer.id);
                onOpenLayerMenuChange(null);
              }}
            >
              {visible ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
              {visible ? "Hide" : "Show"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={readOnly}
              onSelect={() => {
                controller.toggleLayerLocked(layer.id);
                onOpenLayerMenuChange(null);
              }}
            >
              {locked ? (
                <Unlock aria-hidden="true" size={16} />
              ) : (
                <Lock aria-hidden="true" size={16} />
              )}
              {locked ? "Unlock" : "Lock"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

function IconButton({
  children,
  disabled,
  label,
  onClick,
  tooltip,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className="mb-layer-editor__icon-button"
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function getVisibleTreeItems(
  document: LayerEditorDocument<unknown, unknown, unknown>,
  groupedLayerIds: ReadonlySet<string>,
): LayerEditorTreeItem[] {
  const items: LayerEditorTreeItem[] = [];

  for (const group of document.groups ?? []) {
    items.push({ id: group.id, kind: "group", key: groupTreeItemKey(group.id) });

    if (!group.collapsed) {
      for (const layerId of group.layerIds) {
        if (document.layers.some((layer) => layer.id === layerId)) {
          items.push({ id: layerId, kind: "layer", key: layerTreeItemKey(layerId) });
        }
      }
    }
  }

  for (const layer of document.layers) {
    if (!groupedLayerIds.has(layer.id)) {
      items.push({ id: layer.id, kind: "layer", key: layerTreeItemKey(layer.id) });
    }
  }

  return items;
}

function focusRelativeTreeItem(
  currentItem: HTMLElement,
  offset: number,
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  const index = items.indexOf(currentItem);
  const target = items[Math.min(items.length - 1, Math.max(0, index + offset))];
  focusTreeItem(target, onTreeItemFocus);
}

function focusEdgeTreeItem(
  currentItem: HTMLElement,
  edge: "first" | "last",
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  focusTreeItem(edge === "first" ? items[0] : items.at(-1), onTreeItemFocus);
}

function focusTreeItem(item: HTMLElement | undefined, onTreeItemFocus: (itemKey: string) => void) {
  if (!item) {
    return;
  }

  const itemKey = item.dataset.layerEditorTreeItemKey;
  if (itemKey) {
    onTreeItemFocus(itemKey);
  }
  item.focus();
}

function getTreeItemElements(currentItem: HTMLElement) {
  const tree = currentItem.closest('[role="tree"]');
  if (!tree) {
    return [currentItem];
  }

  return Array.from(tree.querySelectorAll<HTMLElement>("[data-layer-editor-tree-item-key]"));
}

function treeItemTabIndex(
  itemKey: string,
  focusedTreeItemKey: string | null,
  firstTreeItemKey: string | null,
) {
  return itemKey === (focusedTreeItemKey ?? firstTreeItemKey) ? 0 : -1;
}

function groupTreeItemKey(groupId: string) {
  return `group:${groupId}`;
}

function layerTreeItemKey(layerId: string) {
  return `layer:${layerId}`;
}

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}
