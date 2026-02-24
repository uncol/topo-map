import '@gufo-labs/font/gufo-font.css';
import { Topology } from '../src/index.ts';

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

const Topology = new Topology({
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

function generateTopology(rows, cols) {
  const nodes = [];
  const links = [];
  const spacingX = 220;
  const spacingY = 120;
  const startX = 80;
  const startY = 60;
  let linkSeq = 1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const id = `n${index + 1}`;
      const status = index % 23 === 0 ? 'DOWN' : index % 7 === 0 ? 'WARN' : 'UP';

      nodes.push({
        id,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        label: `Node ${index + 1}`,
        status
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

const { nodes, links } = generateTopology(40, 50);
console.log('[demo] generated topology', { nodes: nodes.length, links: links.length });

Topology.loadData(nodes, links);

const modePan = document.getElementById('mode-pan');
const modeZoomArea = document.getElementById('mode-zoom-area');
const modeEdit = document.getElementById('mode-edit');
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
const ZOOM_CUSTOM_OPTION_VALUE = '__custom__';
const ZOOM_PRESET_TOLERANCE = 0.001;
let lastInteractionText = '';

modePan?.addEventListener('click', () => Topology.setMode('pan'));
modeZoomArea?.addEventListener('click', () => Topology.setMode('zoomToArea'));
modeEdit?.addEventListener('click', () => Topology.setMode('edit'));

function applyToggleState() {
  if (snapToggle instanceof HTMLInputElement) {
    Topology.setSnapToGrid(snapToggle.checked);
  }
  if (guidesToggle instanceof HTMLInputElement) {
    Topology.setGuidesEnabled(guidesToggle.checked);
  }
}

snapToggle?.addEventListener('change', applyToggleState);
guidesToggle?.addEventListener('change', applyToggleState);
applyToggleState();

let zoomSelectRafId = 0;

function getCurrentScale() {
  if (typeof Topology.getViewportSnapshot === 'function') {
    const snapshot = Topology.getViewportSnapshot();
    if (snapshot && typeof snapshot.scale === 'number') {
      return snapshot.scale;
    }
  }
  return 1;
}

function toPercentText(scale) {
  return `${Math.round(scale * 100)}%`;
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
    Topology.fitToPage();
    scheduleZoomSelectorSync();
    return;
  }
  if (value === 'fit-width') {
    Topology.fitToWidth();
    scheduleZoomSelectorSync();
    return;
  }
  if (value === 'fit-height') {
    Topology.fitToHeight();
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

  Topology.setZoom(scale);
  scheduleZoomSelectorSync();
}

const onZoomInClick = () => {
  Topology.zoomIn();
  scheduleZoomSelectorSync();
};
const onZoomOutClick = () => {
  Topology.zoomOut();
  scheduleZoomSelectorSync();
};
const onResetViewClick = () => {
  Topology.resetView();
  scheduleZoomSelectorSync();
};
const onZoomSelectChange = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement)) {
    return;
  }
  applyZoomSelection(target.value);
};
const onMainWheel = () => {
  scheduleZoomSelectorSync();
};

zoomInBtn?.addEventListener('click', onZoomInClick);
zoomOutBtn?.addEventListener('click', onZoomOutClick);
resetViewBtn?.addEventListener('click', onResetViewClick);
zoomSelect?.addEventListener('change', onZoomSelectChange);
mainContainer.addEventListener('wheel', onMainWheel, { passive: true });
syncZoomSelector();

function applyBoundsPadding(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, Math.round(value));
  Topology.setBoundsPadding(normalized);
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

let statsRafId = 0;

function updateRenderStats() {
  if (!(renderStats instanceof HTMLElement)) {
    return;
  }
  const visibleElements = mainContainer.querySelectorAll('.joint-element').length;
  const visibleLinks = mainContainer.querySelectorAll('.joint-link').length;
  const interactionSuffix = lastInteractionText.length > 0 ? ` | ${lastInteractionText}` : '';
  renderStats.textContent =
    `Visible E: ${visibleElements} L: ${visibleLinks} | ` +
    `Total E: ${nodes.length} L: ${links.length}${interactionSuffix}`;
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
    Topology.resizeMain(mainWidth, mainHeight);
  }

  if (miniWidth !== prevMiniWidth || miniHeight !== prevMiniHeight) {
    prevMiniWidth = miniWidth;
    prevMiniHeight = miniHeight;
    Topology.resizeMinimap(miniWidth, miniHeight);
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
  zoomSelect?.removeEventListener('change', onZoomSelectChange);
  mainContainer.removeEventListener('wheel', onMainWheel);
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
  Topology.destroy();
});
