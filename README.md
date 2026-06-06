# @moritzbrantner/layer-editor

Standalone layer document primitives and a small React layer panel for generic
visual composition tools.

```sh
bun add @moritzbrantner/layer-editor
```

## Core

```ts
import {
  addLayerEditorLayer,
  createLayerEditorDocument,
  duplicateLayerEditorLayers,
  groupLayerEditorLayers,
  removeLayerEditorLayers,
} from "@moritzbrantner/layer-editor";

const document = createLayerEditorDocument({
  layers: [
    {
      id: "background",
      kind: "image",
      label: "Background",
    },
  ],
});

const nextDocument = addLayerEditorLayer(document, {
  id: "labels",
  kind: "text",
  label: "Labels",
});

const groupedDocument = groupLayerEditorLayers(nextDocument, {
  id: "content",
  label: "Content",
  layerIds: ["background", "labels"],
});

const duplicatedDocument = duplicateLayerEditorLayers(groupedDocument, ["labels"]);
const cleanedDocument = removeLayerEditorLayers(duplicatedDocument, ["background"]);
```

Documents model ordered layers, groups, sources, visibility, locking, opacity,
blend mode, optional bounds, optional styles, and optional domain data.

## History

```ts
import {
  commitLayerEditorHistory,
  createLayerEditorHistory,
  undoLayerEditorHistory,
} from "@moritzbrantner/layer-editor/history";

let history = createLayerEditorHistory(document);
history = commitLayerEditorHistory(history, nextDocument);
history = undoLayerEditorHistory(history);
```

React panels can also be controlled with the same history state:

```tsx
const [history, setHistory] = useState(() => createLayerEditorHistory(document));

<LayerEditorPanel
  document={history.present}
  features={{ historyControls: true }}
  history={history}
  onHistoryChange={setHistory}
/>;
```

## Serialization

```ts
import {
  parseLayerEditorDocument,
  serializeLayerEditorDocument,
} from "@moritzbrantner/layer-editor/serialization";

const stored = serializeLayerEditorDocument(document);
const restored = parseLayerEditorDocument(stored);
```

## React

```tsx
import { useState } from "react";
import "@moritzbrantner/ui/studio/styles.css";
import "@moritzbrantner/layer-editor/styles.css";
import {
  LayerEditorPanel,
  type LayerEditorDocument,
  type LayerEditorSelection,
} from "@moritzbrantner/layer-editor";

export function LayersPanel({ initialDocument }: { initialDocument: LayerEditorDocument }) {
  const [document, setDocument] = useState(initialDocument);
  const [selection, setSelection] = useState<LayerEditorSelection>({ layerIds: [] });

  return (
    <LayerEditorPanel
      createLayer={({ existingIds }) => ({
        id: existingIds.has("layer") ? "layer-2" : "layer",
        kind: "shape",
        label: "Layer",
      })}
      document={document}
      selection={selection}
      onDocumentChange={setDocument}
      onSelectionChange={setSelection}
    />
  );
}
```

The panel includes generic layer-tree editing: add, duplicate, delete, group,
rename, reorder, visibility, locking, optional undo/redo controls, keyboard
commands, and layer/group menus. Domain-specific previews and inspectors remain
host responsibility. Map, canvas, SVG, timeline, or domain-specific renderers
should consume the document and live in host packages or future adapter
packages.

Custom menu content can be added with `renderLayerActions` and
`renderGroupActions`.

## Migration

`onLayerMenuClick` was removed. Use `renderLayerActions` for custom layer menu
items and `features={{ layerMenus: false }}` if a host wants to hide the
built-in layer menu entirely.
