import type * as joint from '@joint/core';

export type Mode = 'pan' | 'zoomToArea' | 'edit';

export interface Config {
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

export const PAPER_TYPES = [
  'segment',
  'configured',
  'l2domain',
  'objectcontainer',
  'objectgroup',
  'objectlevelneighbor'
] as const;

export type PaperType = (typeof PAPER_TYPES)[number];

export interface PaperConfig {
  id?: string;
  type?: PaperType;
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

export type ShapeOverlayPosition = 'NW' | 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W';

export type ShapeOverlayForm = 'c' | 's';

export interface ShapeOverlay {
  code: number;
  position: ShapeOverlayPosition;
  form: ShapeOverlayForm;
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

export type CellData = Record<string, unknown>;

export interface ElementRecord<TData extends CellData = CellData> {
  id: string;
  data: TData;
}

export interface LinkRecord<TData extends CellData = CellData> {
  id: string;
  data: TData;
}

export interface ElementDataApi {
  getIdsByDataType(type: string): string[];
  getById<TData extends CellData = CellData>(id: string): ElementRecord<TData> | null;
  getAll<TData extends CellData = CellData>(): ElementRecord<TData>[];
}

export interface LinkDataApi {
  getById<TData extends CellData = CellData>(id: string): LinkRecord<TData> | null;
  getAll<TData extends CellData = CellData>(): LinkRecord<TData>[];
}

export interface DataApi {
  readonly elements: ElementDataApi;
  readonly links: LinkDataApi;
}

export interface ViewportSnapshot {
  scale: number;
  tx: number;
  ty: number;
}

export interface ViewportStateSnapshot extends ViewportSnapshot {
  minScale: number;
  maxScale: number;
}

export type NodeLabelField = 'title' | 'ipaddr';

export type NodeSearchField = NodeLabelField | 'id';

export interface NodeSearchResult {
  id: string;
  text: string;
  field: NodeSearchField;
}

export interface TranslateBounds {
  minTx: number;
  maxTx: number;
  minTy: number;
  maxTy: number;
}

export type TranslateBoundsResolver = (snapshot: ViewportStateSnapshot) => TranslateBounds | null;

export interface SerializedMap {
  graph: joint.dia.Graph.JSON;
  viewport: ViewportSnapshot;
  schemaVersion: string;
}

export interface GraphEnvelope {
  graph: joint.dia.Graph.JSON;
  viewport?: ViewportSnapshot;
}

export interface MapDocument {
  graph: joint.dia.Graph.JSON;
  viewport?: ViewportSnapshot;
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
