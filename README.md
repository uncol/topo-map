# Topology Map (JointJS 4.2.4)

TypeScript module for an interactive network topology map with:
- zoom (wheel + API), pan, zoom-to-area,
- custom minimap,
- edit mode with node-only move,
- snap-to-grid and dynamic alignment guides,
- JSON serialization/deserialization.

## Install

```bash
pnpm install
```

## Build

```bash
pnpm run typecheck
pnpm run build
```

`build` now uses Vite library mode and generates:
- `dist/index.js` (ES module),
- `dist/index.umd.js` (UMD bundle),
- `dist/**/*.d.ts` (TypeScript declarations).

## Run Demo (Vite dev server)

```bash
pnpm run demo
```

Open: `http://localhost:5173/vanilla-index.html`

## Build Demo (static)

```bash
pnpm run demo:build
```

Output: `dist/demo`

### Optional: serve built demo in Docker

```bash
pnpm run demo:build
docker compose up -d
```

Open: `http://localhost:8080`

## Public API

- `new Topology(config)`
- `loadData(nodes, links)`
- `toJSON()`
- `fromJSON(data)`
- `setMode('pan' | 'zoomToArea' | 'edit')`
- `getMode()`
- `setSnapToGrid(enabled)`
- `setGuidesEnabled(enabled)`
- `resizeMain(width, height)`
- `resizeMinimap(width, height)`
- `destroy()`

### Viewport restore behavior

`fromJSON(data)` reads `data.viewport` and restores it by default. Set `preserveViewportOnLoad: true` in config to keep current viewport on load.
Set `fitToPageOnLoad: true` to auto-fit the graph on `loadData()` and on `fromJSON()` when saved viewport is absent.

## Launch examples

- ExtJS: `/Users/dima/Projects/topo-map/examples/extjs-launch.js`
- Vanilla JS (no ExtJS): `/Users/dima/Projects/topo-map/examples/vanilla-index.html` + `/Users/dima/Projects/topo-map/examples/vanilla-launch.js`
