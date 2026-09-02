import {
  canRedoLayerEditorHistory,
  canUndoLayerEditorHistory,
  commitLayerEditorHistory,
  createLayerEditorHistory,
  redoLayerEditorHistory,
  resetLayerEditorHistory,
  undoLayerEditorHistory,
} from "./history";
import {
  setLayerEditorLayersOpacity,
  updateLayerEditorLayer,
  updateLayerEditorLayers,
  type LayerEditorDocument,
} from "./core";

const document: LayerEditorDocument = {
  layers: [{ id: "layer", kind: "shape", label: "Layer" }],
};

describe("@moritzbrantner/layer-editor history", () => {
  test("commits, undoes, redoes, and resets document state", () => {
    const history = createLayerEditorHistory(document);
    const nextDocument = updateLayerEditorLayer(document, "layer", { opacity: 0.4 });
    const committed = commitLayerEditorHistory(history, nextDocument);

    expect(committed.past).toHaveLength(1);
    expect(committed.present.layers[0]?.opacity).toBe(0.4);

    const undone = undoLayerEditorHistory(committed);
    expect(undone.present.layers[0]?.opacity).toBe(1);

    const redone = redoLayerEditorHistory(undone);
    expect(redone.present.layers[0]?.opacity).toBe(0.4);

    expect(resetLayerEditorHistory(nextDocument).past).toEqual([]);
  });

  test("reports undo and redo availability at each history boundary", () => {
    const initial = createLayerEditorHistory(document);
    expect(canUndoLayerEditorHistory(initial)).toBe(false);
    expect(canRedoLayerEditorHistory(initial)).toBe(false);

    const changed = updateLayerEditorLayer(document, "layer", { opacity: 0.7 });
    const committed = commitLayerEditorHistory(initial, changed);
    expect(canUndoLayerEditorHistory(committed)).toBe(true);
    expect(canRedoLayerEditorHistory(committed)).toBe(false);

    const undone = undoLayerEditorHistory(committed);
    expect(canUndoLayerEditorHistory(undone)).toBe(false);
    expect(canRedoLayerEditorHistory(undone)).toBe(true);

    const redone = redoLayerEditorHistory(undone);
    expect(canUndoLayerEditorHistory(redone)).toBe(true);
    expect(canRedoLayerEditorHistory(redone)).toBe(false);
  });

  test("reset clears both undo and redo history", () => {
    const changed = updateLayerEditorLayer(document, "layer", { opacity: 0.7 });
    const undone = undoLayerEditorHistory(
      commitLayerEditorHistory(createLayerEditorHistory(document), changed),
    );
    expect(undone.future).toHaveLength(1);

    const reset = resetLayerEditorHistory(undone.present);
    expect(reset.past).toEqual([]);
    expect(reset.future).toEqual([]);
    expect(canUndoLayerEditorHistory(reset)).toBe(false);
    expect(canRedoLayerEditorHistory(reset)).toBe(false);
  });

  test("skips equivalent commits", () => {
    const history = createLayerEditorHistory(document);
    expect(commitLayerEditorHistory(history, document)).toBe(history);
  });

  test("trims history to the configured limit", () => {
    const history = createLayerEditorHistory(document);
    const first = updateLayerEditorLayer(document, "layer", { opacity: 0.8 });
    const second = updateLayerEditorLayer(document, "layer", { opacity: 0.6 });
    const third = updateLayerEditorLayer(document, "layer", { opacity: 0.4 });

    const committed = [first, second, third].reduce(
      (currentHistory, nextDocument) =>
        commitLayerEditorHistory(currentHistory, nextDocument, { limit: 2 }),
      history,
    );

    expect(committed.past).toHaveLength(2);
    expect(committed.past[0]?.layers[0]?.opacity).toBe(0.8);
  });

  test("keeps at least one past entry for invalid history limits", () => {
    const history = createLayerEditorHistory(document);
    const first = updateLayerEditorLayer(document, "layer", { opacity: 0.8 });
    const second = updateLayerEditorLayer(document, "layer", { opacity: 0.6 });
    const committed = commitLayerEditorHistory(
      commitLayerEditorHistory(history, first, { limit: 0 }),
      second,
      { limit: 0 },
    );

    expect(committed.past).toHaveLength(1);
    expect(committed.past[0]?.layers[0]?.opacity).toBe(0.8);
  });

  test("clears future entries when committing after undo", () => {
    const first = updateLayerEditorLayer(document, "layer", { opacity: 0.8 });
    const second = updateLayerEditorLayer(document, "layer", { opacity: 0.6 });
    const undone = undoLayerEditorHistory(
      commitLayerEditorHistory(
        commitLayerEditorHistory(createLayerEditorHistory(document), first),
        second,
      ),
    );
    const next = updateLayerEditorLayer(undone.present, "layer", { opacity: 0.2 });
    const committed = commitLayerEditorHistory(undone, next);

    expect(undone.future).toHaveLength(1);
    expect(committed.future).toEqual([]);
  });

  test("skips no-op batch updates and records meaningful batch updates", () => {
    const history = createLayerEditorHistory(document);
    const noOpDocument = updateLayerEditorLayers(history.present, ["missing"], { opacity: 0.2 });
    const skipped = commitLayerEditorHistory(history, noOpDocument);
    expect(skipped).toBe(history);

    const nextDocument = setLayerEditorLayersOpacity(history.present, ["layer"], 0.4);
    const committed = commitLayerEditorHistory(history, nextDocument);
    expect(committed.past).toHaveLength(1);
    expect(committed.present.layers[0]?.opacity).toBe(0.4);
  });

  test("redo pushes current present into past", () => {
    const nextDocument = updateLayerEditorLayer(document, "layer", { opacity: 0.4 });
    const undone = undoLayerEditorHistory(
      commitLayerEditorHistory(createLayerEditorHistory(document), nextDocument),
    );
    const redone = redoLayerEditorHistory(undone);

    expect(redone.past.at(-1)?.layers[0]?.opacity).toBe(1);
    expect(redone.present.layers[0]?.opacity).toBe(0.4);
  });
});
