# Changelog

## Unreleased

### Added

- Added structural layer replacement primitives for host-defined merge and split workflows while preserving deterministic document order and explicit group placement.

### Changed

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
