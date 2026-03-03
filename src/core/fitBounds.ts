import * as joint from '@joint/core';
import type { Rect, ViewportSnapshot } from './types';

export type FitMode = 'page' | 'width' | 'height';

type PaperMatrix = {
  a: number;
  e: number;
  f: number;
};

type ContentArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FittablePaper = joint.dia.Paper & {
  getContentArea?: () => ContentArea | null;
  transformToFitContent?: (options: Record<string, unknown>) => void;
  matrix: () => PaperMatrix;
};

export function getGraphMapBounds(graph: joint.dia.Graph): Rect | null {
  const bounds = graph.get('mapBounds') as Partial<Rect> | undefined;
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

export function unionRects(a: Rect | null, b: Rect | null): Rect | null {
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

export function fitPaperToContent(
  graph: joint.dia.Graph,
  paper: joint.dia.Paper,
  size: { width: number; height: number },
  snapshot: ViewportSnapshot,
  mode: FitMode,
  padding: number
): { scale: number; tx: number; ty: number } | null {
  const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : 0;
  const fittingBoxWidth = Math.max(1, size.width);
  const fittingBoxHeight = Math.max(1, size.height);
  const fittablePaper = paper as FittablePaper;
  const contentAreaRect = fittablePaper.getContentArea?.() ?? null;
  const contentArea = unionRects(contentAreaRect, getGraphMapBounds(graph));
  if (!contentArea || contentArea.width <= 0 || contentArea.height <= 0 || !fittablePaper.transformToFitContent) {
    return null;
  }

  let fittingWidth = fittingBoxWidth;
  let fittingHeight = fittingBoxHeight;

  if (mode === 'width') {
    const targetScale = Math.min(snapshot.maxScale, Math.max(snapshot.minScale, fittingBoxWidth / contentArea.width));
    fittingHeight = Math.max(fittingBoxHeight, contentArea.height * targetScale);
  } else if (mode === 'height') {
    const targetScale = Math.min(snapshot.maxScale, Math.max(snapshot.minScale, fittingBoxHeight / contentArea.height));
    fittingWidth = Math.max(fittingBoxWidth, contentArea.width * targetScale);
  }

  fittablePaper.transformToFitContent({
    contentArea,
    padding: safePadding,
    preserveAspectRatio: true,
    minScale: snapshot.minScale,
    maxScale: snapshot.maxScale,
    horizontalAlign: 'middle',
    verticalAlign: 'middle',
    fittingBBox: {
      x: 0,
      y: 0,
      width: fittingWidth,
      height: fittingHeight
    }
  });

  const matrix = fittablePaper.matrix();
  return {
    scale: matrix.a,
    tx: matrix.e,
    ty: matrix.f
  };
}
