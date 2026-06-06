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
});
