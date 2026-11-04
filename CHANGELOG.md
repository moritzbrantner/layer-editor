# Changelog

## Unreleased

### Added

- Added structural layer replacement primitives for host-defined merge and split workflows while preserving deterministic document order and explicit group placement.

### Changed

- `LayerEditorPanel`'s toolbar now uses the shared `EditorToolbar`, `EditorToolbarGroup`, and `EditorToolbarButton` chrome from `@moritzbrantner/ui`. It is a single Tab stop named "Layer commands" with arrow-key, Home, and End navigation between enabled commands, labelled "Layer actions" and "History" groups, and shortcut hints in the command tooltips when `keyboardCommands` is enabled. `features.toolbar` and `features.historyControls` behave as before, and the `mb-layer-editor__toolbar`, `mb-layer-editor__toolbar-group`, and `mb-layer-editor__icon-button` class hooks remain.
- Depend on `@moritzbrantner/ui` as the commit-pinned git dependency `git+https://github.com/moritzbrantner/ui.git#2f8da604881d4513ac16ccceea446072d0a59a5d` (1.1.0) instead of the retired npm range `^0.10.0`. Git consumers also list `@moritzbrantner/ui` in `trustedDependencies` so its `prepare` build runs; an `overrides` entry keeps one copy across the dependency graph.
- The examples workbench uses `EditorPaneLayout` panes for layers, properties, and the serialized document, with resizable, collapsible docked panes on wide screens and overlay drawers on narrow ones. Layer opacity has an exact percentage input alongside its slider.
- Replaced the legacy `@moritzbrantner/editor-core` dependency and imports with the current `@moenarch/editor-core` package identity.
- Source-family verification now builds and tests Layer Editor against the current editor-core source checkout.
- Updated the layer entity projection to use the current generic `EditorEntityDocument` primitive instead of removed layer-specific editor-core helpers.
- Depend on `@moenarch/editor-core` `main` as a commit-pinned git dependency instead of `^0.4.1`. Git consumers also list `@moenarch/editor-core` in `trustedDependencies` so its `prepare` build runs. Keyboard commands use editor-core's `isEditorEditableTarget` directly; the local `isEditableKeyboardTarget` copy is removed.

## 0.2.0

### Added

- Added group visual state: `opacity` and `blendMode`.
- Added effective layer resolution helpers for host renderers.
- Added render stack helpers for ordered, filtered render consumption.
- Added batch layer update helpers for visibility, lock state, opacity, blend mode, style, and bounds.
- Added group state helpers for visibility, lock state, opacity, and blend mode.
- Added built-in parsing support for v1 serialized layer-editor documents.

### Changed

- Serialized documents now use schema version 2.
- Raw `readLayerEditorDocument` output is normalized.
- Document validation now reports invalid layer and group blend modes.
- Group normalization now defaults `visible`, `locked`, `opacity`, and `blendMode`.

### Migration Notes

- Existing v1 wrapped documents continue to parse automatically.
- Hosts that relied on invalid blend modes being accepted by validation should repair or omit those values before strict validation.
- Group objects may now be normalized with `opacity: 1` and `blendMode: "normal"`.
