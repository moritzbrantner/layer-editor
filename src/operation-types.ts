import type { EditorEntityBase } from "@moritzbrantner/editor-core";

import type {
  LayerEditorBlendMode,
  LayerEditorGroup,
  LayerEditorLayer,
  LayerEditorSource,
} from "./types";

export type LayerEditorEntity<TData = Record<string, unknown>> = EditorEntityBase & {
  label: string;
  layer: LayerEditorLayer<TData>;
};

export type LayerEditorLayerDropPosition = "after" | "before";

export type LayerEditorResolvedLayer<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  layer: LayerEditorLayer<TLayerData>;
  index: number;
  group: LayerEditorGroup<TGroupData> | null;
  groupIndex: number | null;
  source: LayerEditorSource<TSourceData> | null;
  effectiveVisible: boolean;
  effectiveLocked: boolean;
  effectiveOpacity: number;
  effectiveBlendMode: LayerEditorBlendMode;
};

export type LayerEditorRenderEntry<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = LayerEditorResolvedLayer<TLayerData, TGroupData, TSourceData> & {
  renderIndex: number;
};

export type LayerEditorRenderStackOptions = {
  includeHidden?: boolean;
  includeLocked?: boolean;
  order?: "document" | "reverse-document";
};

export type LayerEditorLayerPatch<TLayerData = Record<string, unknown>> = Partial<
  Omit<LayerEditorLayer<TLayerData>, "id">
>;

export type LayerEditorLayerPatchUpdater<TLayerData = Record<string, unknown>> = (
  layer: LayerEditorLayer<TLayerData>,
) => LayerEditorLayerPatch<TLayerData>;
