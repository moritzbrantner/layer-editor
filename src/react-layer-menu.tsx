"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@moritzbrantner/ui";
import { Copy, Eye, EyeOff, Lock, MoreHorizontal, Pencil, Trash2, Unlock } from "lucide-react";
import type { ReactNode } from "react";

import type { LayerEditorDocument, LayerEditorLayer } from "./core";
import type {
  LayerEditorController,
  LayerEditorLayerActionContext,
  LayerEditorPanelFeatures,
} from "./react-types";

type LayerEditorLayerMenuProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  beginRename: () => void;
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  features: Required<LayerEditorPanelFeatures>;
  layer: LayerEditorLayer<TLayerData>;
  locked: boolean;
  onOpenLayerMenuChange: (layerId: string | null) => void;
  open: boolean;
  readOnly: boolean;
  renderLayerActions?: (
    context: LayerEditorLayerActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  visible: boolean;
};

export function LayerEditorLayerMenu<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  beginRename,
  controller,
  document,
  features,
  layer,
  locked,
  onOpenLayerMenuChange,
  open,
  readOnly,
  renderLayerActions,
  visible,
}: LayerEditorLayerMenuProps<TLayerData, TGroupData, TSourceData>) {
  if (!features.layerMenus) {
    return null;
  }

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(isOpen) => onOpenLayerMenuChange(isOpen ? layer.id : null)}
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
                onOpenLayerMenuChange(open ? null : layer.id);
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
        <DropdownMenuItem disabled={readOnly} onSelect={beginRename}>
          <Pencil aria-hidden="true" size={16} />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={readOnly}
          onSelect={() => controller.duplicateLayers([layer.id])}
        >
          <Copy aria-hidden="true" size={16} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem
          className="mb-layer-editor__menu-danger"
          disabled={readOnly}
          onSelect={() => controller.removeLayers([layer.id])}
        >
          <Trash2 aria-hidden="true" size={16} />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={readOnly}
          onSelect={() => {
            controller.toggleLayerVisibility(layer.id);
            onOpenLayerMenuChange(null);
          }}
        >
          {visible ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
          {visible ? "Hide" : "Show"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={readOnly}
          onSelect={() => {
            controller.toggleLayerLocked(layer.id);
            onOpenLayerMenuChange(null);
          }}
        >
          {locked ? <Unlock aria-hidden="true" size={16} /> : <Lock aria-hidden="true" size={16} />}
          {locked ? "Unlock" : "Lock"}
        </DropdownMenuItem>
        {renderLayerActions?.({ controller, document, layer, selection: controller.selection })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
