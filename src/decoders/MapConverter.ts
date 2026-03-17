import type * as joint from '@joint/core';
import { createGraphLayers, LINK_LAYER_ID, NODE_LAYER_ID } from '../core/graphLayers';
import {
  TOPOLOGY_PAPER_TYPES,
  type MapDocument,
  type PaperConfig,
  type PaperType,
  type ViewportSnapshot
} from '../core/types';
import { createIconLinkEnd } from '../shapes/linkEndpoints';

const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-ok';

type ScalarId = string | number;
export interface MapConverterPort extends Record<string, unknown> {
  id?: ScalarId | null;
}

export type MapConverterPortGroup = Record<string, unknown>;

export type MapConverterShape = string;

export interface MapConverterNode extends Record<string, unknown> {
  id?: ScalarId | null;
  x?: number | null;
  y?: number | null;
  shape?: string | null;
  shape_width?: number | string | null;
  shape_height?: number | string | null;
  name?: string | null;
  address?: string | null;
  glyph?: number | string | null;
  cls?: string | null;
  ports?: MapConverterPort[] | null;
}

export interface MapConverterLinkEnd extends Record<string, unknown> {
  id?: ScalarId | null;
}

export interface MapConverterLink extends Record<string, unknown> {
  id?: ScalarId | null;
  ports?: Array<ScalarId | null | undefined> | null;
  connector?: string | null;
  bw?: number | string | null;
  in_bw?: number | string | null;
  out_bw?: number | string | null;
  method?: string | null;
}

type MapConvertedViewport = Pick<ViewportSnapshot, 'scale' | 'tx' | 'ty'>;

export interface MapConverterInput extends Record<string, unknown> {
  id?: ScalarId | null;
  type?: string | null;
  grid_size?: number | null;
  normalize_position?: boolean | null;
  object_status_refresh_interval?: number | null;
  background_image?: string | null;
  background_opacity?: number | null;
  name?: string | null;
  nodes?: MapConverterNode[] | null;
  links?: MapConverterLink[] | null;
  viewport?: Partial<MapConvertedViewport> | null;
  width?: number | null;
  height?: number | null;
  stencil_dir?: string | null;
}

function isPaperType(value: unknown): value is PaperType {
  return typeof value === 'string' && TOPOLOGY_PAPER_TYPES.includes(value as PaperType);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toPositiveFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return fallback;
}

function toId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function toText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toOptionalText(value: unknown): string | undefined {
  const text = toText(value);
  return text.length > 0 ? text : undefined;
}

function toOptionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeOpacity(value: unknown): number | undefined {
  const opacity = toOptionalFiniteNumber(value);
  if (opacity === undefined) {
    return undefined;
  }

  const normalized = opacity > 1 ? opacity / 100 : opacity;
  return Math.min(1, Math.max(0, normalized));
}

function toGlyphText(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String.fromCodePoint(value);
  }

  if (typeof value === 'string' && value.length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return String.fromCodePoint(numeric);
    }
    return value;
  }

  return null;
}

function normalizeViewport(viewport: MapConverterInput['viewport']): MapConvertedViewport | undefined {
  if (!viewport) {
    return undefined;
  }

  const scale = toFiniteNumber(viewport.scale, Number.NaN);
  const tx = toFiniteNumber(viewport.tx, Number.NaN);
  const ty = toFiniteNumber(viewport.ty, Number.NaN);
  if (!Number.isFinite(scale) || !Number.isFinite(tx) || !Number.isFinite(ty)) {
    return undefined;
  }

  return { scale, tx, ty };
}

function normalizePaperConfig(input: MapConverterInput): PaperConfig {
  const paperConfig: PaperConfig = {};
  const id = toId(input.id);
  const type = toOptionalText(input.type);
  const gridSize = toOptionalFiniteNumber(input.grid_size);
  const normalizePosition = toOptionalBoolean(input.normalize_position);
  const objectStatusRefreshInterval = toOptionalFiniteNumber(input.object_status_refresh_interval);
  const backgroundImage = toOptionalText(input.background_image);
  const backgroundOpacity = normalizeOpacity(input.background_opacity);
  const name = toOptionalText(input.name);
  const width = toOptionalFiniteNumber(input.width);
  const height = toOptionalFiniteNumber(input.height);
  const stencilDir = toOptionalText(input.stencil_dir);

  if (id) {
    paperConfig.id = id;
  }
  if (isPaperType(type)) {
    paperConfig.type = type;
  }
  if (gridSize !== undefined) {
    paperConfig.gridSize = gridSize;
  }
  if (normalizePosition !== undefined) {
    paperConfig.normalizePosition = normalizePosition;
  }
  if (objectStatusRefreshInterval !== undefined) {
    paperConfig.objectStatusRefreshInterval = objectStatusRefreshInterval;
  }
  if (backgroundImage) {
    paperConfig.backgroundImage = backgroundImage;
  }
  if (backgroundOpacity !== undefined) {
    paperConfig.backgroundOpacity = backgroundOpacity;
  }
  if (name) {
    paperConfig.name = name;
  }
  if (width !== undefined) {
    paperConfig.width = width;
  }
  if (height !== undefined) {
    paperConfig.height = height;
  }
  if (stencilDir) {
    paperConfig.stencilDir = stencilDir;
  }

  return paperConfig;
}

export class MapConverter {
  private readonly mapData: MapConverterInput;

  private readonly portToNode: Record<string, string>;

  public constructor(mapData: MapConverterInput) {
    this.mapData = mapData;
    this.portToNode = this.buildPortMap();
  }

  public static getImageId(shape: string): string {
    return `img-${shape.replace(/\//g, '-').replace(/ /g, '-').replace(/_/g, '-')}`;
  }

  public convert(): MapDocument {
    const cells: Array<Record<string, unknown>> = [];

    for (const node of this.mapData.nodes ?? []) {
      const cell = this.convertNode(node);
      if (cell) {
        cells.push(cell);
      }
    }

    for (const link of this.mapData.links ?? []) {
      const cell = this.convertLink(link);
      if (cell) {
        cells.push(cell);
      }
    }

    const graphJson: Record<string, unknown> = {
      cells,
      layers: createGraphLayers(),
      defaultLayer: NODE_LAYER_ID
    };

    const document: MapDocument = {
      graph: graphJson as joint.dia.Graph.JSON,
      paperConfig: normalizePaperConfig(this.mapData)
    };
    const viewport = normalizeViewport(this.mapData.viewport);
    if (viewport) {
      document.viewport = viewport;
    }

    return document;
  }

  private buildPortMap(): Record<string, string> {
    const map: Record<string, string> = {};

    for (const node of this.mapData.nodes ?? []) {
      const nodeId = toId(node.id);
      if (!nodeId) {
        continue;
      }

      for (const port of node.ports ?? []) {
        const portId = toId(port.id);
        if (portId) {
          map[portId] = nodeId;
        }
      }
    }

    return map;
  }

  private convertNode(node: MapConverterNode): Record<string, unknown> | null {
    const nodeId = toId(node.id);
    const shape = toText(node.shape);
    const nodeWidth = toPositiveFiniteNumber(node.shape_width, 64);
    const nodeHeight = toPositiveFiniteNumber(node.shape_height, 64);
    if (!nodeId) {
      return null;
    }
    const data = {
      id: node.id,
      address: node.address,
      name: node.name,
      level: node.level,
      external: node.external,
      caps: node.caps,
      metrics_label: node.metrics_label,
      metrics_template: node.metrics_template,
      node_id: node.node_id,
      object_filter: node.object_filter,
      ports: node.ports,
      shape_overlay: node.shape_overlay,
      type: node.type,
    };
    if (shape.length === 0) {
      const glyphText = toGlyphText(node.glyph);
      if (!glyphText) {
        return null;
      }

      return {
        type: 'noc.FontIconElement',
        id: nodeId,
        layer: NODE_LAYER_ID,
        position: {
          x: toFiniteNumber(node.x, 0),
          y: toFiniteNumber(node.y, 0)
        },
        size: {
          width: nodeWidth,
          height: nodeHeight
        },
        attrs: {
          icon: {
            text: glyphText,
            size: toText(node.cls, DEFAULT_FONT_ICON_SIZE_CLASS),
            status: DEFAULT_FONT_ICON_STATUS_CLASS
          },
          title: {
            text: toText(node.name)
          },
          ipaddr: {
            text: toText(node.address)
          }
        },
        data,
      };
    }

    return {
      type: 'noc.ImageIconElement',
      id: nodeId,
      layer: NODE_LAYER_ID,
      position: {
        x: toFiniteNumber(node.x, 0),
        y: toFiniteNumber(node.y, 0)
      },
      size: {
        width: nodeWidth,
        height: nodeHeight
      },
      attrs: {
        icon: {
          href: `#${MapConverter.getImageId(shape)}`,
          width: String(nodeWidth),
          height: String(nodeHeight),
          status: 'Unknown'
        },
        title: {
          text: toText(node.name)
        },
        ipaddr: {
          text: toText(node.address)
        }
      },
      data,
    };
  }

  private convertLink(link: MapConverterLink): Record<string, unknown> | null {
    const sourcePortId = toId(link.ports?.[0]);
    const targetPortId = toId(link.ports?.[1]);
    if (!sourcePortId || !targetPortId) {
      return null;
    }

    const srcId = this.portToNode[sourcePortId];
    const dstId = this.portToNode[targetPortId];
    if (srcId === undefined || dstId === undefined) {
      return null;
    }
    const data = {
      id: link.id,
      bw: link.bw,
      in_bw: link.in_bw,
      out_bw: link.out_bw,
      method: link.method,
      connector: link.connector,
      ports: link.ports,
      type: link.type,
    };

    return {
      type: 'noc.LinkElement',
      id: toId(link.id) ?? `${srcId}:${dstId}`,
      layer: LINK_LAYER_ID,
      source: createIconLinkEnd(srcId),
      target: createIconLinkEnd(dstId),
      attrs: {
        connector: toText(link.connector, 'normal'),
        bw: link.bw ?? 0,
        in_bw: link.in_bw ?? 0,
        out_bw: link.out_bw ?? 0,
        method: toText(link.method)
      },
      data,
    };
  }
}

export function convertMapData(input: MapConverterInput): MapDocument {
  return new MapConverter(input).convert();
}
