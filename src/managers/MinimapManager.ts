import * as joint from '@joint/core';
import type { Point, Rect } from '../core/types';
import { ViewportState } from '../core/ViewportState';
import { containsPoint } from '../core/geometry';
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
    this.syncPaperTransform();
    this.updateViewportRect();
  };

  public constructor(
    container: HTMLElement,
    graph: joint.dia.Graph,
    mainPaper: joint.dia.Paper,
    viewportState: ViewportState,
    asyncRendering: boolean
  ) {
    this.container = container;
    this.vector = joint.V;
    this.graph = graph;
    this.mainPaper = mainPaper;
    this.viewportState = viewportState;
    this.asyncRendering = asyncRendering;
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
    graph.on('change:position', this.onGraphChangeBound);
    graph.on('change:size', this.onGraphChangeBound);

    this.container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);

    this.syncPaperTransform();
    this.updateViewportRect();
  }

  public resize(width: number, height: number): void {
    this.paper.setDimensions(width, height);
    this.syncPaperTransform();
    this.updateViewportRect();
  }

  public destroy(): void {
    this.unsubscribeViewport();

    this.graph.off('add', this.onGraphChangeBound);
    this.graph.off('remove', this.onGraphChangeBound);
    this.graph.off('change:position', this.onGraphChangeBound);
    this.graph.off('change:size', this.onGraphChangeBound);

    this.container.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);

    this.viewportLayer.remove();
    this.paper.remove();
  }

  private syncPaperTransform(): void {
    this.paper.scaleContentToFit({
      useModelGeometry: true,
      padding: 8,
      preserveAspectRatio: true
    });
  }

  private updateViewportRect(): void {
    const mainSnapshot = this.viewportState.getSnapshot();
    const mainWidth = this.mainPaper.el.clientWidth;
    const mainHeight = this.mainPaper.el.clientHeight;

    const mainRectLocal: Rect = {
      x: -mainSnapshot.tx / mainSnapshot.scale,
      y: -mainSnapshot.ty / mainSnapshot.scale,
      width: mainWidth / mainSnapshot.scale,
      height: mainHeight / mainSnapshot.scale
    };

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

    this.centerMainViewportAt(local);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const local = this.clientToLocalPoint(event.clientX, event.clientY);
    const targetX = local.x - this.dragOffset.x + this.minimapViewportRect.rect.width / 2;
    const targetY = local.y - this.dragOffset.y + this.minimapViewportRect.rect.height / 2;
    this.centerMainViewportAt({ x: targetX, y: targetY });
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
    const maxWidth = Math.max(0, this.container.clientWidth);
    const maxHeight = Math.max(0, this.container.clientHeight);

    const left = Math.max(0, Math.min(maxWidth, rect.x));
    const top = Math.max(0, Math.min(maxHeight, rect.y));
    const right = Math.max(0, Math.min(maxWidth, rect.x + rect.width));
    const bottom = Math.max(0, Math.min(maxHeight, rect.y + rect.height));

    return {
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top)
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
}
