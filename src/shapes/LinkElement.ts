import * as joint from '@joint/core';

interface LinkStrokeStyle {
  strokeWidth: number;
  strokeDasharray?: string;
}

interface LinkDataPayload {
  bw?: unknown;
}

interface LinkAttributes {
  attrs?: {
    line?: LinkStrokeStyle;
  };
  data?: LinkDataPayload;
}

const bwStyle: Array<{ threshold: number; style: LinkStrokeStyle }> = [
  { threshold: 99_500_000_000, style: { strokeWidth: 5 } },
  { threshold: 39_500_000_000, style: { strokeWidth: 4 } },
  { threshold: 9_500_000_000, style: { strokeWidth: 3 } },
  { threshold: 1_000_000_000, style: { strokeWidth: 2 } },
  { threshold: 100_000_000, style: { strokeWidth: 1 } },
  { threshold: 0, style: { strokeWidth: 1, strokeDasharray: '10 5' } }
];
const defaultStrokeStyle = bwStyle[bwStyle.length - 1]!.style;

function normalizeBw(bw: unknown): number {
  if (typeof bw !== 'number' || !Number.isFinite(bw) || bw < 0) {
    return 0;
  }

  return bw;
}

function getStrokeStyle(bw: unknown): LinkStrokeStyle {
  const normalizedBw = normalizeBw(bw);
  const match = bwStyle.find(({ threshold }) => threshold <= normalizedBw);

  return match?.style ?? defaultStrokeStyle;
}

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
    connector: 'normal'
  }
}, {
  initialize(this: joint.shapes.standard.Link, attributes?: LinkAttributes, options?: unknown) {
    joint.shapes.standard.Link.prototype.initialize.call(this, attributes, options);

    const lineAttrs = attributes?.attrs?.line;
    const style = getStrokeStyle(attributes?.data?.bw ?? this.get('data')?.bw);

    if (lineAttrs?.strokeWidth === undefined) {
      this.attr('line/strokeWidth', style.strokeWidth, { silent: true });
    }

    if (lineAttrs?.strokeDasharray === undefined) {
      if (style.strokeDasharray) {
        this.attr('line/strokeDasharray', style.strokeDasharray, { silent: true });
      } else {
        this.removeAttr('line/strokeDasharray', { silent: true });
      }
    }
  }
});
