# Layer Editor roadmap

Layer Editor should become the hierarchy and spatial-composition specialization of editor-core. It owns ordering and composition semantics, not a rendering engine.

## 1. Migrate generic editor infrastructure

Use source-first development to reconcile Layer Editor with current editor-core before expanding the public surface.

Audit and converge:

- history/transactions
- commands
- selection
- serialization
- persistence/dirty state
- generic tree projection
- validation diagnostics

### Acceptance criteria

- source verification passes against the selected editor-core revision
- the existing entity-collection/document naming drift is resolved deliberately rather than hidden by source tooling
- packed/registry verification remains independently green
- layer-specific operations remain in layer-editor

## 2. Hierarchy and ordering

Deepen the document semantics around:

- stable parent/child relationships
- root ordering and sibling ordering
- group/ungroup
- reparenting
- deterministic reorder operations
- stable ids across hierarchy changes

Tree projection should be derived from the host/layer document rather than becoming a second canonical hierarchy.

## 3. Visibility and locking

Make visibility and locking first-class editing capabilities while keeping rendering host-owned.

### Acceptance criteria

- hidden/locked state can be provided by adapters when the host model already owns it
- selection and editing operations consistently respect locking
- visibility changes remain semantic operations when they modify the document
- UI filtering/collapse state remains view state

## 4. Spatial transforms

Add reusable headless operations for the spatial semantics that multiple layer-shaped documents need:

- translate
- resize/scale through adapters
- align
- distribute
- configurable snapping
- bounds queries

Avoid assuming SVG, Canvas, DOM, or a specific coordinate/render model.

## 5. Clipping, masks, and attachments

Treat clipping/mask relationships as optional document semantics only after real host adapters justify a common contract.

Likewise, attached/anchored entities should begin as adapter-level relationships rather than a universal layer entity field.

## 6. Rendering boundary

Layer Editor may provide rendering adapters, selection overlays, handles, inspector/controller behavior, and examples. It must not become an SVG/Canvas rendering engine or own host asset loading.

Reference adapters should continue to prove that the same hierarchy operations can drive different document/render models.

## 7. Reference scenarios

Dogfood at least:

- SVG-like document layers
- image/composition layers
- GeoJSON/map-like layers
- a host-defined custom entity tree

Use these to validate keyboard reordering/reparenting, drag-and-drop, mobile/touch targets, large hierarchies, and shared editor-core behavior.
