import type { LayerEditorLayer, LayerEditorSelection } from "@moritzbrantner/layer-editor";

import type { ExampleDocument, ExampleKey, ExampleLayerData, GeoFeature } from "./example-types";
import {
  boundsStyle,
  findSource,
  isGeoJsonSourceData,
  isImageSourceData,
  numberStyle,
  pointsToPath,
  pointsToString,
  stringStyle,
  visibleLayers,
} from "./example-utils";

export function ExamplePreview({
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
