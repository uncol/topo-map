import * as joint from '@joint/core';
import { createIconLinkEnd } from '../shapes/linkEndpoints';
import { createGraphLayers, LINK_LAYER_ID, NODE_LAYER_ID } from './graphLayers';
import { createNodeCell } from './nodeCellFactory';
import type { LinkData, NodeData } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function createGraphFromData(nodes: NodeData[], links: LinkData[]): joint.dia.Graph.JSON {
  const cells: Array<Record<string, unknown>> = [
    ...nodes.map((node) => {
      const customAttrs = node.attrs ?? {};
      const customIconAttrs = isObject(customAttrs.icon) ? customAttrs.icon : {};
      const iconHref =
        typeof node.iconHref === 'string' && node.iconHref.length > 0
          ? node.iconHref
          : typeof customIconAttrs.href === 'string' && customIconAttrs.href.length > 0
            ? customIconAttrs.href
            : typeof customIconAttrs.xlinkHref === 'string' && customIconAttrs.xlinkHref.length > 0
              ? customIconAttrs.xlinkHref
              : undefined;

      return createNodeCell(
        iconHref
          ? {
              kind: 'image',
              id: node.id,
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
              titleText: node.label,
              iconHref,
              iconStatus: node.status,
              attrs: customAttrs,
              data: {
                id: node.id,
                label: node.label,
                status: node.status,
                iconUnicode: node.iconUnicode,
                iconSizeClass: node.iconSizeClass,
                iconStatusClass: node.iconStatusClass,
                iconHref: node.iconHref
              }
            }
          : {
              kind: 'font',
              id: node.id,
              x: node.x,
              y: node.y,
              width: node.width,
              height: node.height,
              titleText: node.label,
              iconUnicode: node.iconUnicode,
              iconSizeClass: node.iconSizeClass,
              iconStatus: node.iconStatusClass,
              attrs: customAttrs,
              data: {
                id: node.id,
                label: node.label,
                status: node.status,
                iconUnicode: node.iconUnicode,
                iconSizeClass: node.iconSizeClass,
                iconStatusClass: node.iconStatusClass,
                iconHref: node.iconHref
              }
            }
      ) as Record<string, unknown>;
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
