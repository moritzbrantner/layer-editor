import type { LayerEditorDocument, LayerEditorSelection } from "./core";

export type LayerEditorCommitDocument<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = (
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>,
  selection?: LayerEditorSelection,
) => void;
