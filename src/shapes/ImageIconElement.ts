import * as joint from '@joint/core';

const TEXT_LABEL_BG = 'stroke' as 'stroke' | 'rect';
const LABEL_FONT_SIZE = 12;
const LABEL_PADDING = 2;

let stencilDir = '/stencils';

const textLabelBg =
  TEXT_LABEL_BG === 'stroke'
    ? {
        stroke: '#FFFFFF',
        strokeWidth: 3,
        paintOrder: 'stroke fill'
      }
    : {};

const elementMarkup =
  TEXT_LABEL_BG === 'rect'
    ? [
        { tagName: 'rect', selector: 'titleBg' },
        { tagName: 'text', selector: 'title', className: 'rotatable' },
        { tagName: 'rect', selector: 'ipaddrBg' },
        { tagName: 'text', selector: 'ipaddr', className: 'rotatable' }
      ]
    : [
        { tagName: 'text', selector: 'title', className: 'rotatable' },
        { tagName: 'text', selector: 'ipaddr', className: 'rotatable' }
      ];

const labelBgAttrs =
  TEXT_LABEL_BG === 'rect'
    ? {
        titleBg: {
          fill: '#FFFFFF',
          ref: 'icon',
          refX: '50%',
          refY: '100%',
          rx: 2,
          width: 0,
          height: 0
        },
        ipaddrBg: {
          fill: '#FFFFFF',
          ref: 'icon',
          refX: '50%',
          refY: '100%',
          rx: 2,
          width: 0,
          height: 0,
          display: 'none'
        }
      }
    : {};

interface ImageIconElementMethods {
  toggleLabel: () => void;
  setStatus: (filter: string) => void;
  convertImageIdToPath: (href: string) => string;
}

type ImageIconElementInstance = joint.dia.Element & ImageIconElementMethods;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNestedRecord(parent: unknown, key: string): Record<string, unknown> {
  if (!isRecord(parent)) {
    return {};
  }
  const value = parent[key];
  if (!isRecord(value)) {
    return {};
  }
  return value;
}

function getString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function getNumber(record: Record<string, unknown>, key: string, fallback: number): number {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function calcLabelBg(text: string, breakWidth: number): { x: number; y: number; width: number; height: number } {
  const lines = text ? text.split('\n').length : 1;
  const width = breakWidth + LABEL_PADDING * 2;
  const height = lines * LABEL_FONT_SIZE + LABEL_PADDING * 2;
  return {
    x: -width / 2,
    y: -LABEL_FONT_SIZE * 0.75 - LABEL_PADDING,
    width,
    height
  };
}

export function setStencilDir(dir: string): void {
  stencilDir = dir;
}

export function getStencilDir(): string {
  return stencilDir;
}

export const ImageIconElement = joint.dia.Element.define(
  'noc.ImageIconElement',
  {
    type: 'noc.ImageIconElement',
    z: 100,
    attrs: {
      icon: {
        width: 64,
        height: 64,
        xlinkHref: '',
        preserveAspectRatio: 'xMidYMid meet'
      },
      title: {
        text: 'New Object',
        fill: '#000000',
        ...textLabelBg,
        ref: 'icon',
        refX: '50%',
        refY: '100%',
        textAnchor: 'middle',
        lineHeight: '1em',
        display: 'block'
      },
      ipaddr: {
        text: '',
        fill: '#000000',
        ...textLabelBg,
        ref: 'icon',
        refX: '50%',
        refY: '100%',
        textAnchor: 'middle',
        lineHeight: '1em',
        display: 'none'
      },
      ...labelBgAttrs
    }
  },
  {
    markup: [...elementMarkup, { tagName: 'image', selector: 'icon', className: 'scalable' }],

    initialize: function (this: ImageIconElementInstance, ...args: joint.dia.Element.Attributes[]) {
      joint.dia.Element.prototype.initialize.apply(this, args as [joint.dia.Element.Attributes]);

      const attrs = this.get('attrs');
      const iconAttrs = getNestedRecord(attrs, 'icon');
      const initialHrefCandidate = getString(iconAttrs, 'xlinkHref') || getString(iconAttrs, 'href');

      if (initialHrefCandidate.length > 0) {
        if (initialHrefCandidate.startsWith('#img-')) {
          const path = this.convertImageIdToPath(initialHrefCandidate);
          this.attr('icon/xlinkHref', path);
        } else if (getString(iconAttrs, 'xlinkHref').length === 0 && getString(iconAttrs, 'href').length > 0) {
          this.attr('icon/xlinkHref', initialHrefCandidate);
        }
      }

      const statusValue = getString(iconAttrs, 'status');
      if (statusValue.length > 0) {
        this.setStatus(statusValue);
      }

      const iconWidth = getNumber(iconAttrs, 'width', 64);
      const breakWidth = iconWidth * 2;

      const titleAttrs = getNestedRecord(attrs, 'title');
      const titleText = getString(titleAttrs, 'text');
      if (titleText.length > 0) {
        const brokenText = joint.util.breakText(titleText, { width: breakWidth });
        this.attr('title/text', brokenText);
        if (TEXT_LABEL_BG === 'rect') {
          this.attr('titleBg', calcLabelBg(brokenText, breakWidth));
        }
      }

      const ipaddrAttrs = getNestedRecord(attrs, 'ipaddr');
      const ipaddrText = getString(ipaddrAttrs, 'text');
      if (ipaddrText.length > 0) {
        const brokenText = joint.util.breakText(ipaddrText, { width: breakWidth });
        this.attr('ipaddr/text', brokenText);
        if (TEXT_LABEL_BG === 'rect') {
          this.attr('ipaddrBg', calcLabelBg(brokenText, breakWidth));
        }
      }

      this.on('change:attrs', () => {
        const currentAttrs = this.get('attrs');
        const currentIconAttrs = getNestedRecord(currentAttrs, 'icon');
        const nextHref = getString(currentIconAttrs, 'xlinkHref') || getString(currentIconAttrs, 'href');

        if (nextHref.length > 0 && nextHref.startsWith('#img-')) {
          const path = this.convertImageIdToPath(nextHref);
          this.attr('icon/xlinkHref', path);
        } else if (nextHref.length > 0 && getString(currentIconAttrs, 'xlinkHref').length === 0) {
          this.attr('icon/xlinkHref', nextHref);
        }

        const nextStatus = getString(currentIconAttrs, 'status');
        if (nextStatus.length > 0) {
          this.setStatus(nextStatus);
        } else {
          this.attr('icon/filter', null);
          const embeddedCells = this.getEmbeddedCells();
          embeddedCells.forEach((badge) => {
            badge.attr('body/filter', null);
            badge.attr('text/filter', null);
          });
        }
      });
    },

    toggleLabel: function (this: ImageIconElementInstance): void {
      const titleDisplay = this.attr('title/display');
      const ipaddrDisplay = this.attr('ipaddr/display');
      const newTitleDisplay = titleDisplay === 'none' ? 'block' : 'none';
      const newIpaddrDisplay = ipaddrDisplay === 'none' ? 'block' : 'none';
      this.attr('title/display', newTitleDisplay);
      this.attr('ipaddr/display', newIpaddrDisplay);

      if (TEXT_LABEL_BG === 'rect') {
        this.attr('titleBg/display', newTitleDisplay);
        this.attr('ipaddrBg/display', newIpaddrDisplay);
      }
    },

    setStatus: function (this: ImageIconElementInstance, filter: string): void {
      this.attr('icon/filter', `url(#os${filter})`);
      const embeddedCells = this.getEmbeddedCells();
      embeddedCells.forEach((badge) => {
        badge.attr('body/filter', `url(#os${filter})`);
        badge.attr('text/filter', `url(#os${filter})`);
      });
    },

    convertImageIdToPath: function (this: ImageIconElementInstance, href: string): string {
      if (href.startsWith('#img-')) {
        const iconId = href.slice(5);
        const iconPath = iconId.replace(/-/, '/').replace(/-/g, '_');
        return `${stencilDir}/${iconPath}.svg`;
      }
      return href;
    }
  }
);
