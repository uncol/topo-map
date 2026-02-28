import type * as joint from '@joint/core';

type ScalarId = string | number;
const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-ok';

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

export interface MapConvertedViewport {
  scale: number;
  tx: number;
  ty: number;
}

export interface MapConverterInput extends Record<string, unknown> {
  nodes?: MapConverterNode[] | null;
  links?: MapConverterLink[] | null;
  viewport?: Partial<MapConvertedViewport> | null;
}

export interface MapConvertedDocument {
  graph: joint.dia.Graph.JSON;
  viewport?: MapConvertedViewport;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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

  public convert(): MapConvertedDocument {
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

    const document: MapConvertedDocument = {
      graph: { cells } as joint.dia.Graph.JSON
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
    if (!nodeId) {
      return null;
    }

    if (shape.length === 0) {
      const glyphText = toGlyphText(node.glyph);
      if (!glyphText) {
        return null;
      }

      return {
        type: 'noc.FontIconElement',
        id: nodeId,
        position: {
          x: toFiniteNumber(node.x, 0),
          y: toFiniteNumber(node.y, 0)
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
        }
      };
    }

    return {
      type: 'noc.ImageIconElement',
      id: nodeId,
      position: {
        x: toFiniteNumber(node.x, 0),
        y: toFiniteNumber(node.y, 0)
      },
      attrs: {
        icon: {
          href: `#${MapConverter.getImageId(shape)}`,
          width: String(node.shape_width ?? ''),
          height: String(node.shape_height ?? ''),
          status: 'Unknown'
        },
        title: {
          text: toText(node.name)
        },
        ipaddr: {
          text: toText(node.address)
        }
      }
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

    return {
      type: 'noc.LinkElement',
      id: toId(link.id) ?? `${srcId}:${dstId}`,
      source: { id: srcId },
      target: { id: dstId },
      attrs: {
        connector: toText(link.connector, 'normal'),
        bw: link.bw ?? 0,
        in_bw: link.in_bw ?? 0,
        out_bw: link.out_bw ?? 0,
        method: toText(link.method)
      }
    };
  }
}

export function convertMapData(input: MapConverterInput): MapConvertedDocument {
  return new MapConverter(input).convert();
}
