# Layer Editor Agent Instructions

This repository contains reusable layer-document operations and React presentation primitives.

## Editor UX authority

- Interactive examples and workbenches apply the current shared `ui` conventions from `moritzbrantner/coding-agent-conventions`, especially `UI-008`, `UI-012`, and `UI-013`.
- Keep layer selection, ordering, grouping, and other layer-structure operations direct and contextual when the workbench represents them visually. Exact values and property panels supplement direct manipulation where precision is required.
- Give each layer gesture and selection state machine one owner. Do not mirror the same interaction in wrapper state or add a second drag/reorder implementation around an existing owner.
- Layer-editor owns layer/document semantics. It does not become the renderer, rasterizer, path engine, or product-specific composition authority merely to make an example richer.
- Repair reusable interaction behavior at the owning primitive and add browser evidence when correctness depends on hit geometry, drag placement, clipping, scrolling, or viewport behavior.

## Verification

Run the narrowest affected checks first, then the repository-owned `bun run verify` gate before handoff when feasible.
