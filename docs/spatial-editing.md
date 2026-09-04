# Spatial editing

Layer Editor keeps spatial editing document-oriented and renderer-neutral. The core operations update layer bounds and never depend on SVG, Canvas, DOM measurement, or a particular React workbench.

The public operations support translation, rotation, configurable grid snapping, measured-bounds alignment, and even distribution. They operate only on layers with bounds and skip effectively locked layers, including layers locked through their parent group.

Alignment and distribution use each layer's width and height rather than assuming uniform layer sizes. Rotation is normalized into a stable 0–360 degree turn, while grid and translation results are rounded deterministically to millisecond-style three-decimal precision.
