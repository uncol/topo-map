import '@gufo-labs/font/gufo-font.css';
import { Topology } from '../src/index.ts';
import { configuredShapeMapData, glyphSegmentMapData } from '../scripts/fixtures/configuredShapeMapData.ts';

const mainContainer = document.getElementById('topology-main');
const minimapContainer = document.getElementById('topology-minimap');
const layoutContainer = document.querySelector('.layout');
const FIT_TO_PAGE_ON_LOAD = true;

if (
  !(mainContainer instanceof HTMLElement) ||
  !(minimapContainer instanceof HTMLElement) ||
  !(layoutContainer instanceof HTMLElement)
) {
  throw new Error('Required containers .layout, #topology-main and #topology-minimap were not found.');
}

const instance = new Topology({
  mainContainer,
  minimapContainer,
  initialScale: 1,
  minScale: 0.1,
  maxScale: 5,
  gridSize: 20,
  boundsPadding: 12,
  snapThreshold: 5,
  fitToPageOnLoad: FIT_TO_PAGE_ON_LOAD,
  asyncRendering: false,
  enableViewportCulling: true,
  debugLogs: false
});
const GENERATED_MAP_KEY = 'generated-grid';
const DEFAULT_GENERATED_ROWS = 20;
const DEFAULT_GENERATED_COLS = 20;

function generateTopology(rows, cols) {
  const nodes = [];
  const links = [];
  const spacingX = 220;
  const spacingY = 120;
  const startX = 80;
  const startY = 60;
  let linkSeq = 1;
  const statusClasses = ['gf-ok', 'gf-warn', 'gf-unknown', 'gf-fail'];
  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const id = `n${index + 1}`;
      const statusClass = statusClasses[Math.floor(Math.random() * statusClasses.length)];
      const textLen = Math.floor(Math.random() * 30);
      const loremText = lorem.slice(0, textLen);

      nodes.push({
        id,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        attrs: {
          title: {
            text: `Node ${index + 1} ${loremText}`
          },
          ipaddr: {
            text: `10.42.${row + 1}.${col + 1}`
          },
          icon: {
            status: statusClass
          }
        }
      });

      if (col < cols - 1) {
        links.push({
          id: `l${linkSeq}`,
          sourceId: id,
          targetId: `n${index + 2}`,
          label: '1G'
        });
        linkSeq += 1;
      }

      if (row < rows - 1) {
        links.push({
          id: `l${linkSeq}`,
          sourceId: id,
          targetId: `n${index + cols + 1}`,
          label: '10G'
        });
        linkSeq += 1;
      }
    }
  }

  return { nodes, links };
}

const MAPS = {
  'glyph-segment': {
    label: 'Glyph Segment',
    data: glyphSegmentMapData
  },
  'configured-shape': {
    label: 'Configured Shape',
    data: configuredShapeMapData
  }
};

const modePan = document.getElementById('mode-pan');
const modeZoomArea = document.getElementById('mode-zoom-area');
const modeEdit = document.getElementById('mode-edit');
const toggleNodeLabelsBtn = document.getElementById('toggle-node-labels');
const mapSelect = document.getElementById('map-select');
const snapToggle = document.getElementById('snap-toggle');
const guidesToggle = document.getElementById('guides-toggle');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetViewBtn = document.getElementById('reset-view');
const zoomSelect = document.getElementById('zoom-select');
const boundsPadding = document.getElementById('bounds-padding');
const boundsPaddingValue = document.getElementById('bounds-padding-value');
const renderStats = document.getElementById('render-stats');
const TOPOLOGY_ELEMENT_CLICK_EVENT = 'topology:element:click';
const TOPOLOGY_LINK_CLICK_EVENT = 'topology:link:click';
const TOPOLOGY_WHEEL_EVENT = 'topology:wheel';
const ZOOM_CUSTOM_OPTION_VALUE = '__custom__';
const ZOOM_PRESET_TOLERANCE = 0.001;
let lastInteractionText = '';
let currentNodeCount = 0;
let currentLinkCount = 0;
let currentMapKey = 'glyph-segment';
let statsRafId = 0;

modePan?.addEventListener('click', () => instance.setMode('pan'));
modeZoomArea?.addEventListener('click', () => instance.setMode('zoomToArea'));
modeEdit?.addEventListener('click', () => instance.setMode('edit'));
toggleNodeLabelsBtn?.addEventListener('click', () => instance.toggleNodeLabelMode());

function applyToggleState() {
  if (snapToggle instanceof HTMLInputElement) {
    instance.setSnapToGrid(snapToggle.checked);
  }
  if (guidesToggle instanceof HTMLInputElement) {
    instance.setGuidesEnabled(guidesToggle.checked);
  }
}

snapToggle?.addEventListener('change', applyToggleState);
guidesToggle?.addEventListener('change', applyToggleState);
applyToggleState();

let zoomSelectRafId = 0;

function getCurrentScale() {
  if (typeof instance.getViewportSnapshot === 'function') {
    const snapshot = instance.getViewportSnapshot();
    if (snapshot && typeof snapshot.scale === 'number') {
      return snapshot.scale;
    }
  }
  return 1;
}

function toPercentText(scale) {
  return `${Math.round(scale * 100)}%`;
}

function clearCurrentMap() {
  instance.fromJSON({
    graph: {
      cells: []
    },
    viewport: {
      scale: 1,
      tx: 0,
      ty: 0
    }
  });
}

function parseGridInput(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function requestGeneratedMapConfig() {
  const input = window.prompt(
    'Rows, Columns',
    `${DEFAULT_GENERATED_ROWS},${DEFAULT_GENERATED_COLS}`
  );
  if (input === null) {
    return null;
  }

  const [rowsValue = '', colsValue = ''] = input.split(',').map((part) => part.trim());
  const rows = parseGridInput(rowsValue);
  const cols = parseGridInput(colsValue);
  if (rows === null || cols === null) {
    window.alert('Enter two positive integers in the format "rows,cols".');
    return null;
  }

  return { rows, cols };
}

function loadSelectedMap(mapKey) {
  if (mapKey === GENERATED_MAP_KEY) {
    const config = requestGeneratedMapConfig();
    if (!config) {
      if (mapSelect instanceof HTMLSelectElement) {
        mapSelect.value = currentMapKey;
      }
      return;
    }

    const generated = generateTopology(config.rows, config.cols);
    clearCurrentMap();
    instance.loadData(generated.nodes, generated.links);
    currentMapKey = GENERATED_MAP_KEY;
    currentNodeCount = generated.nodes.length;
    currentLinkCount = generated.links.length;
    lastInteractionText = `Loaded: Generated Grid ${config.rows}x${config.cols}`;
    console.log('[demo] loaded map', {
      map: 'Generated Grid',
      rows: config.rows,
      cols: config.cols,
      nodes: currentNodeCount,
      links: currentLinkCount
    });
    scheduleRenderStatsUpdate();
    scheduleZoomSelectorSync();
    return;
  }

  const selected = MAPS[mapKey];
  if (!selected) {
    if (mapSelect instanceof HTMLSelectElement) {
      mapSelect.value = currentMapKey;
    }
    return;
  }

  clearCurrentMap();
  instance.fromMapData(selected.data);
  currentMapKey = mapKey;
  currentNodeCount = selected.data.nodes?.length ?? 0;
  currentLinkCount = selected.data.links?.length ?? 0;
  lastInteractionText = `Loaded: ${selected.label}`;
  console.log('[demo] loaded map', {
    map: selected.label,
    nodes: currentNodeCount,
    links: currentLinkCount
  });
  scheduleRenderStatsUpdate();
  scheduleZoomSelectorSync();
}

function syncZoomSelector() {
  if (!(zoomSelect instanceof HTMLSelectElement)) {
    return;
  }

  const scale = getCurrentScale();
  if (!Number.isFinite(scale) || scale <= 0) {
    return;
  }

  const options = Array.from(zoomSelect.options);
  const preset = options.find((option) => {
    const parsed = Number.parseFloat(option.value);
    return Number.isFinite(parsed) && Math.abs(parsed - scale) <= ZOOM_PRESET_TOLERANCE;
  });
  if (preset) {
    zoomSelect.value = preset.value;
    return;
  }

  let customOption = options.find((option) => option.value === ZOOM_CUSTOM_OPTION_VALUE);
  if (!customOption) {
    customOption = document.createElement('option');
    customOption.value = ZOOM_CUSTOM_OPTION_VALUE;
    zoomSelect.append(customOption);
  }
  customOption.textContent = toPercentText(scale);
  zoomSelect.value = ZOOM_CUSTOM_OPTION_VALUE;
}

function scheduleZoomSelectorSync() {
  if (!(zoomSelect instanceof HTMLSelectElement)) {
    return;
  }
  if (zoomSelectRafId !== 0) {
    return;
  }
  zoomSelectRafId = window.requestAnimationFrame(() => {
    zoomSelectRafId = 0;
    syncZoomSelector();
  });
}

function applyZoomSelection(value) {
  if (value === 'fit-page') {
    instance.fitToPage();
    scheduleZoomSelectorSync();
    return;
  }
  if (value === 'fit-width') {
    instance.fitToWidth();
    scheduleZoomSelectorSync();
    return;
  }
  if (value === 'fit-height') {
    instance.fitToHeight();
    scheduleZoomSelectorSync();
    return;
  }
  if (value === ZOOM_CUSTOM_OPTION_VALUE) {
    return;
  }

  const scale = Number.parseFloat(value);
  if (!Number.isFinite(scale) || scale <= 0) {
    return;
  }

  instance.setZoom(scale);
  scheduleZoomSelectorSync();
}

const onZoomInClick = () => {
  instance.zoomIn();
  scheduleZoomSelectorSync();
};
const onZoomOutClick = () => {
  instance.zoomOut();
  scheduleZoomSelectorSync();
};
const onResetViewClick = () => {
  instance.resetView();
  scheduleZoomSelectorSync();
};
const onZoomSelectChange = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  applyZoomSelection(target.value);
};
const onTopologyWheel = () => {
  scheduleZoomSelectorSync();
};
const onMapSelectChange = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  loadSelectedMap(target.value);
};

zoomInBtn?.addEventListener('click', onZoomInClick);
zoomOutBtn?.addEventListener('click', onZoomOutClick);
resetViewBtn?.addEventListener('click', onResetViewClick);
mapSelect?.addEventListener('change', onMapSelectChange);
zoomSelect?.addEventListener('change', onZoomSelectChange);
mainContainer.addEventListener(TOPOLOGY_WHEEL_EVENT, onTopologyWheel);
if (mapSelect instanceof HTMLSelectElement) {
  loadSelectedMap(mapSelect.value);
} else {
  loadSelectedMap('glyph-segment');
}
syncZoomSelector();

function applyBoundsPadding(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, Math.round(value));
  instance.setBoundsPadding(normalized);
  if (boundsPaddingValue instanceof HTMLElement) {
    boundsPaddingValue.textContent = String(normalized);
  }
}

boundsPadding?.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  applyBoundsPadding(Number(target.value));
});

if (boundsPadding instanceof HTMLInputElement) {
  applyBoundsPadding(Number(boundsPadding.value));
}

function updateRenderStats() {
  if (!(renderStats instanceof HTMLElement)) {
    return;
  }
  const visibleElements = mainContainer.querySelectorAll('.joint-element').length;
  const visibleLinks = mainContainer.querySelectorAll('.joint-link').length;
  const interactionSuffix = lastInteractionText.length > 0 ? ` | ${lastInteractionText}` : '';
  renderStats.textContent =
    `Visible E: ${visibleElements} L: ${visibleLinks} | ` +
    `Total E: ${currentNodeCount} L: ${currentLinkCount}${interactionSuffix}`;
}

function scheduleRenderStatsUpdate() {
  if (statsRafId !== 0) {
    return;
  }
  statsRafId = window.requestAnimationFrame(() => {
    statsRafId = 0;
    updateRenderStats();
  });
}

const renderObserver = new MutationObserver(() => {
  scheduleRenderStatsUpdate();
});

renderObserver.observe(mainContainer, {
  childList: true,
  subtree: true
});
scheduleRenderStatsUpdate();

function onElementClick(event) {
  if (!(event instanceof CustomEvent)) {
    return;
  }
  const detail = event.detail ?? {};
  lastInteractionText = `Element click: ${detail.id ?? 'unknown'}`;
  console.log('[demo] element click', detail);
  scheduleRenderStatsUpdate();
}

function onLinkClick(event) {
  if (!(event instanceof CustomEvent)) {
    return;
  }
  const detail = event.detail ?? {};
  const source = detail.sourceId ?? '?';
  const target = detail.targetId ?? '?';
  lastInteractionText = `Link click: ${detail.id ?? 'unknown'} (${source} -> ${target})`;
  console.log('[demo] link click', detail);
  scheduleRenderStatsUpdate();
}

mainContainer.addEventListener(TOPOLOGY_ELEMENT_CLICK_EVENT, onElementClick);
mainContainer.addEventListener(TOPOLOGY_LINK_CLICK_EVENT, onLinkClick);

let rafResizeId = 0;
let prevMainWidth = -1;
let prevMainHeight = -1;
let prevMiniWidth = -1;
let prevMiniHeight = -1;

function applyResize() {
  rafResizeId = 0;

  const mainWidth = mainContainer.clientWidth;
  const mainHeight = mainContainer.clientHeight;
  const miniWidth = minimapContainer.clientWidth;
  const miniHeight = minimapContainer.clientHeight;

  if (mainWidth !== prevMainWidth || mainHeight !== prevMainHeight) {
    prevMainWidth = mainWidth;
    prevMainHeight = mainHeight;
    instance.resizeMain(mainWidth, mainHeight);
  }

  if (miniWidth !== prevMiniWidth || miniHeight !== prevMiniHeight) {
    prevMiniWidth = miniWidth;
    prevMiniHeight = miniHeight;
    instance.resizeMinimap(miniWidth, miniHeight);
  }

  scheduleRenderStatsUpdate();
  scheduleZoomSelectorSync();
}

function scheduleResize() {
  if (rafResizeId !== 0) {
    return;
  }
  rafResizeId = window.requestAnimationFrame(applyResize);
}

const resizeObserver = new ResizeObserver(() => {
  scheduleResize();
});

resizeObserver.observe(layoutContainer);
window.addEventListener('resize', scheduleResize, { passive: true });
scheduleResize();

window.addEventListener('beforeunload', () => {
  renderObserver.disconnect();
  resizeObserver.disconnect();
  window.removeEventListener('resize', scheduleResize);
  zoomInBtn?.removeEventListener('click', onZoomInClick);
  zoomOutBtn?.removeEventListener('click', onZoomOutClick);
  resetViewBtn?.removeEventListener('click', onResetViewClick);
  mapSelect?.removeEventListener('change', onMapSelectChange);
  zoomSelect?.removeEventListener('change', onZoomSelectChange);
  mainContainer.removeEventListener(TOPOLOGY_WHEEL_EVENT, onTopologyWheel);
  mainContainer.removeEventListener(TOPOLOGY_ELEMENT_CLICK_EVENT, onElementClick);
  mainContainer.removeEventListener(TOPOLOGY_LINK_CLICK_EVENT, onLinkClick);
  if (rafResizeId !== 0) {
    window.cancelAnimationFrame(rafResizeId);
  }
  if (zoomSelectRafId !== 0) {
    window.cancelAnimationFrame(zoomSelectRafId);
  }
  if (statsRafId !== 0) {
    window.cancelAnimationFrame(statsRafId);
  }
  instance.destroy();
});
