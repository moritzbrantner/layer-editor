import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";

import { LayerEditorPanel } from "./react";
import type { LayerEditorDocument } from "./core";

const document: LayerEditorDocument = {
  groups: [{ id: "content", label: "Content", layerIds: ["mask"] }],
  layers: [
    { id: "background", kind: "image", label: "Background" },
    { id: "mask", kind: "mask", label: "Mask", opacity: 0.5 },
  ],
};

describe("@moritzbrantner/layer-editor React panel", () => {
  test("renders groups and layers", () => {
    render(<LayerEditorPanel document={document} />);

    expect(screen.getByRole("group", { name: "Content" })).toBeTruthy();
    expect(screen.getByText("Mask")).toBeTruthy();
    expect(screen.getByText("Background")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
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

  test("emits document changes for visibility, locking, and reorder controls", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Hide Mask" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask", visible: false })]),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Lock Mask" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask", locked: true })]),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Move Mask up" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: [
          expect.objectContaining({ id: "mask" }),
          expect.objectContaining({ id: "background" }),
        ],
      }),
    );
  });

  test("emits document changes for drag reorder", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(backgroundRow).toBeTruthy();
    expect(maskRow).toBeTruthy();

    fireEvent.dragStart(backgroundRow as Element, {
      dataTransfer: {
        effectAllowed: "move",
        getData: () => "background",
        setData: vi.fn(),
      },
    });
    fireEvent.dragOver(maskRow as Element, {
      clientY: 1,
      dataTransfer: {
        getData: () => "background",
      },
    });
    fireEvent.drop(maskRow as Element, {
      dataTransfer: {
        getData: () => "background",
      },
    });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: [
          expect.objectContaining({ id: "mask" }),
          expect.objectContaining({ id: "background" }),
        ],
      }),
    );
  });

  test("moves ungrouped layers into groups during drag reorder", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(backgroundRow).toBeTruthy();
    expect(maskRow).toBeTruthy();

    fireEvent.dragStart(backgroundRow as Element, {
      dataTransfer: {
        effectAllowed: "move",
        getData: () => "background",
        setData: vi.fn(),
      },
    });
    fireEvent.dragOver(maskRow as Element, {
      clientY: 0,
      dataTransfer: {
        getData: () => "background",
      },
    });
    fireEvent.drop(maskRow as Element, {
      dataTransfer: {
        getData: () => "background",
      },
    });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: [expect.objectContaining({ id: "content", layerIds: ["mask", "background"] })],
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "background", parentGroupId: "content" }),
        ]),
      }),
    );
  });

  test("moves grouped layers out of groups during drag reorder", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    const backgroundRow = screen.getByText("Background").closest('[role="treeitem"]');
    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(backgroundRow).toBeTruthy();
    expect(maskRow).toBeTruthy();

    fireEvent.dragStart(maskRow as Element, {
      dataTransfer: {
        effectAllowed: "move",
        getData: () => "mask",
        setData: vi.fn(),
      },
    });
    fireEvent.dragOver(backgroundRow as Element, {
      clientY: 1,
      dataTransfer: {
        getData: () => "mask",
      },
    });
    fireEvent.drop(backgroundRow as Element, {
      dataTransfer: {
        getData: () => "mask",
      },
    });

    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        groups: undefined,
        layers: expect.arrayContaining([
          expect.objectContaining({ id: "mask", parentGroupId: undefined }),
        ]),
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

  test("emits layer menu clicks", () => {
    const onLayerMenuClick = vi.fn();
    render(<LayerEditorPanel document={document} onLayerMenuClick={onLayerMenuClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Layer menu Mask" }));

    expect(onLayerMenuClick).toHaveBeenCalledTimes(1);
    expect(onLayerMenuClick.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ id: "mask" }));
  });

  test("shows visibility and locking actions in the layer menu", () => {
    const onDocumentChange = vi.fn();
    render(<LayerEditorPanel document={document} onDocumentChange={onDocumentChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Layer menu Mask" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: "Hide" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask", visible: false })]),
      }),
    );
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Layer menu Mask" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Lock" }));
    expect(onDocumentChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        layers: expect.arrayContaining([expect.objectContaining({ id: "mask", locked: true })]),
      }),
    );
  });

  test("allows custom layer menu handlers to prevent the built-in menu", () => {
    render(
      <LayerEditorPanel
        document={document}
        onLayerMenuClick={(_, event) => event.preventDefault()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Layer menu Mask" }));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  test("read-only panel disables mutation controls", () => {
    const onDocumentChange = vi.fn();
    render(
      <LayerEditorPanel document={document} onDocumentChange={onDocumentChange} readOnly={true} />,
    );

    const hideButton = screen.getByRole("button", { name: "Hide Mask" });
    expect((hideButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(hideButton);
    expect(onDocumentChange).not.toHaveBeenCalled();
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

  test("read-only panel disables group collapse", () => {
    render(<LayerEditorPanel document={document} readOnly={true} />);

    const collapseButton = screen.getByRole("button", { name: "Collapse Content" });
    expect((collapseButton as HTMLButtonElement).disabled).toBe(true);
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

  test("selects focused layers with the keyboard", () => {
    const onSelectionChange = vi.fn();
    render(<LayerEditorPanel document={document} onSelectionChange={onSelectionChange} />);

    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(maskRow).toBeTruthy();

    (maskRow as HTMLElement).focus();
    fireEvent.keyDown(maskRow as Element, { key: "Enter" });

    expect(onSelectionChange).toHaveBeenCalledWith({
      layerIds: ["mask"],
      primaryLayerId: "mask",
    });
  });

  test("starts and cancels layer renaming from the keyboard", async () => {
    render(<LayerEditorPanel document={document} />);

    const maskRow = screen.getByText("Mask").closest('[role="treeitem"]');
    expect(maskRow).toBeTruthy();

    (maskRow as HTMLElement).focus();
    fireEvent.keyDown(maskRow as Element, { key: "F2" });
    expect(screen.getByRole("textbox", { name: "Rename Mask" })).toBeTruthy();

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Rename Mask" }), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Rename Mask" })).toBeNull());
    expect(globalThis.document.activeElement).toBe(maskRow);
  });
});
