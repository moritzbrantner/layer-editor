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
  getLayerEditorRenderStack,
  groupLayerEditorLayers,
  patchLayerEditorLayerBounds,
  removeLayerEditorLayers,
  setLayerEditorLayersOpacity,
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
  opacity: 0.85,
  blendMode: "multiply",
});

const duplicatedDocument = duplicateLayerEditorLayers(groupedDocument, ["labels"]);
const cleanedDocument = removeLayerEditorLayers(duplicatedDocument, ["background"]);
const fadedDocument = setLayerEditorLayersOpacity(cleanedDocument, ["labels"], 0.6);
const positionedDocument = patchLayerEditorLayerBounds(fadedDocument, "labels", {
  x: 120,
  y: 80,
});

const renderStack = getLayerEditorRenderStack(positionedDocument);
```

Documents model ordered layers, groups, sources, visibility, locking, opacity,
blend mode, optional bounds, optional styles, and optional domain data.

Groups also model visibility, locking, opacity, and blend mode. Renderers can use
`getLayerEditorRenderStack` or `resolveLayerEditorLayer` to consume effective
layer state without duplicating group/source lookup logic.

Host renderers should use the resolved stack for canvas, SVG, export, or preview
flows, while keeping domain-specific drawing in the host package:

```ts
const stack = getLayerEditorRenderStack(document, {
  includeHidden: false,
  order: "document",
});

for (const entry of stack) {
  renderLayer({
    layer: entry.layer,
    source: entry.source,
    visible: entry.effectiveVisible,
    locked: entry.effectiveLocked,
    opacity: entry.effectiveOpacity,
    blendMode: entry.effectiveBlendMode,
    bounds: entry.layer.bounds,
    style: entry.layer.style,
  });
}
```

Use `includeHidden` and `includeLocked` to choose whether editor-only, preview,
and export flows include filtered layers.

Batch helpers are available for common multi-layer edits:
`updateLayerEditorLayers`, `setLayerEditorLayersVisibility`,
`setLayerEditorLayersLocked`, `setLayerEditorLayersOpacity`,
`setLayerEditorLayersBlendMode`, `patchLayerEditorLayersStyle`, and
`patchLayerEditorLayersBounds`.

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

Serialized documents use schema version 2. Version 1 wrapped documents are read
through a built-in migration and normalize missing group visual fields to
`visible: true`, `locked: false`, `opacity: 1`, and `blendMode: "normal"`.

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

### 0.2.0

Serialized documents now use schema version 2. Version 1 wrapped documents parse
automatically through the built-in migration path.

Groups now normalize `visible`, `locked`, `opacity`, and `blendMode`. Invalid
layer or group blend modes are reported by strict validation.

### 0.1.x

`onLayerMenuClick` was removed. Use `renderLayerActions` for custom layer menu
items and `features={{ layerMenus: false }}` if a host wants to hide the
built-in layer menu entirely.
