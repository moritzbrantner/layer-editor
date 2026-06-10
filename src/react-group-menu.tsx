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
import {
  Eye,
  EyeOff,
  FolderMinus,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Unlock,
} from "lucide-react";
import type { ReactNode } from "react";

import type { LayerEditorDocument, LayerEditorGroup } from "./core";
import type {
  LayerEditorController,
  LayerEditorGroupActionContext,
  LayerEditorPanelFeatures,
} from "./react-types";

type LayerEditorGroupMenuProps<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
> = {
  beginRename: () => void;
  controller: LayerEditorController<TLayerData, TGroupData, TSourceData>;
  document: LayerEditorDocument<TLayerData, TGroupData, TSourceData>;
  features: Required<LayerEditorPanelFeatures>;
  group: LayerEditorGroup<TGroupData>;
  locked: boolean;
  onOpenGroupMenuChange: (groupId: string | null) => void;
  open: boolean;
  readOnly: boolean;
  renderGroupActions?: (
    context: LayerEditorGroupActionContext<TLayerData, TGroupData, TSourceData>,
  ) => ReactNode;
  visible: boolean;
};

export function LayerEditorGroupMenu<
  TLayerData = Record<string, unknown>,
  TGroupData = Record<string, unknown>,
  TSourceData = Record<string, unknown>,
>({
  beginRename,
  controller,
  document,
  features,
  group,
  locked,
  onOpenGroupMenuChange,
  open,
  readOnly,
  renderGroupActions,
  visible,
}: LayerEditorGroupMenuProps<TLayerData, TGroupData, TSourceData>) {
  if (!features.groupMenus) {
    return null;
  }

  return (
    <div className="mb-layer-editor__group-actions">
      <DropdownMenu
        open={open}
        onOpenChange={(isOpen) => onOpenGroupMenuChange(isOpen ? group.id : null)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Group menu ${group.label}`}
                className="mb-layer-editor__icon-button"
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenGroupMenuChange(open ? null : group.id);
                }}
              >
                <MoreHorizontal aria-hidden="true" size={16} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Group actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align="end"
          aria-label={`${group.label} options`}
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem disabled={readOnly} onSelect={beginRename}>
            <Pencil aria-hidden="true" size={16} />
            Rename group
          </DropdownMenuItem>
          <DropdownMenuItem disabled={readOnly} onSelect={() => controller.ungroupGroup(group.id)}>
            <FolderMinus aria-hidden="true" size={16} />
            Ungroup
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={readOnly}
            onSelect={() => controller.toggleGroupVisibility(group.id)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" size={16} />
            ) : (
              <Eye aria-hidden="true" size={16} />
            )}
            {visible ? "Hide group" : "Show group"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={readOnly}
            onSelect={() => controller.toggleGroupLocked(group.id)}
          >
            {locked ? (
              <Unlock aria-hidden="true" size={16} />
            ) : (
              <Lock aria-hidden="true" size={16} />
            )}
            {locked ? "Unlock group" : "Lock group"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="mb-layer-editor__menu-danger"
            disabled={readOnly}
            onSelect={() => controller.removeGroup(group.id)}
          >
            <Trash2 aria-hidden="true" size={16} />
            Delete group only
          </DropdownMenuItem>
          <DropdownMenuItem
            className="mb-layer-editor__menu-danger"
            disabled={readOnly}
            onSelect={() => controller.removeGroup(group.id, { removeLayers: true })}
          >
            <Trash2 aria-hidden="true" size={16} />
            Delete group and layers
          </DropdownMenuItem>
          {renderGroupActions?.({ controller, document, group, selection: controller.selection })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
