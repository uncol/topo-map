import * as joint from '@joint/core';
import { centerOfRect, containsPoint } from '../core/geometry';
import type { Point, Rect } from '../core/types';
import { ViewportState } from '../core/ViewportState';
import { cellNamespace } from '../shapes/cellNamespace';

interface MinimapRect {
  rect: Rect;
}

export class MinimapManager {
  private readonly vector: typeof joint.V;

  private readonly graph: joint.dia.Graph;

  private readonly container: HTMLElement;

  private readonly paperHost: HTMLDivElement;

  private readonly paper: joint.dia.Paper;

  private readonly mainPaper: joint.dia.Paper;

  private readonly viewportState: ViewportState;

  private readonly unsubscribeViewport: () => void;

  private readonly viewportLayer: ReturnType<typeof joint.V>;

  private readonly viewportRect: ReturnType<typeof joint.V>;

  private readonly asyncRendering: boolean;

  private readonly padding: number;

  private refreshRafId = 0;

  private dragging = false;

  private dragOffset: Point = { x: 0, y: 0 };

  private minimapViewportRect: MinimapRect = {
    rect: {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }
  };

  private readonly onPointerDownBound = (event: PointerEvent): void => {
    this.onPointerDown(event);
  };

  private readonly onPointerMoveBound = (event: PointerEvent): void => {
    this.onPointerMove(event);
  };

  private readonly onPointerUpBound = (): void => {
    this.dragging = false;
  };

  private readonly onGraphChangeBound = (): void => {
    this.scheduleGraphRefresh();
  };

  private refreshDelayFrames = 0;

  public constructor(
    container: HTMLElement,
    graph: joint.dia.Graph,
    mainPaper: joint.dia.Paper,
    viewportState: ViewportState,
    asyncRendering: boolean,
    padding: number
  ) {
    this.container = container;
    this.vector = joint.V;
    this.graph = graph;
    this.mainPaper = mainPaper;
    this.viewportState = viewportState;
    this.asyncRendering = asyncRendering;
    this.padding = Number.isFinite(padding) && padding > 0 ? padding : 0;
    this.paperHost = this.createPaperHost(container, 'topology-minimap-paper-host');

    this.paper = new joint.dia.Paper({
      el: this.paperHost,
      model: graph,
      cellViewNamespace: cellNamespace,
      width: this.paperHost.clientWidth,
      height: this.paperHost.clientHeight,
      async: asyncRendering,
      frozen: asyncRendering,
      interactive: false,
      gridSize: 1,
      drawGrid: false,
      background: { color: '#ffffff' }
    });

    if (this.asyncRendering) {
      this.paper.unfreeze();
    }

    this.viewportLayer = this.vector('g', { class: 'topology-minimap-viewport' });
    this.viewportRect = this.vector('rect', {
      fill: 'rgba(14, 165, 233, 0.14)',
      stroke: '#0284c7',
      'stroke-width': 1,
      'stroke-dasharray': '4 2',
      rx: 2,
      ry: 2,
      cursor: 'grab'
    });

    this.viewportLayer.append(this.viewportRect);
    if (this.paper.svg) {
      this.viewportLayer.appendTo(this.paper.svg);
    }

    this.unsubscribeViewport = this.viewportState.subscribe(() => {
      this.updateViewportRect();
    });

    graph.on('add', this.onGraphChangeBound);
    graph.on('remove', this.onGraphChangeBound);
    graph.on('reset', this.onGraphChangeBound);
    graph.on('change:position', this.onGraphChangeBound);
    graph.on('change:size', this.onGraphChangeBound);
    graph.on('change:attrs', this.onGraphChangeBound);

    this.container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);

    this.syncPaperTransform();
    this.updateViewportRect();
  }

  public resize(width: number, height: number): void {
    this.paper.setDimensions(width, height);
    this.refresh();
  }

  public refresh(): void {
    this.syncPaperTransform();
    this.updateViewportRect();
  }

  public destroy(): void {
    this.unsubscribeViewport();

    this.graph.off('add', this.onGraphChangeBound);
    this.graph.off('remove', this.onGraphChangeBound);
    this.graph.off('reset', this.onGraphChangeBound);
    this.graph.off('change:position', this.onGraphChangeBound);
    this.graph.off('change:size', this.onGraphChangeBound);
    this.graph.off('change:attrs', this.onGraphChangeBound);

    this.container.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    if (this.refreshRafId !== 0) {
      window.cancelAnimationFrame(this.refreshRafId);
      this.refreshRafId = 0;
    }

    this.viewportLayer.remove();
    this.paper.remove();
  }

  private syncPaperTransform(): void {
    const contentArea = this.getMainContentRect();
    const options: joint.dia.Paper.TransformToFitContentOptions = {
      useModelGeometry: true,
      padding: this.padding,
      preserveAspectRatio: true
    };
    if (contentArea) {
      options.contentArea = contentArea;
    }

    this.paper.transformToFitContent(options);
  }

  private updateViewportRect(): void {
    const mainSnapshot = this.viewportState.getSnapshot();
    const mainWidth = this.mainPaper.el.clientWidth;
    const mainHeight = this.mainPaper.el.clientHeight;

    const mainRectLocal = this.clampViewportRectToContent({
      x: -mainSnapshot.tx / mainSnapshot.scale,
      y: -mainSnapshot.ty / mainSnapshot.scale,
      width: mainWidth / mainSnapshot.scale,
      height: mainHeight / mainSnapshot.scale
    });

    this.minimapViewportRect.rect = mainRectLocal;
    const minimapRect = this.clampRectToMinimapBounds(this.mainLocalRectToMinimapPaper(mainRectLocal));

    this.viewportRect.attr({
      x: minimapRect.x,
      y: minimapRect.y,
      width: minimapRect.width,
      height: minimapRect.height
    });
  }

  private onPointerDown(event: PointerEvent): void {
    const local = this.clientToLocalPoint(event.clientX, event.clientY);
    const currentRect = this.minimapViewportRect.rect;

    if (containsPoint(currentRect, local)) {
      this.dragging = true;
      this.dragOffset = {
        x: local.x - currentRect.x,
        y: local.y - currentRect.y
      };
      return;
    }

    const targetRect = this.clampViewportRectToContent({
      x: local.x - currentRect.width / 2,
      y: local.y - currentRect.height / 2,
      width: currentRect.width,
      height: currentRect.height
    });
    this.centerMainViewportAt(centerOfRect(targetRect));
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const local = this.clientToLocalPoint(event.clientX, event.clientY);
    const currentRect = this.minimapViewportRect.rect;
    const targetRect = this.clampViewportRectToContent({
      x: local.x - this.dragOffset.x,
      y: local.y - this.dragOffset.y,
      width: currentRect.width,
      height: currentRect.height
    });
    this.centerMainViewportAt(centerOfRect(targetRect));
  }

  private centerMainViewportAt(minimapPoint: Point): void {
    const snapshot = this.viewportState.getSnapshot();
    const width = this.mainPaper.el.clientWidth;
    const height = this.mainPaper.el.clientHeight;

    const tx = width / 2 - minimapPoint.x * snapshot.scale;
    const ty = height / 2 - minimapPoint.y * snapshot.scale;

    this.viewportState.setTranslate(tx, ty);
  }

  private mainLocalRectToMinimapPaper(mainRect: Rect): Rect {
    const paperRect = this.paper.localToPaperRect(mainRect);
    return {
      x: paperRect.x,
      y: paperRect.y,
      width: paperRect.width,
      height: paperRect.height
    };
  }

  private clampRectToMinimapBounds(rect: Rect): Rect {
    const bounds = this.getMinimapContentPaperRect();
    if (!bounds) {
      const computedSize = this.paper.getComputedSize();
      const maxWidth = Math.max(0, computedSize.width || this.container.clientWidth);
      const maxHeight = Math.max(0, computedSize.height || this.container.clientHeight);
      const width = Math.min(Math.max(0, rect.width), maxWidth);
      const height = Math.min(Math.max(0, rect.height), maxHeight);
      const left = Math.max(0, Math.min(maxWidth - width, rect.x));
      const top = Math.max(0, Math.min(maxHeight - height, rect.y));

      return {
        x: left,
        y: top,
        width,
        height
      };
    }

    const width = Math.min(Math.max(0, rect.width), bounds.width);
    const height = Math.min(Math.max(0, rect.height), bounds.height);
    const left = Math.max(bounds.x, Math.min(bounds.x + bounds.width - width, rect.x));
    const top = Math.max(bounds.y, Math.min(bounds.y + bounds.height - height, rect.y));

    return {
      x: left,
      y: top,
      width,
      height
    };
  }

  private clientToLocalPoint(clientX: number, clientY: number): Point {
    const point = this.paper.clientToLocalPoint({
      x: clientX,
      y: clientY
    });
    return { x: point.x, y: point.y };
  }

  private createPaperHost(container: HTMLElement, className: string): HTMLDivElement {
    const host = document.createElement('div');
    host.className = className;
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.position = 'relative';
    container.append(host);
    return host;
  }

  private getMainContentRect(): Rect | null {
    const snapshot = this.viewportState.getSnapshot();
    const paper = this.mainPaper as joint.dia.Paper & {
      getContentArea?: () => {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null;
    };
    const declaredBounds = this.getDeclaredMapBounds();
    const contentArea = paper.getContentArea?.();
    const contentRect = contentArea
      ? {
          x: contentArea.x,
          y: contentArea.y,
          width: Math.max(0, contentArea.width),
          height: Math.max(0, contentArea.height)
        }
      : null;
    const mergedRect = this.unionRects(contentRect, declaredBounds);
    if (mergedRect) {
      return {
        x: mergedRect.x,
        y: mergedRect.y,
        width: Math.max(0, mergedRect.width),
        height: Math.max(0, mergedRect.height),
      };
    }

    const bbox = this.graph.getBBox();
    if (!bbox) {
      return null;
    }

    return {
      x: bbox.x,
      y: bbox.y,
      width: Math.max(0, bbox.width),
      height: Math.max(0, bbox.height),
    };
  }

  private getMinimapContentPaperRect(): Rect | null {
    const contentRect = this.getMainContentRect();
    if (!contentRect) {
      return null;
    }

    const paperRect = this.paper.localToPaperRect(contentRect);
    return {
      x: paperRect.x,
      y: paperRect.y,
      width: Math.max(0, paperRect.width),
      height: Math.max(0, paperRect.height)
    };
  }

  private getDeclaredMapBounds(): Rect | null {
    const bounds = this.graph.get('mapBounds') as Partial<Rect> | undefined;
    if (!bounds) {
      return null;
    }

    const { x, y, width, height } = bounds;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    return { x, y, width, height };
  }

  private unionRects(a: Rect | null, b: Rect | null): Rect | null {
    if (!a) {
      return b;
    }
    if (!b) {
      return a;
    }

    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const right = Math.max(a.x + a.width, b.x + b.width);
    const bottom = Math.max(a.y + a.height, b.y + b.height);

    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
    };
  }

  private clampViewportRectToContent(rect: Rect): Rect {
    const bounds = this.getMainContentRect();
    if (!bounds) {
      return rect;
    }

    const width = Math.min(Math.max(0, rect.width), bounds.width);
    const height = Math.min(Math.max(0, rect.height), bounds.height);
    const x = Math.max(bounds.x, Math.min(bounds.x + bounds.width - width, rect.x));
    const y = Math.max(bounds.y, Math.min(bounds.y + bounds.height - height, rect.y));

    return {
      x,
      y,
      width,
      height
    };
  }

  private scheduleGraphRefresh(): void {
    this.refreshDelayFrames = 1;
    if (this.refreshRafId !== 0) {
      return;
    }

    const runRefresh = (): void => {
      this.refreshRafId = window.requestAnimationFrame(() => {
        this.refreshRafId = 0;
        if (this.refreshDelayFrames > 0) {
          this.refreshDelayFrames -= 1;
          runRefresh();
          return;
        }

        this.syncPaperTransform();
        this.updateViewportRect();
      });
    };

    runRefresh();
  }
}
