import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import { createLayerEditorHistory } from "./history";
import { LayerEditorPanel } from "./react";
import type { LayerEditorDocument, LayerEditorSelection } from "./core";

const document: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask", opacity: 0.5 },
  ],
};

const maskSelection = {
  layerIds: ["mask"],
  primaryLayerId: "mask",
} satisfies LayerEditorSelection;

const rangeDocument: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask", "labels"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask" },
    { id: "labels", kind: "text", label: "Labels" },
    { id: "overlay", kind: "shape", label: "Overlay" },
  ],
};

function createDataTransfer(layerId: string) {
  const data = new Map<string, string>();
  data.set("text/plain", layerId);

  return {
    effectAllowed: "none",
    getData: vi.fn((key: string) => data.get(key) ?? ""),
    setData: vi.fn((key: string, value: string) => data.set(key, value)),
  } as unknown as DataTransfer;
}

describe("@moritzbrantner/layer-editor React panel", () => {
  test("renders groups, layers, and toolbar by default", () => {
    render(<LayerEditorPanel document={document} />);

    expect(screen.getByRole("group", { name: "Content" })).toBeTruthy();
    expect(screen.getByText("Mask")).toBeTruthy();
    expect(screen.getByText("Background")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByRole("toolbar")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add layer" })).toBeTruthy();
  });

  test("emits selection changes", () => {
    const onSelectionChange = vi.fn();
    render(<LayerEditorPanel document={document} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByText("Mask"));

    expect(onSelectionChange).toHaveBeenCalledWith({
      layerIds: ["mask"],
      primaryLayerId: "mask",
    });
  });

  test("adds layers with the creation hook", () => {
    const onDocumentChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        createLayer={({ existingIds }) => ({
          id: existingIds.has("custom") ? "custom-2" : "custom",
          kind: "custom",
          label: "Custom",
        })}
        document={document}
        onDocumentChange={onDocumentChange}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "custom" })]),
      }),
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["custom"],
      primaryLayerId: "custom",
    });
  });

  test("duplicates selected layers from the toolbar", () => {
    const onDocumentChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        selection={maskSelection}
        onDocumentChange={onDocumentChange}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Duplicate selected layers" }));

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: [
          expect.objectContaining({ id: "background" }),
          expect.objectContaining({ id: "mask" }),
          expect.objectContaining({ id: "mask-copy" }),
        ],
      }),
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["mask-copy"],
      primaryLayerId: "mask-copy",
    });
  });

  test("deletes selected layers and normalizes selection", () => {
    const onDocumentChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        selection={maskSelection}
        onDocumentChange={onDocumentChange}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete selected layers" }));

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: [expect.objectContaining({ id: "background" })],
      }),
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["background"],
      primaryLayerId: "background",
    });
  });

  test("groups selected layers from the toolbar", () => {
    const onDocumentChange = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={{ layers: document.layers }}
        selection={{ layerIds: ["background", "mask"], primaryLayerId: "background" }}
        onDocumentChange={onDocumentChange}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Group selected layers" }));

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: [expect.objectContaining({ id: "group", layerIds: ["background", "mask"] })],
      }),
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      groupIds: ["group"],
      layerIds: ["background", "mask"],
      primaryLayerId: "mask",
    });
  });

  test("shows built-in layer menu actions and custom layer actions", () => {
    const onDocumentChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        renderLayerActions={({ layer }) => <div role="menuitem">Custom action {layer.label}</div>}
        onDocumentChange={onDocumentChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Layer menu Mask" }));

    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Custom action Mask" })).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: "Hide" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask", visible: false })]),
      }),
    );
  });

  test("renames layers by double clicking the label", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    fireEvent.doubleClick(screen.getByText("Mask"));
    fireEvent.change(screen.getByRole("textbox", { name: "Rename Mask" }), {
      target: { value: "Clip Mask" },
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Rename Mask" }), { key: "Enter" });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "mask", label: "Clip Mask" }),
        ]),
      }),
    );
  });

  test("supports group menu actions", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Group menu Content" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Ungroup" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "mask", parentGroupId: undefined }),
        ]),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Group menu Content" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete group only" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask" })]),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Group menu Content" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete group and layers" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: [expect.objectContaining({ id: "background" })],
      }),
    );
  });

  test("collapses and expands groups", () => {
    function StatefulPanel() {
      const [state, setState] = useState(document);
      return <LayerEditorPanel document={state} onDocumentChange={setState} />;
    }

    render(<StatefulPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Collapse Content" }));
    expect(screen.queryByText("Mask")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Expand Content" }));
    expect(screen.getByText("Mask")).toBeTruthy();
  });

  test("moves keyboard focus through visible tree items", () => {
    render(<LayerEditorPanel document={document} />);

    const contentRow = screen
      .getByRole("button", { name: "Collapse Content" })
      .closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    expect(contentRow).toBeTruthy();
    expect(maskRow).toBeTruthy();
    expect(backgroundRow).toBeTruthy();

    (contentRow as HTMLElement).focus();
    fireEvent.keyDown(contentRow as Element, { key: "ArrowDown" });
    expect(globalThis.document.activeElement).toBe(maskRow);

    fireEvent.keyDown(maskRow as Element, { key: "End" });
    expect(globalThis.document.activeElement).toBe(backgroundRow);

    fireEvent.keyDown(backgroundRow as Element, { key: "Home" });
    expect(globalThis.document.activeElement).toBe(contentRow);
  });

  test("handles keyboard duplicate, group, and delete commands", () => {
    const onDocumentChange = vi.fn();
    const ungroupedDocument = { layers: document.layers } satisfies LayerEditorDocument;
    render(
      <LayerEditorPanel
        document={ungroupedDocument}
        selection={maskSelection}
        onDocumentChange={onDocumentChange}
      />,
    );

    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(maskRow).toBeTruthy();

    fireEvent.keyDown(maskRow as Element, { ctrlKey: true, key: "d" });
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask-copy" })]),
      }),
    );

    fireEvent.keyDown(maskRow as Element, { ctrlKey: true, key: "g" });
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: expect.arrayContaining([expect.objectContaining({ id: "group" })]),
      }),
    );

    fireEvent.keyDown(maskRow as Element, { key: "Delete" });
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: [expect.objectContaining({ id: "background" })],
      }),
    );
  });

  test("keyboard commands do not fire while editing labels", async () => {
    const onDocumentChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        selection={maskSelection}
        onDocumentChange={onDocumentChange}
      />,
    );

    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(maskRow).toBeTruthy();

    (maskRow as HTMLElement).focus();
    fireEvent.keyDown(maskRow as Element, { key: "F2" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Rename Mask" }), {
      ctrlKey: true,
      key: "d",
    });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Rename Mask" }), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Rename Mask" })).toBeNull());
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  test("history controls call history and document handlers", () => {
    const history = createLayerEditorHistory(document);
    const onDocumentChange = vi.fn();
    const onHistoryChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        features={{ historyControls: true }}
        history={history}
        onDocumentChange={onDocumentChange}
        onHistoryChange={onHistoryChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add layer" }));

    expect(onHistoryChange).toHaveBeenCalledTimes(1);
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "layer" })]),
      }),
    );
  });

  test("read-only panel disables mutation controls", () => {
    const onDocumentChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        selection={maskSelection}
        readOnly={true}
        onDocumentChange={onDocumentChange}
      />,
    );

    const addButton = screen.getByRole("button", { name: "Add layer" });
    const hideButton = screen.getByRole("button", { name: "Hide Mask" });
    expect((addButton as HTMLButtonElement).disabled).toBe(true);
    expect((hideButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(addButton);
    fireEvent.keyDown(screen.getByText("Mask").closest('[role="treeitem"]') as Element, {
      key: "Delete",
    });

    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  test("moves an ungrouped layer onto a group header", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const groupRow = screen
      .getByRole("button", { name: "Collapse Content" })
      .closest('[role="treeitem"]');
    expect(backgroundRow).toBeTruthy();
    expect(groupRow).toBeTruthy();

    const dataTransfer = createDataTransfer("background");
    fireEvent.dragStart(backgroundRow as Element, { dataTransfer });
    fireEvent.dragOver(groupRow as Element, { dataTransfer });
    fireEvent.drop(groupRow as Element, { dataTransfer });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: [expect.objectContaining({ id: "content", layerIds: ["mask", "background"] })],
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "background", parentGroupId: "content" }),
        ]),
      }),
    );
  });

  test("moves a layer into an empty group drop zone", () => {
    const onDocumentChange = vi.fn();
    const emptyGroupDocument: LayerEditorDocument = {
      groups: [{ id: "empty", label: "Empty", layerIds: [] }],
      layers: [{ id: "background", kind: "image", label: "Background" }],
    };
    render(<LayerEditorPanel document={emptyGroupDocument} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const dataTransfer = createDataTransfer("background");
    fireEvent.dragStart(backgroundRow as Element, { dataTransfer });
    fireEvent.dragOver(screen.getByLabelText("Drop layer into Empty"), { dataTransfer });
    fireEvent.drop(screen.getByLabelText("Drop layer into Empty"), { dataTransfer });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: [expect.objectContaining({ id: "empty", layerIds: ["background"] })],
        layers: [expect.objectContaining({ id: "background", parentGroupId: "empty" })],
      }),
    );
  });

  test("moves a grouped layer to the root drop zone", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    const dataTransfer = createDataTransfer("mask");
    fireEvent.dragStart(maskRow as Element, { dataTransfer });
    fireEvent.dragOver(screen.getByLabelText("Drop layer at root"), { dataTransfer });
    fireEvent.drop(screen.getByLabelText("Drop layer at root"), { dataTransfer });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "mask", parentGroupId: undefined }),
        ]),
      }),
    );
  });

  test("keeps existing layer-to-layer drop behavior", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(backgroundRow).toBeTruthy();
    expect(maskRow).toBeTruthy();

    vi.spyOn(maskRow as HTMLElement, "getBoundingClientRect").mockReturnValue({
      bottom: 40,
      height: 40,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const dataTransfer = createDataTransfer("background");
    fireEvent.dragStart(backgroundRow as Element, { dataTransfer });
    fireEvent.dragOver(maskRow as Element, { clientY: 1, dataTransfer });
    fireEvent.drop(maskRow as Element, { dataTransfer });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: [expect.objectContaining({ id: "content", layerIds: ["mask", "background"] })],
        layers: [
          expect.objectContaining({ id: "mask" }),
          expect.objectContaining({ id: "background", parentGroupId: "content" }),
        ],
      }),
    );
  });

  test("read-only panel ignores new drop targets", () => {
    const onDocumentChange = vi.fn();
    render(
      <LayerEditorPanel document={document} readOnly={true} onDocumentChange={onDocumentChange} />,
    );

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const groupRow = screen
      .getByRole("button", { name: "Collapse Content" })
      .closest('[role="treeitem"]');
    const dataTransfer = createDataTransfer("background");
    fireEvent.dragStart(backgroundRow as Element, { dataTransfer });
    fireEvent.dragOver(groupRow as Element, { dataTransfer });
    fireEvent.drop(groupRow as Element, { dataTransfer });

    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  test("does not render search by default", () => {
    render(<LayerEditorPanel document={document} />);

    expect(screen.queryByRole("searchbox", { name: "Search layers" })).toBeNull();
  });

  test("renders optional search and filters by layer label", () => {
    render(<LayerEditorPanel document={document} features={{ search: true }} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "mask" },
    });

    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("Mask")).toBeTruthy();
    expect(screen.queryByText("Background")).toBeNull();
  });

  test("default search filters by layer kind and source fields", () => {
    const sourceDocument: LayerEditorDocument = {
      layers: [
        { id: "photo", kind: "image", label: "Photo", sourceId: "asset" },
        { id: "caption", kind: "text", label: "Caption" },
      ],
      sources: [{ id: "asset", kind: "raster", label: "Hero source" }],
    };
    render(<LayerEditorPanel document={sourceDocument} features={{ search: true }} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "raster" },
    });
    expect(screen.getByText("Photo")).toBeTruthy();
    expect(screen.queryByText("Caption")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "text" },
    });
    expect(screen.getByText("Caption")).toBeTruthy();
    expect(screen.queryByText("Photo")).toBeNull();
  });

  test("matching groups show children without mutating collapse state", () => {
    const onDocumentChange = vi.fn();
    const collapsedDocument: LayerEditorDocument = {
      groups: [{ collapsed: true, id: "content", label: "Content", layerIds: ["mask"] }],
      layers: [{ id: "mask", kind: "mask", label: "Mask" }],
    };
    render(
      <LayerEditorPanel
        document={collapsedDocument}
        features={{ search: true }}
        onDocumentChange={onDocumentChange}
      />,
    );

    expect(screen.queryByText("Mask")).toBeNull();
    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "content" },
    });

    expect(screen.getByText("Mask")).toBeTruthy();
    expect(onDocumentChange).not.toHaveBeenCalled();
  });

  test("search reports no matches", () => {
    render(<LayerEditorPanel document={document} features={{ search: true }} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "missing" },
    });

    expect(screen.getByText("No matching layers.")).toBeTruthy();
  });

  test("supports controlled search and custom layer filters", () => {
    const onFilterQueryChange = vi.fn();
    render(
      <LayerEditorPanel
        document={document}
        features={{ search: true }}
        filterLayer={({ layer }) => layer.id === "background"}
        filterQuery="custom"
        onFilterQueryChange={onFilterQueryChange}
      />,
    );

    expect(screen.getByText("Background")).toBeTruthy();
    expect(screen.queryByText("Mask")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search layers" }), {
      target: { value: "next" },
    });
    expect(onFilterQueryChange).toHaveBeenLastCalledWith("next");
  });

  test("shift-click selects a visible layer range", () => {
    const onSelectionChange = vi.fn();
    render(<LayerEditorPanel document={rangeDocument} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByText("Mask"));
    fireEvent.click(screen.getByText("Overlay"), { shiftKey: true });

    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["mask", "labels", "background", "overlay"],
      primaryLayerId: "overlay",
    });
  });

  test("shift-control-click unions a visible layer range", () => {
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={rangeDocument}
        selection={{ layerIds: ["background", "mask"], primaryLayerId: "mask" }}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByText("Overlay"), { ctrlKey: true, shiftKey: true });

    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["background", "mask", "labels", "overlay"],
      primaryLayerId: "overlay",
    });
  });

  test("range selection skips collapsed and filtered-out layers", () => {
    const onCollapsedSelectionChange = vi.fn();
    const collapsedDocument: LayerEditorDocument = {
      ...rangeDocument,
      groups: [{ collapsed: true, id: "content", label: "Content", layerIds: ["mask", "labels"] }],
    };
    const { unmount } = render(
      <LayerEditorPanel
        document={collapsedDocument}
        selection={{ layerIds: ["background"], primaryLayerId: "background" }}
        onSelectionChange={onCollapsedSelectionChange}
      />,
    );

    fireEvent.click(screen.getByText("Overlay"), { shiftKey: true });
    expect(onCollapsedSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["background", "overlay"],
      primaryLayerId: "overlay",
    });

    unmount();

    const onFilteredSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={rangeDocument}
        features={{ search: true }}
        filterQuery="o"
        selection={{ layerIds: ["background"], primaryLayerId: "background" }}
        onSelectionChange={onFilteredSelectionChange}
      />,
    );

    fireEvent.click(screen.getByText("Overlay"), { shiftKey: true });
    expect(onFilteredSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["background", "overlay"],
      primaryLayerId: "overlay",
    });
  });

  test("shift-arrow selects visible ranges and skips group headers", () => {
    const onSelectionChange = vi.fn();
    render(
      <LayerEditorPanel
        document={rangeDocument}
        selection={{ layerIds: ["mask"], primaryLayerId: "mask" }}
        onSelectionChange={onSelectionChange}
      />,
    );

    const contentRow = screen
      .getByRole("button", { name: "Collapse Content" })
      .closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    const labelsRow = screen.getByText("Labels").closest('[role="treeitem"]');
    expect(contentRow).toBeTruthy();
    expect(maskRow).toBeTruthy();
    expect(labelsRow).toBeTruthy();

    fireEvent.keyDown(contentRow as Element, { key: "ArrowDown", shiftKey: true });
    expect(onSelectionChange).not.toHaveBeenCalled();

    (maskRow as HTMLElement).focus();
    fireEvent.keyDown(maskRow as Element, { key: "ArrowDown", shiftKey: true });
    expect(globalThis.document.activeElement).toBe(labelsRow);
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["mask", "labels"],
      primaryLayerId: "labels",
    });

    fireEvent.keyDown(labelsRow as Element, { key: "ArrowUp", shiftKey: true });
    expect(globalThis.document.activeElement).toBe(maskRow);
    expect(onSelectionChange).toHaveBeenLastCalledWith({
      layerIds: ["mask"],
      primaryLayerId: "mask",
    });
  });
});
