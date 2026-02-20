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
const renderStats = document.getElementById('render-stats');

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

let statsRafId = 0;

function updateRenderStats() {
  if (!(renderStats instanceof HTMLElement)) {
    return;
  }
  const visibleElements = mainContainer.querySelectorAll('.joint-element').length;
  const visibleLinks = mainContainer.querySelectorAll('.joint-link').length;
  renderStats.textContent =
    `Visible E: ${visibleElements} L: ${visibleLinks} | ` +
    `Total E: ${nodes.length} L: ${links.length}`;
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

  scheduleRenderStatsUpdate();
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
  if (rafResizeId !== 0) {
    window.cancelAnimationFrame(rafResizeId);
  }
  if (statsRafId !== 0) {
    window.cancelAnimationFrame(statsRafId);
  }
  topologyMap.destroy();
});
