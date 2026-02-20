import * as joint from '@joint/core';

export const NetworkNode = joint.dia.Element.define(
  'topology.NetworkNode',
  {
    size: { width: 170, height: 64 },
    attrs: {
      body: {
        refWidth: '100%',
        refHeight: '100%',
        rx: 8,
        ry: 8,
        fill: '#ffffff',
        stroke: '#1f2937',
        strokeWidth: 1.5
      },
      icon: {
        width: 20,
        height: 20,
        x: 10,
        y: 10,
        'xlink:href': ''
      },
      label: {
        x: 40,
        y: 22,
        text: 'Node',
        fill: '#111827',
        fontSize: 13,
        fontWeight: 600,
        textAnchor: 'start',
        textVerticalAnchor: 'middle'
      },
      status: {
        x: 40,
        y: 44,
        text: '',
        fill: '#0f766e',
        fontSize: 11,
        textAnchor: 'start',
        textVerticalAnchor: 'middle'
      }
    }
  },
  {
    markup: [
      { tagName: 'rect', selector: 'body' },
      { tagName: 'image', selector: 'icon' },
      { tagName: 'text', selector: 'label' },
      { tagName: 'text', selector: 'status' }
    ]
  }
);
