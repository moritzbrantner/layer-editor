import {
  EditorInspector,
  EditorInspectorContent,
  EditorPaneContent,
  Input,
  NativeSelect,
  NativeSelectOption,
  NumericInput,
  PropertyRow,
  PropertySection,
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
  selectedCount,
  onDocumentChange,
}: {
  document: ExampleDocument;
  layer: LayerEditorLayer<ExampleLayerData> | null;
  selectedCount: number;
  onDocumentChange: (document: ExampleDocument) => void;
}) {
  if (!layer) {
    return (
      <EditorPaneContent>
        <p className="m-0 text-sm text-muted-foreground">
          No layer selected · {document.layers.length} layers in document
        </p>
      </EditorPaneContent>
    );
  }

  const disabled = layer.locked ?? false;
  const opacityPercent = Math.round((layer.opacity ?? 1) * 1000) / 10;

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

  const selectionSummary =
    selectedCount > 1 ? `${selectedCount} layers selected · editing primary` : null;

  return (
    <EditorInspector className="bg-transparent" label={`${layer.label} properties`}>
      <EditorInspectorContent>
        {selectionSummary || disabled ? (
          <p className="m-0 py-1 text-xs text-muted-foreground">
            {[selectionSummary, disabled ? "Locked" : null].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <PropertySection title="Layer">
          <div className="grid gap-2">
            <PropertyRow htmlFor="layer-name" label="Name">
              <Input
                id="layer-name"
                disabled={disabled}
                type="text"
                value={layer.label}
                onChange={(event) => patchLayer({ label: event.target.value })}
              />
            </PropertyRow>
            {layer.data?.kind === "image-label" ? (
              <PropertyRow htmlFor="layer-text" label="Text">
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
              </PropertyRow>
            ) : null}
          </div>
        </PropertySection>
        <PropertySection title="Compositing">
          <div className="grid gap-2">
            <PropertyRow htmlFor="layer-opacity" label="Opacity">
              <div className="grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-2">
                <Slider
                  disabled={disabled}
                  max={1}
                  min={0}
                  step={0.05}
                  thumbAriaLabel="Layer opacity slider"
                  value={[layer.opacity ?? 1]}
                  onValueChange={(value) => {
                    const [opacity = 1] = value;
                    patchLayer({ opacity });
                  }}
                />
                <NumericInput
                  id="layer-opacity"
                  disabled={disabled}
                  displayPrecision={1}
                  max={100}
                  min={0}
                  step={5}
                  unit="%"
                  value={opacityPercent}
                  onValueChange={(value) => {
                    if (value !== null) {
                      patchLayer({ opacity: value / 100 });
                    }
                  }}
                />
              </div>
            </PropertyRow>
            <PropertyRow htmlFor="layer-blend" label="Blend">
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
            </PropertyRow>
          </div>
        </PropertySection>
        <PropertySection title="Style">
          <div className="grid grid-cols-2 gap-2">
            <PropertyRow htmlFor="layer-fill" label="Fill" orientation="vertical">
              <input
                className="color-input"
                id="layer-fill"
                disabled={disabled}
                type="color"
                value={stringStyle(layer, "fill", "#2f6f5e")}
                onChange={(event) => patchStyle({ fill: event.target.value })}
              />
            </PropertyRow>
            <PropertyRow htmlFor="layer-stroke" label="Stroke" orientation="vertical">
              <input
                className="color-input"
                id="layer-stroke"
                disabled={disabled}
                type="color"
                value={normalizeColorValue(stringStyle(layer, "stroke", "#18312c"))}
                onChange={(event) => patchStyle({ stroke: event.target.value })}
              />
            </PropertyRow>
          </div>
        </PropertySection>
      </EditorInspectorContent>
    </EditorInspector>
  );
}
