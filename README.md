# @moritzbrantner/layer-editor

Standalone layer document primitives and a small React layer panel for generic
visual composition tools.

```sh
bun add @moritzbrantner/layer-editor
```

## Core

```ts
import { createLayerEditorDocument, addLayerEditorLayer } from "@moritzbrantner/layer-editor";

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
      document={document}
      selection={selection}
      onDocumentChange={setDocument}
      onSelectionChange={setSelection}
    />
  );
}
```

The package intentionally does not render a scene. Map, canvas, SVG, timeline,
or domain-specific renderers should consume the document and live in host
packages or future adapter packages.
