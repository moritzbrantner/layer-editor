import type { KeyboardEvent, ReactNode } from "react";

import type {
  LayerEditorDocument,
  LayerEditorGroup,
  LayerEditorLayer,
  LayerEditorLayerDropPosition,
  LayerEditorSelection,
  LayerEditorSource,
} from "./core";
import type { LayerEditorHistoryState } from "./history";

export type LayerEditorTreeItem =
  | { id: string; kind: "group"; key: string }
  | { id: string; kind: "layer"; key: string };

export type LayerEditorTreeItemKeyboardContext = {
  event: KeyboardEvent<HTMLDivElement>;
  group?: { collapsed?: boolean; id: string };
  itemKey: string;
  kind: "group" | "layer";
  layer?: { id: string };
};

export type LayerEditorDropTarget = {
  id: string | null;
  kind: "group" | "root";
};

export type LayerEditorRenderedGroup<TLayerData, TGroupData> = {
  forceExpanded: boolean;
  group: LayerEditorGroup<TGroupData>;
  layers: Array<LayerEditorLayer<TLayerData>>;
};

export type LayerEditorRenderedTree<TLayerData, TGroupData> = {
  groups: Array<LayerEditorRenderedGroup<TLayerData, TGroupData>>;
  hasFilter: boolean;
  hasMatches: boolean;
  treeItems: LayerEditorTreeItem[];
  ungroupedLayers: Array<LayerEditorLayer<TLayerData>>;
  visibleLayerIds: string[];
};

export type LayerEditorPanelFeatures = {
  groupMenus?: boolean;
  historyControls?: boolean;
  keyboardCommands?: boolean;
  layerMenus?: boolean;
  search?: boolean;
  toolbar?: boolean;
};

export type LayerEditorCreateLayerContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  existingIds: ReadonlySet<string>;
  selection: LayerEditorSelection;
};

export type LayerEditorCreateGroupContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  existingIds: ReadonlySet<string>;
  selection: LayerEditorSelection;
};

export type LayerEditorLayerActionContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  layer: LayerEditorLayer<TLayerData>;
  selection: LayerEditorSelection;
};

export type LayerEditorGroupActionContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  group: LayerEditorGroup<TGroupData>;
  selection: LayerEditorSelection;
};

export type LayerEditorFilterContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  query: string;
};

export type LayerEditorLayerFilterContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = LayerEditorFilterContext<TLayerData, TGroupData, TSourceData> & {
  layer: LayerEditorLayer<TLayerData>;
  source: LayerEditorSource<TSourceData> | null;
};

export type LayerEditorGroupFilterContext<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = LayerEditorFilterContext<TLayerData, TGroupData, TSourceData> & {
  group: LayerEditorGroup<TGroupData>;
};

export type LayerEditorPanelProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  className?: string;
  createGroup?: (
    context: LayerEditorCreateGroupContext<TLayerData, TGroupData, TSourceData>,
  ) => LayerEditorGroup<TGroupData>;
  createLayer?: (
    context: LayerEditorCreateLayerContext<TLayerData, TGroupData, TSourceData>,
  ) => LayerEditorLayer<TLayerData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  filterGroup?: (
    context: LayerEditorGroupFilterContext<TLayerData, TGroupData, TSourceData>,
  ) => boolean;
  filterLayer?: (
    context: LayerEditorLayerFilterContext<TLayerData, TGroupData, TSourceData>,
  ) => boolean;
  filterPlaceholder?: string;
  filterQuery?: string;
  features?: LayerEditorPanelFeatures;
  history?: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>;
  historyLimit?: number;
  selection?: LayerEditorSelection;
  readOnly?: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  renderLayerLabel?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  renderLayerMeta?: (layer: LayerEditorLayer<TLayerData>) => ReactNode;
  onDocumentChange?: (document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>) => void;
  onFilterQueryChange?: (query: string) => void;
  onHistoryChange?: (history: LayerEditorHistoryState<TLayerData, TGroupData, TSourceData>) => void;
  onSelectionChange?: (selection: LayerEditorSelection) => void;
};

export type LayerEditorController<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  canRedo: boolean;
  canUndo: boolean;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  readOnly: boolean;
  selection: LayerEditorSelection;
  addGroup: (group?: LayerEditorGroup<TGroupData>) => void;
  addLayer: (layer?: LayerEditorLayer<TLayerData>) => void;
  clearSelection: () => void;
  commitDocument: (
    document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
    selection?: LayerEditorSelection,
  ) => void;
  duplicateLayers: (layerIds: readonly string[]) => void;
  duplicateSelectedLayers: () => void;
  groupSelectedLayers: () => void;
  moveLayer: (layerId: string, direction: "down" | "up") => void;
  moveLayerRelativeTo: (
    layerId: string,
    targetLayerId: string,
    position: LayerEditorLayerDropPosition,
  ) => void;
  moveLayerToGroup: (layerId: string, groupId: string | null, targetIndex?: number) => void;
  redo: () => void;
  removeGroup: (groupId: string, options?: { removeLayers?: boolean }) => void;
  removeLayers: (layerIds: readonly string[]) => void;
  removeSelectedLayers: () => void;
  renameGroup: (groupId: string, label: string) => void;
  renameLayer: (layerId: string, label: string) => void;
  selectLayer: (layerId: string, additive?: boolean) => void;
  selectLayers: (layerIds: readonly string[], primaryLayerId?: string | null) => void;
  toggleGroupLocked: (groupId: string) => void;
  toggleGroupCollapsed: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  toggleLayerLocked: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  undo: () => void;
  ungroupGroup: (groupId: string) => void;
};
