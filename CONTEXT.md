# Layer Editor

The Layer Editor context defines a layer-composition document as a downstream specialization of Editor Core's generic host-owned document language. It owns layers, groups, sources, and editor-facing layer composition concepts; host packages own domain-specific rendering, previews, inspectors, and concrete layer behavior.

## Language

**Layer Editor Document**:
A host-owned layer-composition document made of layers, groups, and sources. It is Layer Editor's specialization of the generic Editor Core Document and may also carry attached editor-view state such as viewport.
_Avoid_: Canvas document, project, scene, core document schema

**Layer**:
An ordered composition item in a document. A layer carries editing and render state, may reference backing content, and leaves concrete drawing behavior to the host.
_Avoid_: Visual object, renderable source, asset

**Layer Kind**:
A host-defined classification for a layer. Layer kinds are open-ended strings so host packages can define their own layer behavior.
_Avoid_: Layer type enum, built-in layer type

**Document Order**:
The layer sequence used as the default ordering for rendering and layer operations. Document order is distinct from group membership.
_Avoid_: Z-index, tree order

**Group**:
A separate container for layers. A group is not itself a layer, but it can contribute state such as visibility, locking, opacity, and blend mode to its member layers.
_Avoid_: Group layer, folder layer

**Group Membership**:
The relationship between a group and the layers it contains. A layer belongs to at most one group, and group membership is separate from document order.
_Avoid_: Layer parentage, layer grouping, tree hierarchy

**Source**:
Reusable host-defined backing content that a layer may reference. A source is not a layer and does not determine rendering by itself.
_Avoid_: Asset, media item, layer content

**Source Kind**:
A host-defined classification for a source. Source kinds are open-ended strings so host packages can describe their own backing content.
_Avoid_: Asset type, media type enum

**Render Stack**:
The ordered host-facing list of layers prepared for rendering, preview, export, or similar flows. Entries include effective state and resolved group/source context.
_Avoid_: Scene graph, display list

**Effective State**:
The computed state used for editing or rendering after layer-local values and group values are combined. Visibility, locking, opacity, and blend mode participate in effective state.
_Avoid_: Inherited state, stored state

**Selection**:
Editor state describing the currently selected layers or groups. Selection is layer-composition selection, not document content or a universal selection model.
_Avoid_: Active layer only, document selection, core selection model

**History State**:
Undo and redo state around layer editor document snapshots. History state is editor workflow state, not document content, audit history, or semantic operation history.
_Avoid_: Audit log, version history, operation log

**Domain Data**:
Opaque host-owned data attached to layers, groups, or sources. The layer editor preserves it without interpreting its meaning.
_Avoid_: Metadata, plugin data, aspect data

**Layer Bounds**:
Optional layer geometry for host rendering and editing. Bounds describe placement and size, with optional rotation, without defining how the layer is drawn.
_Avoid_: Layout box, canvas rect

**Layer Style**:
Optional host-consumed styling data on a layer. Style is intentionally open-ended and does not define package-level rendering behavior.
_Avoid_: CSS, appearance object

**Layer Tree**:
The editor-facing tree view of groups and layers. The tree organizes editing interactions and navigation and is not the persisted document hierarchy.
_Avoid_: Render tree, DOM tree, persisted hierarchy

**Filtered Layer Tree**:
A temporary layer tree view narrowed by search query or host predicates. Filtering may reveal matching group contents without changing document state such as group collapse.
_Avoid_: Search result document, filtered document
