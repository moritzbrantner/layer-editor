import {
  Field,
  FieldLabel,
  Input,
  NativeSelect,
  NativeSelectOption,
  Separator,
  Slider,
} from "@moritzbrantner/ui";
import {
  layerEditorBlendModes,
  updateLayerEditorLayer,
  type LayerEditorBlendMode,
  type LayerEditorLayer,
} from "@moritzbrantner/layer-editor";

import type { ExampleDocument, ExampleLayerData } from "./example-types";
import { normalizeColorValue, stringStyle } from "./example-utils";

export function LayerControls({
  document,
  layer,
  onDocumentChange,
}: {
  document: ExampleDocument;
  layer: LayerEditorLayer<ExampleLayerData> | null;
  onDocumentChange: (document: ExampleDocument) => void;
}) {
  if (!layer) {
    return (
      <section className="layer-controls">
        <h2>Layer</h2>
        <Separator />
        <p className="empty-state">Select a layer.</p>
      </section>
    );
  }

  const disabled = layer.locked ?? false;

  const patchLayer = (patch: Partial<LayerEditorLayer<ExampleLayerData>>) => {
    onDocumentChange(updateLayerEditorLayer(document, layer.id, patch));
  };

  const patchStyle = (stylePatch: Record<string, string | number>) => {
    patchLayer({
      style: {
        ...layer.style,
        ...stylePatch,
      },
    });
  };

  return (
    <section className="layer-controls">
      <h2>Layer</h2>
      <Separator />
      <Field>
        <FieldLabel htmlFor="layer-name">Name</FieldLabel>
        <Input
          id="layer-name"
          disabled={disabled}
          type="text"
          value={layer.label}
          onChange={(event) => patchLayer({ label: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>Opacity</FieldLabel>
        <Slider
          disabled={disabled}
          max={1}
          min={0}
          step={0.05}
          thumbAriaLabel="Layer opacity"
          value={[layer.opacity ?? 1]}
          onValueChange={(value) => {
            const [opacity = 1] = value;
            patchLayer({ opacity });
          }}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="layer-blend">Blend</FieldLabel>
        <NativeSelect
          id="layer-blend"
          disabled={disabled}
          value={layer.blendMode ?? "normal"}
          onChange={(event) =>
            patchLayer({ blendMode: event.target.value as LayerEditorBlendMode })
          }
        >
          {layerEditorBlendModes.map((blendMode) => (
            <NativeSelectOption key={blendMode} value={blendMode}>
              {blendMode}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <div className="color-row">
        <Field>
          <FieldLabel htmlFor="layer-fill">Fill</FieldLabel>
          <input
            id="layer-fill"
            disabled={disabled}
            type="color"
            value={stringStyle(layer, "fill", "#2f6f5e")}
            onChange={(event) => patchStyle({ fill: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="layer-stroke">Stroke</FieldLabel>
          <input
            id="layer-stroke"
            disabled={disabled}
            type="color"
            value={normalizeColorValue(stringStyle(layer, "stroke", "#18312c"))}
            onChange={(event) => patchStyle({ stroke: event.target.value })}
          />
        </Field>
      </div>
      {layer.data?.kind === "image-label" ? (
        <Field>
          <FieldLabel htmlFor="layer-text">Text</FieldLabel>
          <Input
            id="layer-text"
            disabled={disabled}
            type="text"
            value={layer.data.text}
            onChange={(event) =>
              patchLayer({
                data: { kind: "image-label", text: event.target.value },
              })
            }
          />
        </Field>
      ) : null}
    </section>
  );
}
