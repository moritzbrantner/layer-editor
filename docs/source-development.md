# Source development

Layer Editor keeps published semver dependencies in `package.json`, while coordinated editor-family development uses sibling source checkouts.

Default layout:

```text
workspace/
  editor-core/
  layer-editor/
```

Set `EDITOR_CORE_SOURCE=/absolute/path/to/editor-core` to override the sibling location.

```sh
bun run source:prepare
bun run source:status
bun run verify:source
```

`source:prepare` installs frozen dependencies, recursively prepares upstream source dependencies when supported, builds editor-core, and links that checkout into `node_modules/@moritzbrantner/editor-core`. The source Git SHA is recorded under `node_modules/.editor-source-deps/`; package metadata and the lockfile remain release-oriented.

Use `bun run source:watch` in another terminal while changing editor-core.

Return to the published dependency contract with:

```sh
bun run source:restore
bun run verify
```

The default `verify` path restores registry dependencies first. Source mode fails loudly when the expected checkout is missing or does not contain an editor-core package.
