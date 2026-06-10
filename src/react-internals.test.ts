import { getFilteredLayerEditorTree } from "./react-filtering";
import { resolveLayerEditorPanelFeatures } from "./react-features";
import { joinClassNames } from "./react-class-names";
import { nearestSurvivingLayerSelection } from "./react-controller-utils";
import {
  focusEdgeTreeItem,
  focusRelativeTreeItem,
  getLayerSelectionRange,
  getRelativeVisibleLayerId,
  getTreeItemElement,
  isEditableKeyboardTarget,
  mergeLayerSelections,
  resolveLayerSelectionAnchor,
} from "./react-keyboard";
import { groupTreeItemKey, layerTreeItemKey, treeItemTabIndex } from "./react-tree-keys";
import type { LayerEditorDocument } from "./core";

describe("@moritzbrantner/layer-editor React internals", () => {
  test("resolves feature defaults and gates history controls on handlers", () => {
    expect(resolveLayerEditorPanelFeatures(undefined, true)).toEqual({
      groupMenus: true,
      historyControls: false,
      keyboardCommands: true,
      layerMenus: true,
      search: false,
      toolbar: true,
    });
    expect(
      resolveLayerEditorPanelFeatures(
        {
          groupMenus: false,
          historyControls: true,
          keyboardCommands: false,
          layerMenus: false,
          search: true,
          toolbar: false,
        },
        false,
      ),
    ).toEqual({
      groupMenus: false,
      historyControls: false,
      keyboardCommands: false,
      layerMenus: false,
      search: true,
      toolbar: false,
    });
    expect(resolveLayerEditorPanelFeatures({ historyControls: true }, true).historyControls).toBe(
      true,
    );
  });

  test("builds class names and tree item keys", () => {
    expect(joinClassNames("base", false, undefined, "active", null)).toBe("base active");
    expect(groupTreeItemKey("content")).toBe("group:content");
    expect(layerTreeItemKey("mask")).toBe("layer:mask");
    expect(treeItemTabIndex("layer:mask", "layer:mask", "group:content")).toBe(0);
    expect(treeItemTabIndex("layer:mask", null, "layer:mask")).toBe(0);
    expect(treeItemTabIndex("layer:mask", "group:content", "layer:mask")).toBe(-1);
  });

  test("chooses the nearest surviving selection after layer removals", () => {
    const previousDocument: LayerEditorDocument = {
      layers: [
        { id: "a", kind: "image", label: "A" },
        { id: "b", kind: "image", label: "B" },
        { id: "c", kind: "image", label: "C" },
        { id: "d", kind: "image", label: "D" },
      ],
    };

    expect(
      nearestSurvivingLayerSelection(
        previousDocument,
        { layers: previousDocument.layers.filter((layer) => layer.id !== "b") },
        ["b"],
      ),
    ).toEqual({ layerIds: ["c"], primaryLayerId: "c" });
    expect(
      nearestSurvivingLayerSelection(
        previousDocument,
        { layers: previousDocument.layers.filter((layer) => layer.id !== "d") },
        ["d"],
      ),
    ).toEqual({ layerIds: ["c"], primaryLayerId: "c" });
    expect(nearestSurvivingLayerSelection(previousDocument, { layers: [] }, ["a", "b"])).toEqual({
      layerIds: [],
      primaryLayerId: null,
    });
  });

  test("filters the rendered tree by default fields and custom predicates", () => {
    const sourceDocument: LayerEditorDocument = {
      groups: [{ collapsed: true, id: "content", label: "Content", layerIds: ["mask"] }],
      layers: [
        { id: "background", kind: "image", label: "Background", sourceId: "hero" },
        { id: "mask", kind: "mask", label: "Mask" },
        { id: "labels", kind: "text", label: "Labels" },
      ],
      sources: [{ id: "hero", kind: "raster", label: "Hero source" }],
    };

    expect(
      getFilteredLayerEditorTree({
        document: sourceDocument,
        query: "",
      }),
    ).toEqual(
      expect.objectContaining({
        hasFilter: false,
        hasMatches: true,
        treeItems: [
          { id: "content", kind: "group", key: "group:content" },
          { id: "background", kind: "layer", key: "layer:background" },
          { id: "labels", kind: "layer", key: "layer:labels" },
        ],
        visibleLayerIds: ["background", "labels"],
      }),
    );

    const groupResult = getFilteredLayerEditorTree({
      document: sourceDocument,
      query: " content ",
    });
    expect(groupResult.groups[0]).toEqual(
      expect.objectContaining({
        forceExpanded: true,
        layers: [expect.objectContaining({ id: "mask" })],
      }),
    );
    expect(groupResult.visibleLayerIds).toEqual(["mask"]);

    expect(
      getFilteredLayerEditorTree({
        document: sourceDocument,
        query: "raster",
      }).ungroupedLayers.map((layer) => layer.id),
    ).toEqual(["background"]);

    const filterLayer = vi.fn(({ layer, query, source }) => {
      expect(query).toBe("custom");
      return layer.id === "labels" && source === null;
    });
    const filterGroup = vi.fn(({ query }) => {
      expect(query).toBe("custom");
      return false;
    });
    expect(
      getFilteredLayerEditorTree({
        document: sourceDocument,
        filterGroup,
        filterLayer,
        query: " Custom ",
      }).visibleLayerIds,
    ).toEqual(["labels"]);
    expect(filterGroup).toHaveBeenCalledWith(
      expect.objectContaining({ group: expect.objectContaining({ id: "content" }) }),
    );
    expect(filterLayer).toHaveBeenCalledWith(
      expect.objectContaining({ layer: expect.objectContaining({ id: "labels" }) }),
    );
  });

  test("resolves keyboard selection helpers", () => {
    const visibleLayerIds = ["background", "mask", "labels", "overlay"];
    expect(
      resolveLayerSelectionAnchor(
        "mask",
        { layerIds: ["overlay"], primaryLayerId: "overlay" },
        visibleLayerIds,
        "labels",
      ),
    ).toBe("mask");
    expect(
      resolveLayerSelectionAnchor(
        "missing",
        { layerIds: ["overlay"], primaryLayerId: "overlay" },
        visibleLayerIds,
        "labels",
      ),
    ).toBe("overlay");
    expect(
      resolveLayerSelectionAnchor(
        null,
        { layerIds: [], primaryLayerId: null },
        visibleLayerIds,
        "labels",
      ),
    ).toBe("labels");

    expect(getLayerSelectionRange(visibleLayerIds, "labels", "mask")).toEqual(["mask", "labels"]);
    expect(getLayerSelectionRange(visibleLayerIds, "missing", "mask")).toEqual(["mask"]);
    expect(mergeLayerSelections(["background", "mask"], ["mask", "labels"])).toEqual([
      "background",
      "mask",
      "labels",
    ]);
    expect(getRelativeVisibleLayerId(visibleLayerIds, "mask", 2)).toBe("overlay");
    expect(getRelativeVisibleLayerId(visibleLayerIds, "background", -1)).toBe("background");
    expect(getRelativeVisibleLayerId(visibleLayerIds, "missing", 1)).toBeNull();
  });

  test("detects editable keyboard targets", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label><input /></label>
      <div contenteditable="true"><span data-editable-child></span></div>
      <button type="button"></button>
    `;

    expect(isEditableKeyboardTarget(wrapper.querySelector("input") as HTMLInputElement)).toBe(true);
    expect(
      isEditableKeyboardTarget(wrapper.querySelector("[data-editable-child]") as Element),
    ).toBe(true);
    expect(isEditableKeyboardTarget(wrapper.querySelector("button") as HTMLButtonElement)).toBe(
      false,
    );
    expect(isEditableKeyboardTarget(new Event("keydown"))).toBe(false);
  });

  test("focuses tree items from DOM position and tree item keys", () => {
    const tree = document.createElement("div");
    tree.setAttribute("role", "tree");
    tree.innerHTML = `
      <div role="treeitem" data-layer-editor-tree-item-key="group:content" tabindex="0"></div>
      <div role="treeitem" data-layer-editor-tree-item-key="layer:mask" tabindex="-1"></div>
      <div role="treeitem" data-layer-editor-tree-item-key="layer:background" tabindex="-1"></div>
    `;
    document.body.append(tree);

    const [groupItem, maskItem, backgroundItem] = Array.from(
      tree.querySelectorAll<HTMLElement>("[role='treeitem']"),
    );
    const onTreeItemFocus = vi.fn();

    focusRelativeTreeItem(groupItem, 1, onTreeItemFocus);
    expect(document.activeElement).toBe(maskItem);
    expect(onTreeItemFocus).toHaveBeenLastCalledWith("layer:mask");

    focusEdgeTreeItem(maskItem, "last", onTreeItemFocus);
    expect(document.activeElement).toBe(backgroundItem);
    expect(onTreeItemFocus).toHaveBeenLastCalledWith("layer:background");

    expect(getTreeItemElement(groupItem, "layer:background")).toBe(backgroundItem);

    tree.remove();
  });
});
