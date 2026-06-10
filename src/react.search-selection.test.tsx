import { fireEvent, render, screen } from "@testing-library/react";

import { LayerEditorPanel } from "./react";
import { document, rangeDocument } from "./react-test-fixtures";
import type { LayerEditorDocument } from "./core";

describe("@moritzbrantner/layer-editor React panel search and range selection", () => {
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
