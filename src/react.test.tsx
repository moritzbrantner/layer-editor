import { fireEvent, render, screen } from "@testing-library/react";

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
});
