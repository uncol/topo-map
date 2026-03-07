import type * as joint from '@joint/core';

export type TopologyMode = 'pan' | 'zoomToArea' | 'edit';

export interface TopologyConfig {
  mainContainer: HTMLElement;
  minimapContainer: HTMLElement;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  gridSize?: number;
  snapThreshold?: number;
  onReady?: () => void;
  preserveViewportOnLoad?: boolean;
  fitToPageOnLoad?: boolean;
  enableViewportCulling?: boolean;
  asyncRendering?: boolean;
  debugLogs?: boolean;
  padding?: number;
}

export interface NodeData {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  status?: string;
  iconUnicode?: string;
  iconSizeClass?: string;
  iconStatusClass?: string;
  iconHref?: string;
  attrs?: Record<string, unknown>;
}

export interface LinkData {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  attrs?: Record<string, unknown>;
}

export interface ViewportSnapshot {
  scale: number;
  tx: number;
  ty: number;
  minScale: number;
  maxScale: number;
}

export interface TranslateBounds {
  minTx: number;
  maxTx: number;
  minTy: number;
  maxTy: number;
}

export type TranslateBoundsResolver = (snapshot: ViewportSnapshot) => TranslateBounds | null;

export interface SerializedTopology {
  schemaVersion: string;
  viewport: Pick<ViewportSnapshot, 'scale' | 'tx' | 'ty'>;
  graph: joint.dia.Graph.JSON;
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Disposer = () => void;

export interface Command {
  execute(): void;
}
