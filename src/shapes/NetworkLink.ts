import * as joint from '@joint/core';

export const NetworkLink = joint.dia.Link.define(
  'topology.NetworkLink',
  {
    markup: [
      {
        tagName: 'path',
        selector: 'wrapper'
      },
      {
        tagName: 'path',
        selector: 'line'
      }
    ],
    attrs: {
      wrapper: {
        connection: true,
        fill: 'none',
        stroke: 'transparent',
        strokeWidth: 10
      },
      line: {
        connection: true,
        fill: 'none',
        stroke: '#334155',
        strokeWidth: 1.5,
        targetMarker: {
          type: 'path',
          d: 'M 10 -5 0 0 10 5 z'
        }
      },
      label: {
        fill: '#1e293b',
        fontSize: 11,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle'
      }
    },
    labels: []
  },
  {
    z: -1
  }
);
