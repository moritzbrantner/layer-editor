import { createLayerEditorDocument } from "@moritzbrantner/layer-editor";

import type { ExampleDocument } from "./example-types";

export function createGeoJsonDocument(): ExampleDocument {
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
