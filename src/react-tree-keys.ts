export function treeItemTabIndex(
  itemKey: string,
  focusedTreeItemKey: string | null,
  firstTreeItemKey: string | null,
) {
  return itemKey === (focusedTreeItemKey ?? firstTreeItemKey) ? 0 : -1;
}

export function groupTreeItemKey(groupId: string) {
  return `group:${groupId}`;
}

export function layerTreeItemKey(layerId: string) {
  return `layer:${layerId}`;
}
