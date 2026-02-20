import type { Rect } from '../core/types';
import { ViewportState } from '../core/ViewportState';
import { clamp } from '../core/geometry';
import { DiagramService } from '../core/DiagramService';

export class ZoomManager {
  private readonly viewportState: ViewportState;

  private readonly diagramService: DiagramService;

  private readonly zoomStep: number;

  private readonly resetScale: number;

  private readonly wheelHandler = (event: WheelEvent): void => {
    this.handleWheel(event);
  };

  public constructor(
    viewportState: ViewportState,
    diagramService: DiagramService,
    zoomStep = 1.15,
    resetScale = 1
  ) {
    this.viewportState = viewportState;
    this.diagramService = diagramService;
    this.zoomStep = zoomStep;
    this.resetScale = resetScale;

    this.diagramService.getPaper().el.addEventListener('wheel', this.wheelHandler, { passive: false });
  }

  public zoomIn(): void {
    const paperRect = this.diagramService.getPaper().el.getBoundingClientRect();
    this.zoomByFactor(this.zoomStep, paperRect.width / 2, paperRect.height / 2);
  }

  public zoomOut(): void {
    const paperRect = this.diagramService.getPaper().el.getBoundingClientRect();
    this.zoomByFactor(1 / this.zoomStep, paperRect.width / 2, paperRect.height / 2);
  }

  public reset(): void {
    this.viewportState.setViewport(this.resetScale, 0, 0);
  }

  public zoomToRect(rect: Rect, padding = 24): void {
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const snapshot = this.viewportState.getSnapshot();
    const size = this.diagramService.getSize();
    const scaleX = (size.width - padding * 2) / rect.width;
    const scaleY = (size.height - padding * 2) / rect.height;
    const nextScale = clamp(Math.min(scaleX, scaleY), snapshot.minScale, snapshot.maxScale);
    const tx = size.width / 2 - (rect.x + rect.width / 2) * nextScale;
    const ty = size.height / 2 - (rect.y + rect.height / 2) * nextScale;

    this.viewportState.setViewport(nextScale, tx, ty);
  }

  public destroy(): void {
    this.diagramService.getPaper().el.removeEventListener('wheel', this.wheelHandler);
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const paperRect = this.diagramService.getPaper().el.getBoundingClientRect();
    const x = event.clientX - paperRect.left;
    const y = event.clientY - paperRect.top;
    const factor = event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
    this.zoomByFactor(factor, x, y);
  }

  private zoomByFactor(factor: number, centerX: number, centerY: number): void {
    const snapshot = this.viewportState.getSnapshot();
    const nextScale = clamp(snapshot.scale * factor, snapshot.minScale, snapshot.maxScale);
    if (nextScale === snapshot.scale) {
      return;
    }

    const localX = (centerX - snapshot.tx) / snapshot.scale;
    const localY = (centerY - snapshot.ty) / snapshot.scale;
    const nextTx = centerX - localX * nextScale;
    const nextTy = centerY - localY * nextScale;

    this.viewportState.setViewport(nextScale, nextTx, nextTy);
  }
}
