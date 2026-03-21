import * as joint from '@joint/core';
import { createIconLinkEnd } from '../shapes/linkEndpoints';
import { createGraphLayers, LINK_LAYER_ID, NODE_LAYER_ID } from './graphLayers';
import type { LinkData, NodeData } from './types';

const DEFAULT_FONT_ICON_UNICODE = '\uF20A';
const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-unknown';
const DEFAULT_NODE_SIZE = 64;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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
        data: link.data ?? {},
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
