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

export const TOPOLOGY_PAPER_TYPES = [
  'segment',
  'configured',
  'l2domain',
  'objectcontainer',
  'objectgroup',
  'objectlevelneighbor'
] as const;

export type TopologyPaperType = (typeof TOPOLOGY_PAPER_TYPES)[number];

export interface PaperConfig {
  id?: string;
  type?: TopologyPaperType;
  gridSize?: number;
  normalizePosition?: boolean;
  objectStatusRefreshInterval?: number;
  backgroundImage?: string;
  backgroundOpacity?: number;
  name?: string;
  width?: number;
  height?: number;
  stencilDir?: string;
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

export type TopologyCellData = Record<string, unknown>;

export interface TopologyElementRecord<TData extends TopologyCellData = TopologyCellData> {
  id: string;
  data: TData;
}

export interface TopologyLinkRecord<TData extends TopologyCellData = TopologyCellData> {
  id: string;
  data: TData;
}

export interface TopologyElementDataApi {
  getIdsByDataType(type: string): string[];
  getById<TData extends TopologyCellData = TopologyCellData>(id: string): TopologyElementRecord<TData> | null;
  getAll<TData extends TopologyCellData = TopologyCellData>(): TopologyElementRecord<TData>[];
}

export interface TopologyLinkDataApi {
  getById<TData extends TopologyCellData = TopologyCellData>(id: string): TopologyLinkRecord<TData> | null;
  getAll<TData extends TopologyCellData = TopologyCellData>(): TopologyLinkRecord<TData>[];
}

export interface TopologyDataApi {
  readonly elements: TopologyElementDataApi;
  readonly links: TopologyLinkDataApi;
}

export interface ViewportSnapshot {
  scale: number;
  tx: number;
  ty: number;
  minScale: number;
  maxScale: number;
}

export type TopologyNodeLabelField = 'title' | 'ipaddr';

export type TopologyNodeSearchField = TopologyNodeLabelField | 'id';

export interface TopologyNodeSearchResult {
  id: string;
  text: string;
  field: TopologyNodeSearchField;
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

export interface MapDocument {
  graph: joint.dia.Graph.JSON;
  viewport?: Pick<ViewportSnapshot, 'scale' | 'tx' | 'ty'>;
  paperConfig: PaperConfig;
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
