import {
  commitLayerEditorHistory,
  createLayerEditorHistory,
  redoLayerEditorHistory,
  resetLayerEditorHistory,
  undoLayerEditorHistory,
} from "./history";
import { updateLayerEditorLayer, type LayerEditorDocument } from "./core";

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

  test("skips equivalent commits", () => {
    const history = createLayerEditorHistory(document);
    expect(commitLayerEditorHistory(history, document)).toBe(history);
  });
});
