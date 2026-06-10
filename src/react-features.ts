import type { LayerEditorPanelFeatures } from "./react-types";

export function resolveLayerEditorPanelFeatures(
  features: LayerEditorPanelFeatures | undefined,
  hasHistoryHandlers: boolean,
): Required<LayerEditorPanelFeatures> {
  return {
    groupMenus: features?.groupMenus ?? true,
    historyControls: (features?.historyControls ?? false) && hasHistoryHandlers,
    keyboardCommands: features?.keyboardCommands ?? true,
    layerMenus: features?.layerMenus ?? true,
    search: features?.search ?? false,
    toolbar: features?.toolbar ?? true,
  };
}
