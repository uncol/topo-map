import * as joint from '@joint/core';

const TEXT_LABEL_BG = 'stroke' as 'stroke' | 'rect';
const LABEL_FONT_SIZE = 12;
const LABEL_PADDING = 2;
const DEFAULT_FONT_ICON_UNICODE = '\uE003';
const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-ok';

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

interface FontIconElementMethods {
  toggleLabel: () => void;
  setClass: (size?: string, status?: string) => void;
  getSizeFromClass: (sizeClass: string) => number;
}

type FontIconElementInstance = joint.dia.Element & FontIconElementMethods;

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

export const FontIconElement = joint.dia.Element.define(
  'noc.FontIconElement',
  {
    type: 'noc.FontIconElement',
    z: 100,
    attrs: {
      icon: {
        text: DEFAULT_FONT_ICON_UNICODE,
        size: DEFAULT_FONT_ICON_SIZE_CLASS,
        status: DEFAULT_FONT_ICON_STATUS_CLASS
      },
      title: {
        ref: 'icon',
        refX: '50%',
        refY: '100%',
        textAnchor: 'middle',
        display: 'block',
        fill: '#000000',
        ...textLabelBg
      },
      ipaddr: {
        ref: 'icon',
        refX: '50%',
        refY: '100%',
        textAnchor: 'middle',
        display: 'none',
        fill: '#000000',
        ...textLabelBg
      },
      ...labelBgAttrs
    }
  },
  {
    markup: [...elementMarkup, { tagName: 'text', selector: 'icon', className: 'scalable' }],

    initialize: function (this: FontIconElementInstance, ...args: joint.dia.Element.Attributes[]) {
      joint.dia.Element.prototype.initialize.apply(this, args as [joint.dia.Element.Attributes]);

      const attrs = this.get('attrs');
      const iconAttrs = getNestedRecord(attrs, 'icon');
      this.setClass(getString(iconAttrs, 'size'), getString(iconAttrs, 'status'));

      const iconWidth = this.getSizeFromClass(getString(iconAttrs, 'size'));
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
        this.setClass(getString(currentIconAttrs, 'size'), getString(currentIconAttrs, 'status'));
      });
    },

    getSizeFromClass: function (this: FontIconElementInstance, sizeClass: string): number {
      const tempElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tempElement.setAttribute('class', ['gf', sizeClass].filter(Boolean).join(' '));
      tempElement.textContent = '\uE283';
      document.body.appendChild(tempElement);
      const computedStyle = window.getComputedStyle(tempElement);
      const fontSize = Number.parseFloat(computedStyle.fontSize) || 32;
      document.body.removeChild(tempElement);
      return fontSize;
    },

    toggleLabel: function (this: FontIconElementInstance): void {
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

    setClass: function (this: FontIconElementInstance, size?: string, status?: string): void {
      const className = ['gf', size, status].filter(Boolean).join(' ');
      this.attr('icon/class', className);

      const embeddedCells = this.getEmbeddedCells();
      embeddedCells.forEach((badge) => {
        badge.attr('body/class', className);
        badge.attr('text/class', className);
      });
    }
  }
);

