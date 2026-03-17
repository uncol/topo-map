import * as joint from '@joint/core';
import { createGraphLayers, LINK_LAYER_ID, NODE_LAYER_ID } from './graphLayers';
import { createIconLinkEnd } from '../shapes/linkEndpoints';
import type { LinkData, NodeData, SerializedMap, ViewportSnapshot } from './types';

const DEFAULT_SCHEMA_VERSION = '1.0.0';
const DEFAULT_FONT_ICON_UNICODE = '\uF20A';
const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-ok';
const DEFAULT_NODE_SIZE = 64;

export interface GraphEnvelope {
  graph: joint.dia.Graph.JSON;
  viewport?: {
    scale: number;
    tx: number;
    ty: number;
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function toGraphEnvelope(input: object): GraphEnvelope {
  if (!isObject(input)) {
    return { graph: { cells: [] } };
  }

  if ('graph' in input) {
    const graphValue = input.graph;
    if (isObject(graphValue)) {
      const viewportValue = 'viewport' in input && isObject(input.viewport) ? input.viewport : undefined;
      const viewport =
        viewportValue &&
        typeof viewportValue.scale === 'number' &&
        typeof viewportValue.tx === 'number' &&
        typeof viewportValue.ty === 'number'
          ? {
              scale: viewportValue.scale,
              tx: viewportValue.tx,
              ty: viewportValue.ty
            }
          : undefined;
      if (viewport) {
        return { graph: graphValue as joint.dia.Graph.JSON, viewport };
      }
      return { graph: graphValue as joint.dia.Graph.JSON };
    }
  }

  return { graph: input as joint.dia.Graph.JSON };
}

export function createGraphFromData(nodes: NodeData[], links: LinkData[]): joint.dia.Graph.JSON {
  const cells: Array<Record<string, unknown>> = [
    ...nodes.map((node) => {
      const customAttrs = node.attrs ?? {};
      const customIconAttrs = isObject(customAttrs.icon) ? customAttrs.icon : {};

      return {
        id: node.id,
        type: 'noc.FontIconElement',
        layer: NODE_LAYER_ID,
        position: { x: node.x, y: node.y },
        size: {
          width: node.width ?? DEFAULT_NODE_SIZE,
          height: node.height ?? DEFAULT_NODE_SIZE
        },
        attrs: {
          ...customAttrs,
          icon: {
            text: node.iconUnicode ?? DEFAULT_FONT_ICON_UNICODE,
            size: node.iconSizeClass ?? DEFAULT_FONT_ICON_SIZE_CLASS,
            status: node.iconStatusClass ?? DEFAULT_FONT_ICON_STATUS_CLASS,
            ...customIconAttrs
          }
        }
      };
    }),
    ...links.map((link) => {
      const labels =
        link.label && link.label.length > 0
          ? [
              {
                position: 0.5,
                attrs: {
                  text: {
                    text: link.label
                  }
                }
              }
            ]
          : [];

      return {
        id: link.id,
        type: 'noc.LinkElement',
        layer: LINK_LAYER_ID,
        source: createIconLinkEnd(link.sourceId),
        target: createIconLinkEnd(link.targetId),
        labels,
        attrs: link.attrs ?? {}
      };
    })
  ];

  return {
    cells,
    layers: createGraphLayers(),
    defaultLayer: NODE_LAYER_ID
  } as joint.dia.Graph.JSON;
}

export function serializeTopology(graph: joint.dia.Graph.JSON, snapshot: ViewportSnapshot): SerializedMap {
  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    viewport: {
      scale: snapshot.scale,
      tx: snapshot.tx,
      ty: snapshot.ty
    },
    graph
  };
}
