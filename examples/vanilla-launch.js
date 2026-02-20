import { TopologyMap } from '../dist/index.js';

const mainContainer = document.getElementById('topology-main');
const minimapContainer = document.getElementById('topology-minimap');
const layoutContainer = document.querySelector('.layout');

if (
  !(mainContainer instanceof HTMLElement) ||
  !(minimapContainer instanceof HTMLElement) ||
  !(layoutContainer instanceof HTMLElement)
) {
  throw new Error('Required containers .layout, #topology-main and #topology-minimap were not found.');
}

const topologyMap = new TopologyMap({
  mainContainer,
  minimapContainer,
  initialScale: 1,
  minScale: 0.1,
  maxScale: 5,
  gridSize: 20,
  boundsPadding: 12,
  snapThreshold: 5,
  asyncRendering: false,
  enableViewportCulling: false,
  debugLogs: true
});

const nodes = [
  { id: 'r1', x: 80, y: 60, label: 'Router 1', status: 'UP' },
  { id: 'sw1', x: 360, y: 80, label: 'Switch 1', status: 'UP' },
  { id: 'fw1', x: 220, y: 230, label: 'Firewall', status: 'WARN' },
  { id: 'srv1', x: 520, y: 250, label: 'Server 1', status: 'DOWN' }
];

const links = [
  { id: 'l1', sourceId: 'r1', targetId: 'sw1', label: '10G' },
  { id: 'l2', sourceId: 'sw1', targetId: 'fw1', label: '1G' },
  { id: 'l3', sourceId: 'fw1', targetId: 'srv1', label: '1G' }
];

topologyMap.loadData(nodes, links);

const modePan = document.getElementById('mode-pan');
const modeZoomArea = document.getElementById('mode-zoom-area');
const modeEdit = document.getElementById('mode-edit');
const snapToggle = document.getElementById('snap-toggle');
const guidesToggle = document.getElementById('guides-toggle');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetViewBtn = document.getElementById('reset-view');
const boundsPadding = document.getElementById('bounds-padding');
const boundsPaddingValue = document.getElementById('bounds-padding-value');

modePan?.addEventListener('click', () => topologyMap.setMode('pan'));
modeZoomArea?.addEventListener('click', () => topologyMap.setMode('zoomToArea'));
modeEdit?.addEventListener('click', () => topologyMap.setMode('edit'));

function applyToggleState() {
  if (snapToggle instanceof HTMLInputElement) {
    topologyMap.setSnapToGrid(snapToggle.checked);
  }
  if (guidesToggle instanceof HTMLInputElement) {
    topologyMap.setGuidesEnabled(guidesToggle.checked);
  }
}

snapToggle?.addEventListener('change', applyToggleState);
guidesToggle?.addEventListener('change', applyToggleState);
applyToggleState();

zoomInBtn?.addEventListener('click', () => topologyMap.zoomIn());
zoomOutBtn?.addEventListener('click', () => topologyMap.zoomOut());
resetViewBtn?.addEventListener('click', () => topologyMap.resetView());

function applyBoundsPadding(value) {
  if (!Number.isFinite(value)) {
    return;
  }
  const normalized = Math.max(0, Math.round(value));
  topologyMap.setBoundsPadding(normalized);
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
    topologyMap.resizeMain(mainWidth, mainHeight);
  }

  if (miniWidth !== prevMiniWidth || miniHeight !== prevMiniHeight) {
    prevMiniWidth = miniWidth;
    prevMiniHeight = miniHeight;
    topologyMap.resizeMinimap(miniWidth, miniHeight);
  }
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
  resizeObserver.disconnect();
  window.removeEventListener('resize', scheduleResize);
  if (rafResizeId !== 0) {
    window.cancelAnimationFrame(rafResizeId);
  }
  topologyMap.destroy();
});
