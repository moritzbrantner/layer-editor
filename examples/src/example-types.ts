import type {
  LayerEditorDocument,
  LayerEditorHistoryState,
  LayerEditorSelection,
} from "@moritzbrantner/layer-editor";

export type ExampleKey = "geojson" | "image" | "svg";

export type GeoPoint = [number, number];

export type GeoGeometry =
  | { type: "LineString"; coordinates: GeoPoint[] }
  | { type: "Point"; coordinates: GeoPoint }
  | { type: "Polygon"; coordinates: GeoPoint[][] };

export type GeoFeature = {
  type: "Feature";
  geometry: GeoGeometry;
  properties?: {
    name?: string;
  };
};

export type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

export type ExampleSourceData =
  | {
      kind: "geojson";
      geojson: GeoFeatureCollection;
    }
  | {
      kind: "image";
      alt: string;
      src: string;
    };

export type ExampleLayerData =
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

export type ExampleDocument = LayerEditorDocument<
  ExampleLayerData,
  Record<string, unknown>,
  ExampleSourceData
>;

export type ExampleDocuments = Record<ExampleKey, ExampleDocument>;
export type ExampleHistory = LayerEditorHistoryState<
  ExampleLayerData,
  Record<string, unknown>,
  ExampleSourceData
>;
export type ExampleHistories = Record<ExampleKey, ExampleHistory>;

export const exampleLabels = {
  geojson: "GeoJSON",
  image: "Image",
  svg: "SVG",
} satisfies Record<ExampleKey, string>;

export const initialSelection = {
  layerIds: [],
  primaryLayerId: null,
} satisfies LayerEditorSelection;
