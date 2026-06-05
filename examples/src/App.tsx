import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";

import {
  LayerEditorPanel,
  createLayerEditorDocument,
  layerEditorBlendModes,
  serializeLayerEditorDocument,
  updateLayerEditorLayer,
  type LayerEditorBlendMode,
  type LayerEditorDocument,
  type LayerEditorLayer,
  type LayerEditorSelection,
} from "@moritzbrantner/layer-editor";

type ExampleKey = "geojson" | "image" | "svg";

type GeoPoint = [number, number];

type GeoGeometry =
  | { type: "LineString"; coordinates: GeoPoint[] }
  | { type: "Point"; coordinates: GeoPoint }
  | { type: "Polygon"; coordinates: GeoPoint[][] };

type GeoFeature = {
  type: "Feature";
  geometry: GeoGeometry;
  properties?: {
    name?: string;
  };
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type ExampleSourceData =
  | {
      kind: "geojson";
      geojson: GeoFeatureCollection;
    }
  | {
      kind: "image";
      alt: string;
      src: string;
    };

type ExampleLayerData =
  | {
      kind: "geojson";
      symbol: "area" | "line" | "marker";
    }
  | {
      kind: "image";
    }
  | {
      kind: "image-label";
      text: string;
    }
  | {
      kind: "image-overlay";
    }
  | {
      kind: "svg-shape";
      shape: "circle" | "path" | "rect" | "text";
      path?: string;
      text?: string;
    };

type ExampleDocument = LayerEditorDocument<
  ExampleLayerData,
  Record<string, unknown>,
  ExampleSourceData
>;

type ExampleDocuments = Record<ExampleKey, ExampleDocument>;

const exampleLabels = {
  geojson: "GeoJSON",
  image: "Image",
  svg: "SVG",
} satisfies Record<ExampleKey, string>;

const initialSelection = {
  layerIds: [],
  primaryLayerId: null,
} satisfies LayerEditorSelection;

const panelClassName =
  "rounded-lg border border-[#c7cec6] bg-[#f6f7f2] shadow-[0_16px_50px_rgba(41,57,52,0.1)]";

function exampleTabClassName(active: boolean) {
  return [
    "min-h-10 rounded-md px-3.5 text-[#40514c] transition-colors",
    active ? "bg-[#263632] text-[#f7f4e8]" : "hover:bg-white/50",
  ].join(" ");
}

async function loadExampleDocuments(): Promise<ExampleDocuments> {
  const sampleImageSrc = createSampleImageDataUrl();

  return {
    geojson: createGeoJsonDocument(),
    image: createImageDocument(sampleImageSrc),
    svg: createSvgDocument(),
  };
}

export function App() {
  const examplesQuery = useQuery({
    queryFn: loadExampleDocuments,
    queryKey: ["layer-editor", "examples"],
  });
  const [activeExample, setActiveExample] = useState<ExampleKey>("geojson");
  const [documents, setDocuments] = useState<ExampleDocuments | null>(null);
  const [selections, setSelections] = useState<Record<ExampleKey, LayerEditorSelection>>({
    geojson: { layerIds: ["route"], primaryLayerId: "route" },
    image: { layerIds: ["caption"], primaryLayerId: "caption" },
    svg: { layerIds: ["wordmark"], primaryLayerId: "wordmark" },
  });

  useEffect(() => {
    if (examplesQuery.data && !documents) {
      setDocuments(examplesQuery.data);
    }
  }, [documents, examplesQuery.data]);

  if (examplesQuery.isError) {
    return (
      <ShellMessage
        title="Examples failed to load"
        detail={examplesQuery.error instanceof Error ? examplesQuery.error.message : undefined}
      />
    );
  }

  if (!documents) {
    return <ShellMessage title="Loading examples" />;
  }

  const document = documents[activeExample];
  const selection = selections[activeExample] ?? initialSelection;
  const selectedLayer =
    document.layers.find((layer) => layer.id === selection.primaryLayerId) ?? null;
  const setActiveDocument = (nextDocument: ExampleDocument) => {
    setDocuments((currentDocuments) =>
      currentDocuments
        ? {
            ...currentDocuments,
            [activeExample]: nextDocument,
          }
        : currentDocuments,
    );
  };

  return (
    <main className="min-h-screen bg-[#e8ece7] p-4 text-[#21302d] md:p-6">
      <header className="mx-auto mb-[18px] grid max-w-[1320px] gap-5 md:flex md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-[0.82rem] font-bold uppercase text-[#61726d]">
            @moritzbrantner/layer-editor
          </p>
          <h1 className="text-[clamp(2rem,5vw,4.2rem)] leading-[1.1] font-bold tracking-normal">
            Layer Editor Examples
          </h1>
        </div>
        <nav
          className="grid grid-cols-1 items-center gap-1 rounded-lg border border-[#c3cbc2] bg-[#d8ded7] p-1 sm:grid-cols-3"
          aria-label="Examples"
        >
          {(Object.keys(exampleLabels) as ExampleKey[]).map((example) => (
            <button
              key={example}
              aria-pressed={example === activeExample}
              className={exampleTabClassName(example === activeExample)}
              type="button"
              onClick={() => setActiveExample(example)}
            >
              {exampleLabels[example]}
            </button>
          ))}
        </nav>
      </header>

      <section
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_360px]"
        aria-label={`${exampleLabels[activeExample]} example`}
      >
        <section
          className={`${panelClassName} grid min-h-0 items-center overflow-hidden p-3 min-[960px]:min-h-[610px] min-[960px]:p-6`}
          aria-label="Layer preview"
        >
          <ExamplePreview document={document} example={activeExample} selection={selection} />
        </section>

        <aside className={`${panelClassName} grid gap-4 p-3.5`} aria-label="Layer controls">
          <LayerEditorPanel
            document={document}
            renderLayerMeta={renderLayerMeta}
            selection={selection}
            onDocumentChange={(nextDocument) => setActiveDocument(nextDocument as ExampleDocument)}
            onSelectionChange={(nextSelection) =>
              setSelections((currentSelections) => ({
                ...currentSelections,
                [activeExample]: nextSelection,
              }))
            }
          />
          <LayerControls
            document={document}
            layer={selectedLayer}
            onDocumentChange={setActiveDocument}
          />
        </aside>
      </section>

      <section
        className={`${panelClassName} mx-auto mt-4 hidden max-w-[1320px] overflow-hidden p-4 min-[560px]:block`}
        aria-label="Serialized document"
      >
        <h2 className="mb-3 text-base leading-[1.1] font-bold">Document</h2>
        <pre className="max-h-[340px] overflow-auto rounded-lg bg-[#202927] p-3.5 text-[0.8rem] text-[#edf3e7]">
          {JSON.stringify(serializeLayerEditorDocument(document), null, 2)}
        </pre>
      </section>
    </main>
  );
}

function ShellMessage({ detail, title }: { detail?: string; title: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#e8ece7] p-4 text-[#21302d]">
      <section className={`${panelClassName} w-full max-w-md p-6`}>
        <h1 className="text-2xl leading-[1.1] font-bold">{title}</h1>
        {detail ? <p className="mt-3 text-sm text-[#61726d]">{detail}</p> : null}
      </section>
    </main>
  );
}

function ExamplePreview({
  document,
  example,
  selection,
}: {
  document: ExampleDocument;
  example: ExampleKey;
  selection: LayerEditorSelection;
}) {
  if (example === "geojson") {
    return <GeoJsonPreview document={document} selection={selection} />;
  }

  if (example === "image") {
    return <ImagePreview document={document} selection={selection} />;
  }

  return <SvgPreview document={document} selection={selection} />;
}

function GeoJsonPreview({
  document,
  selection,
}: {
  document: ExampleDocument;
  selection: LayerEditorSelection;
}) {
  const renderedLayers = visibleLayers(document);

  return (
    <svg className="geo-preview" role="img" viewBox="0 0 760 480">
      <defs>
        <pattern id="street-grid" width="58" height="58" patternUnits="userSpaceOnUse">
          <path d="M 58 0 L 0 0 0 58" fill="none" stroke="#d5dde3" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="760" height="480" fill="#f4f2e9" />
      <rect width="760" height="480" fill="url(#street-grid)" opacity="0.75" />
      {renderedLayers.map((layer) => {
        const source = findSource(document, layer.sourceId);
        if (!source || !isGeoJsonSourceData(source.data)) {
          return null;
        }

        return (
          <g
            key={layer.id}
            className={selection.layerIds.includes(layer.id) ? "preview-selected" : undefined}
            opacity={layer.opacity ?? 1}
            style={{ mixBlendMode: layer.blendMode }}
          >
            {source.data.geojson.features.map((feature, index) => (
              <GeoFeatureShape key={`${layer.id}-${index}`} feature={feature} layer={layer} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function GeoFeatureShape({
  feature,
  layer,
}: {
  feature: GeoFeature;
  layer: LayerEditorLayer<ExampleLayerData>;
}) {
  const fill = stringStyle(layer, "fill", "#8fb7ad");
  const stroke = stringStyle(layer, "stroke", "#21443d");
  const strokeWidth = numberStyle(layer, "strokeWidth", 3);

  if (feature.geometry.type === "Polygon") {
    return (
      <path
        d={feature.geometry.coordinates.map(pointsToPath).join(" ")}
        fill={fill}
        fillRule="evenodd"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (feature.geometry.type === "LineString") {
    return (
      <polyline
        fill="none"
        points={pointsToString(feature.geometry.coordinates)}
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    );
  }

  const [x, y] = feature.geometry.coordinates;

  return (
    <g>
      <circle cx={x} cy={y} fill={fill} r="10" stroke={stroke} strokeWidth="3" />
      {feature.properties?.name ? (
        <text className="map-label" x={x + 16} y={y + 5}>
          {feature.properties.name}
        </text>
      ) : null}
    </g>
  );
}

function ImagePreview({
  document,
  selection,
}: {
  document: ExampleDocument;
  selection: LayerEditorSelection;
}) {
  return (
    <div className="image-preview">
      {visibleLayers(document).map((layer) => {
        const selected = selection.layerIds.includes(layer.id);
        const layerStyle = boundsStyle(layer);

        if (layer.data?.kind === "image") {
          const source = findSource(document, layer.sourceId);
          if (!source || !isImageSourceData(source.data)) {
            return null;
          }

          return (
            <img
              key={layer.id}
              alt={source.data.alt}
              className={selected ? "preview-selected image-layer" : "image-layer"}
              src={source.data.src}
              style={{
                ...layerStyle,
                mixBlendMode: layer.blendMode,
                opacity: layer.opacity ?? 1,
              }}
            />
          );
        }

        if (layer.data?.kind === "image-overlay") {
          return (
            <div
              key={layer.id}
              className={selected ? "preview-selected image-overlay" : "image-overlay"}
              style={{
                ...layerStyle,
                background: stringStyle(layer, "fill", "#f1c550"),
                mixBlendMode: layer.blendMode,
                opacity: layer.opacity ?? 1,
              }}
            />
          );
        }

        if (layer.data?.kind === "image-label") {
          return (
            <div
              key={layer.id}
              className={selected ? "preview-selected image-caption" : "image-caption"}
              style={{
                ...layerStyle,
                color: stringStyle(layer, "fill", "#f7f2de"),
                opacity: layer.opacity ?? 1,
              }}
            >
              {layer.data.text}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function SvgPreview({
  document,
  selection,
}: {
  document: ExampleDocument;
  selection: LayerEditorSelection;
}) {
  return (
    <svg className="svg-preview" role="img" viewBox="0 0 760 480">
      <rect width="760" height="480" fill="#f7f5ee" />
      {visibleLayers(document).map((layer) => {
        if (layer.data?.kind !== "svg-shape") {
          return null;
        }

        const selected = selection.layerIds.includes(layer.id);
        const fill = stringStyle(layer, "fill", "#22312f");
        const stroke = stringStyle(layer, "stroke", "none");
        const strokeWidth = numberStyle(layer, "strokeWidth", 0);
        const commonProps = {
          className: selected ? "preview-selected" : undefined,
          fill,
          opacity: layer.opacity ?? 1,
          stroke,
          strokeWidth,
          style: { mixBlendMode: layer.blendMode },
        };

        if (layer.data.shape === "rect" && layer.bounds) {
          return (
            <rect
              key={layer.id}
              {...commonProps}
              height={layer.bounds.height}
              rx="24"
              width={layer.bounds.width}
              x={layer.bounds.x}
              y={layer.bounds.y}
            />
          );
        }

        if (layer.data.shape === "circle" && layer.bounds) {
          return (
            <circle
              key={layer.id}
              {...commonProps}
              cx={layer.bounds.x + layer.bounds.width / 2}
              cy={layer.bounds.y + layer.bounds.height / 2}
              r={layer.bounds.width / 2}
            />
          );
        }

        if (layer.data.shape === "path") {
          return <path key={layer.id} {...commonProps} d={layer.data.path ?? ""} />;
        }

        if (layer.data.shape === "text" && layer.bounds) {
          return (
            <text
              key={layer.id}
              {...commonProps}
              className={selected ? "preview-selected svg-wordmark" : "svg-wordmark"}
              x={layer.bounds.x}
              y={layer.bounds.y}
            >
              {layer.data.text}
            </text>
          );
        }

        return null;
      })}
    </svg>
  );
}

function LayerControls({
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
      <label>
        <span>Name</span>
        <input
          disabled={disabled}
          type="text"
          value={layer.label}
          onChange={(event) => patchLayer({ label: event.target.value })}
        />
      </label>
      <label>
        <span>Opacity</span>
        <input
          disabled={disabled}
          max="1"
          min="0"
          step="0.05"
          type="range"
          value={layer.opacity ?? 1}
          onChange={(event) => patchLayer({ opacity: Number(event.target.value) })}
        />
      </label>
      <label>
        <span>Blend</span>
        <select
          disabled={disabled}
          value={layer.blendMode ?? "normal"}
          onChange={(event) =>
            patchLayer({ blendMode: event.target.value as LayerEditorBlendMode })
          }
        >
          {layerEditorBlendModes.map((blendMode) => (
            <option key={blendMode} value={blendMode}>
              {blendMode}
            </option>
          ))}
        </select>
      </label>
      <div className="color-row">
        <label>
          <span>Fill</span>
          <input
            disabled={disabled}
            type="color"
            value={stringStyle(layer, "fill", "#2f6f5e")}
            onChange={(event) => patchStyle({ fill: event.target.value })}
          />
        </label>
        <label>
          <span>Stroke</span>
          <input
            disabled={disabled}
            type="color"
            value={normalizeColorValue(stringStyle(layer, "stroke", "#18312c"))}
            onChange={(event) => patchStyle({ stroke: event.target.value })}
          />
        </label>
      </div>
      {layer.data?.kind === "image-label" ? (
        <label>
          <span>Text</span>
          <input
            disabled={disabled}
            type="text"
            value={layer.data.text}
            onChange={(event) =>
              patchLayer({
                data: { kind: "image-label", text: event.target.value },
              })
            }
          />
        </label>
      ) : null}
    </section>
  );
}

function createGeoJsonDocument(): ExampleDocument {
  return createLayerEditorDocument({
    groups: [
      {
        id: "map-content",
        label: "Map content",
        layerIds: ["labels", "route", "water", "districts"],
      },
    ],
    layers: [
      {
        data: { kind: "geojson", symbol: "marker" },
        id: "labels",
        kind: "geojson",
        label: "Place labels",
        opacity: 1,
        sourceId: "places",
        style: { fill: "#f26d5b", stroke: "#7a2e25", strokeWidth: 3 },
      },
      {
        blendMode: "normal",
        data: { kind: "geojson", symbol: "line" },
        id: "route",
        kind: "geojson",
        label: "Cycle route",
        opacity: 1,
        sourceId: "route",
        style: { stroke: "#3159a5", strokeWidth: 9 },
      },
      {
        data: { kind: "geojson", symbol: "area" },
        id: "water",
        kind: "geojson",
        label: "Harbor water",
        opacity: 0.8,
        sourceId: "water",
        style: { fill: "#7cb7c7", stroke: "#3f7785", strokeWidth: 2 },
      },
      {
        data: { kind: "geojson", symbol: "area" },
        id: "districts",
        kind: "geojson",
        label: "District zones",
        opacity: 0.72,
        sourceId: "districts",
        style: { fill: "#9fbe78", stroke: "#557242", strokeWidth: 3 },
      },
    ],
    sources: [
      {
        data: {
          geojson: {
            features: [
              {
                geometry: {
                  coordinates: [
                    [
                      [86, 96],
                      [330, 72],
                      [390, 230],
                      [188, 276],
                      [82, 210],
                      [86, 96],
                    ],
                  ],
                  type: "Polygon",
                },
                type: "Feature",
              },
              {
                geometry: {
                  coordinates: [
                    [
                      [410, 92],
                      [690, 128],
                      [632, 318],
                      [430, 270],
                      [410, 92],
                    ],
                  ],
                  type: "Polygon",
                },
                type: "Feature",
              },
            ],
            type: "FeatureCollection",
          },
          kind: "geojson",
        },
        id: "districts",
        kind: "geojson",
        label: "District zones",
      },
      {
        data: {
          geojson: {
            features: [
              {
                geometry: {
                  coordinates: [
                    [
                      [70, 330],
                      [718, 292],
                      [718, 438],
                      [70, 438],
                      [70, 330],
                    ],
                  ],
                  type: "Polygon",
                },
                type: "Feature",
              },
            ],
            type: "FeatureCollection",
          },
          kind: "geojson",
        },
        id: "water",
        kind: "geojson",
        label: "Harbor water",
      },
      {
        data: {
          geojson: {
            features: [
              {
                geometry: {
                  coordinates: [
                    [116, 352],
                    [206, 278],
                    [330, 248],
                    [418, 302],
                    [558, 268],
                    [668, 164],
                  ],
                  type: "LineString",
                },
                type: "Feature",
              },
            ],
            type: "FeatureCollection",
          },
          kind: "geojson",
        },
        id: "route",
        kind: "geojson",
        label: "Cycle route",
      },
      {
        data: {
          geojson: {
            features: [
              {
                geometry: { coordinates: [206, 278], type: "Point" },
                properties: { name: "Station" },
                type: "Feature",
              },
              {
                geometry: { coordinates: [558, 268], type: "Point" },
                properties: { name: "Market" },
                type: "Feature",
              },
            ],
            type: "FeatureCollection",
          },
          kind: "geojson",
        },
        id: "places",
        kind: "geojson",
        label: "Places",
      },
    ],
  });
}

function createImageDocument(imageSrc: string): ExampleDocument {
  return createLayerEditorDocument({
    layers: [
      {
        bounds: { height: 72, width: 360, x: 50, y: 346 },
        data: { kind: "image-label", text: "Spring catalog cover" },
        id: "caption",
        kind: "image-label",
        label: "Caption",
        opacity: 1,
        style: { fill: "#fff9de" },
      },
      {
        blendMode: "multiply",
        bounds: { height: 372, width: 596, x: 82, y: 54 },
        data: { kind: "image-overlay" },
        id: "warm-grade",
        kind: "image-overlay",
        label: "Warm grade",
        opacity: 0.35,
        style: { fill: "#d9a23a" },
      },
      {
        bounds: { height: 372, width: 596, x: 82, y: 54 },
        data: { kind: "image" },
        id: "photo",
        kind: "image",
        label: "Source image",
        opacity: 1,
        sourceId: "sample-photo",
      },
      {
        bounds: { height: 400, width: 624, x: 68, y: 40 },
        data: { kind: "image-overlay" },
        id: "print-shadow",
        kind: "image-overlay",
        label: "Print shadow",
        opacity: 0.22,
        style: { fill: "#18211e" },
      },
    ],
    sources: [
      {
        data: {
          alt: "Generated sample landscape with paths and buildings.",
          kind: "image",
          src: imageSrc,
        },
        id: "sample-photo",
        kind: "image",
        label: "Sample image",
      },
    ],
  });
}

function createSvgDocument(): ExampleDocument {
  return createLayerEditorDocument({
    groups: [
      {
        id: "badge",
        label: "Badge",
        layerIds: ["wordmark", "spark-path", "dot", "panel", "halo"],
      },
    ],
    layers: [
      {
        bounds: { height: 0, width: 0, x: 245, y: 268 },
        data: { kind: "svg-shape", shape: "text", text: "LAYER" },
        id: "wordmark",
        kind: "svg-text",
        label: "Wordmark",
        opacity: 1,
        style: { fill: "#273632" },
      },
      {
        data: {
          kind: "svg-shape",
          path: "M183 226 C235 120 367 114 411 207 C451 292 569 270 606 172",
          shape: "path",
        },
        id: "spark-path",
        kind: "svg-path",
        label: "Spark path",
        opacity: 1,
        style: { fill: "none", stroke: "#eb6f4c", strokeWidth: 14 },
      },
      {
        bounds: { height: 44, width: 44, x: 570, y: 145 },
        data: { kind: "svg-shape", shape: "circle" },
        id: "dot",
        kind: "svg-circle",
        label: "Endpoint",
        opacity: 1,
        style: { fill: "#3159a5", stroke: "#f7f5ee", strokeWidth: 8 },
      },
      {
        bounds: { height: 188, width: 420, x: 170, y: 140 },
        data: { kind: "svg-shape", shape: "rect" },
        id: "panel",
        kind: "svg-rect",
        label: "Panel",
        opacity: 0.92,
        style: { fill: "#e2d6b8", stroke: "#273632", strokeWidth: 4 },
      },
      {
        bounds: { height: 320, width: 320, x: 220, y: 78 },
        data: { kind: "svg-shape", shape: "circle" },
        id: "halo",
        kind: "svg-circle",
        label: "Halo",
        opacity: 0.5,
        style: { fill: "#87b1aa" },
      },
    ],
  });
}

function renderLayerMeta(layer: LayerEditorLayer<ExampleLayerData>) {
  return `${layer.kind} / ${Math.round((layer.opacity ?? 1) * 100)}%`;
}

function visibleLayers(document: ExampleDocument) {
  return document.layers
    .filter((layer) => layer.visible ?? true)
    .slice()
    .reverse();
}

function findSource(document: ExampleDocument, sourceId: string | undefined) {
  return document.sources?.find((source) => source.id === sourceId) ?? null;
}

function isGeoJsonSourceData(
  data: ExampleSourceData | undefined,
): data is Extract<ExampleSourceData, { kind: "geojson" }> {
  return data?.kind === "geojson";
}

function isImageSourceData(
  data: ExampleSourceData | undefined,
): data is Extract<ExampleSourceData, { kind: "image" }> {
  return data?.kind === "image";
}

function pointsToString(points: GeoPoint[]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function pointsToPath(points: GeoPoint[]) {
  const [firstPoint, ...restPoints] = points;
  if (!firstPoint) {
    return "";
  }

  return `M ${firstPoint[0]} ${firstPoint[1]} ${restPoints
    .map(([x, y]) => `L ${x} ${y}`)
    .join(" ")} Z`;
}

function boundsStyle(layer: LayerEditorLayer<ExampleLayerData>): CSSProperties {
  const bounds = layer.bounds ?? { height: 100, width: 100, x: 0, y: 0 };

  return {
    height: `${bounds.height}px`,
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    transform: bounds.rotation ? `rotate(${bounds.rotation}deg)` : undefined,
    width: `${bounds.width}px`,
  };
}

function stringStyle(layer: LayerEditorLayer<ExampleLayerData>, key: string, fallback: string) {
  const value = layer.style?.[key];
  return typeof value === "string" ? value : fallback;
}

function numberStyle(layer: LayerEditorLayer<ExampleLayerData>, key: string, fallback: number) {
  const value = layer.style?.[key];
  return typeof value === "number" ? value : fallback;
}

function normalizeColorValue(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#18312c";
}

function createSampleImageDataUrl() {
  const canvas = document.createElement("canvas");
  canvas.width = 1192;
  canvas.height = 744;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  const sky = context.createLinearGradient(0, 0, 0, 744);
  sky.addColorStop(0, "#bfd9df");
  sky.addColorStop(0.48, "#e8dcc3");
  sky.addColorStop(1, "#7d9b73");
  context.fillStyle = sky;
  context.fillRect(0, 0, 1192, 744);

  context.fillStyle = "#4d765d";
  context.beginPath();
  context.moveTo(0, 470);
  context.bezierCurveTo(210, 360, 315, 390, 470, 315);
  context.bezierCurveTo(650, 230, 780, 300, 1192, 190);
  context.lineTo(1192, 744);
  context.lineTo(0, 744);
  context.closePath();
  context.fill();

  context.fillStyle = "#d6bc87";
  context.beginPath();
  context.moveTo(0, 640);
  context.bezierCurveTo(310, 520, 530, 558, 1192, 404);
  context.lineTo(1192, 744);
  context.lineTo(0, 744);
  context.closePath();
  context.fill();

  context.strokeStyle = "#f3ead5";
  context.lineWidth = 28;
  context.beginPath();
  context.moveTo(80, 744);
  context.bezierCurveTo(250, 592, 458, 588, 602, 480);
  context.bezierCurveTo(740, 376, 898, 385, 1064, 278);
  context.stroke();

  context.fillStyle = "#bd6d54";
  context.fillRect(712, 292, 132, 148);
  context.fillStyle = "#f0d7a5";
  context.fillRect(738, 320, 36, 52);
  context.fillRect(792, 320, 28, 52);
  context.fillStyle = "#6d533c";
  context.beginPath();
  context.moveTo(690, 292);
  context.lineTo(778, 218);
  context.lineTo(864, 292);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255,255,255,0.56)";
  for (const cloud of [
    [145, 108, 76],
    [250, 92, 48],
    [910, 104, 64],
    [988, 96, 42],
  ] as const) {
    context.beginPath();
    context.arc(cloud[0], cloud[1], cloud[2], 0, Math.PI * 2);
    context.fill();
  }

  return canvas.toDataURL("image/png");
}
