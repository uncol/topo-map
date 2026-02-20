# Topology Map (JointJS 4.2.4)

TypeScript module for an interactive network topology map with:
- zoom (wheel + API), pan, zoom-to-area,
- custom minimap,
- edit mode with node-only move,
- snap-to-grid and dynamic alignment guides,
- JSON serialization/deserialization.

## Install

```bash
npm install
```

## Build

```bash
npm run typecheck
npm run build
```

Watch mode:

```bash
pnpm run build:watch
```

`build:watch` updates `dist/__reload.txt`, and demo page auto-reloads in browser.

## Run Demo In Docker

```bash
pnpm run build
docker compose up -d
```

Open: `http://localhost:8080` (serves `/vanilla-index.html` from `dist`).

## Public API

- `new TopologyMap(config)`
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
