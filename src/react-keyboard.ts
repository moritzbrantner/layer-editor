import type { LayerEditorSelection } from "./core";

export function isEditableKeyboardTarget(target: EventTarget) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'),
  );
}

export function resolveLayerSelectionAnchor(
  anchorLayerId: string | null,
  selection: LayerEditorSelection,
  visibleLayerIds: readonly string[],
  targetLayerId: string,
) {
  if (anchorLayerId && visibleLayerIds.includes(anchorLayerId)) {
    return anchorLayerId;
  }

  if (selection.primaryLayerId && visibleLayerIds.includes(selection.primaryLayerId)) {
    return selection.primaryLayerId;
  }

  return targetLayerId;
}

export function getLayerSelectionRange(
  visibleLayerIds: readonly string[],
  anchorLayerId: string,
  targetLayerId: string,
) {
  const anchorIndex = visibleLayerIds.indexOf(anchorLayerId);
  const targetIndex = visibleLayerIds.indexOf(targetLayerId);
  if (anchorIndex < 0 || targetIndex < 0) {
    return [targetLayerId];
  }

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return visibleLayerIds.slice(start, end + 1);
}

export function mergeLayerSelections(
  existingLayerIds: readonly string[],
  rangeLayerIds: readonly string[],
) {
  const nextLayerIds = [...existingLayerIds];
  const seenLayerIds = new Set(nextLayerIds);
  for (const layerId of rangeLayerIds) {
    if (!seenLayerIds.has(layerId)) {
      seenLayerIds.add(layerId);
      nextLayerIds.push(layerId);
    }
  }

  return nextLayerIds;
}

export function getRelativeVisibleLayerId(
  visibleLayerIds: readonly string[],
  layerId: string,
  offset: number,
) {
  const index = visibleLayerIds.indexOf(layerId);
  if (index < 0) {
    return null;
  }

  return visibleLayerIds[Math.min(visibleLayerIds.length - 1, Math.max(0, index + offset))] ?? null;
}

export function focusRelativeTreeItem(
  currentItem: HTMLElement,
  offset: number,
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  const index = items.indexOf(currentItem);
  const target = items[Math.min(items.length - 1, Math.max(0, index + offset))];
  focusTreeItem(target, onTreeItemFocus);
}

export function focusEdgeTreeItem(
  currentItem: HTMLElement,
  edge: "first" | "last",
  onTreeItemFocus: (itemKey: string) => void,
) {
  const items = getTreeItemElements(currentItem);
  focusTreeItem(edge === "first" ? items[0] : items.at(-1), onTreeItemFocus);
}

export function focusTreeItem(
  item: HTMLElement | undefined,
  onTreeItemFocus: (itemKey: string) => void,
) {
  if (!item) {
    return;
  }

  const itemKey = item.dataset.layerEditorTreeItemKey;
  if (itemKey) {
    onTreeItemFocus(itemKey);
  }
  item.focus();
}

export function getTreeItemElement(currentItem: HTMLElement, itemKey: string) {
  const tree = currentItem.closest('[role="tree"]');
  return tree?.querySelector<HTMLElement>(`[data-layer-editor-tree-item-key="${itemKey}"]`);
}

export function getTreeItemElements(currentItem: HTMLElement) {
  const tree = currentItem.closest('[role="tree"]');
  if (!tree) {
    return [currentItem];
  }

  return Array.from(tree.querySelectorAll<HTMLElement>("[data-layer-editor-tree-item-key]"));
}
