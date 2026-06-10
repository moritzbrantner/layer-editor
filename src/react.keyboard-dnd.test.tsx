import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LayerEditorPanel } from "./react";
import { createDataTransfer, document, maskSelection } from "./react-test-fixtures";
import type { LayerEditorDocument } from "./core";

describe("@moritzbrantner/layer-editor React panel keyboard and drag-drop", () => {
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
});
