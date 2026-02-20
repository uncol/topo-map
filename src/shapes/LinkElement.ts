import * as joint from '@joint/core';

export const LinkElement = joint.shapes.standard.Link.define('noc.LinkElement', {
  z: 10,
  markup: [
    {
      tagName: 'path',
      selector: 'outline',
      attributes: {
        fill: 'none',
        cursor: 'pointer',
        stroke: 'transparent',
        'stroke-linecap': 'round'
      }
    },
    {
      tagName: 'path',
      selector: 'line'
    }
  ],
  attrs: {
    line: {
      stroke: '#000000',
      strokeWidth: 1,
      strokeLinecap: 'round',
      targetMarker: { type: 'none' }
    },
    outline: {
      connection: true,
      strokeWidth: 10
    },
    connector: 'normal',
    bw: 0,
    in_bw: 0,
    out_bw: 0,
    method: ''
  }
});

