import { createLayerEditorDocument } from "@moritzbrantner/layer-editor";

import type { ExampleDocument } from "./example-types";

export function createImageDocument(imageSrc: string): ExampleDocument {
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

export function createSampleImageDataUrl() {
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
