import * as joint from '@joint/core';
import {
  calcLabelBg,
  calcLabelBoxFromContentHeight,
  getElementMarkup,
  getLabelWrapMode,
  LABEL_FONT_SIZE,
  resolveBgDisplay,
  resolveLabelDisplays,
  TEXT_LABEL_BG
} from './labeling';

type LabelKey = 'title' | 'ipaddr';

export type IconElementInstance<TMethods extends object> = joint.dia.Element &
  TMethods & {
    toggleLabel: () => void;
  };

export interface IconElementFactoryConfig<TMethods extends object> {
  type: string;
  attrs: joint.dia.Element.Attributes;
  iconMarkup: {
    tagName: string;
    selector: string;
    className?: string;
  };
  methods: TMethods;
  getBreakWidth: (instance: joint.dia.Element & TMethods, iconAttrs: Record<string, unknown>) => number;
  onIconInit?: (instance: joint.dia.Element & TMethods, iconAttrs: Record<string, unknown>) => void;
  onIconAttrsChange?: (instance: joint.dia.Element & TMethods, iconAttrs: Record<string, unknown>) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getNestedRecord(parent: unknown, key: string): Record<string, unknown> {
  if (!isRecord(parent)) {
    return {};
  }
  const value = parent[key];
  if (!isRecord(value)) {
    return {};
  }
  return value;
}

export function getString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

export function getNumber(record: Record<string, unknown>, key: string, fallback: number): number {
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

let labelMeasureElement: HTMLDivElement | null = null;

function ensureLabelMeasureElement(): HTMLDivElement {
  if (labelMeasureElement && document.body.contains(labelMeasureElement)) {
    return labelMeasureElement;
  }

  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-99999px';
  element.style.top = '0';
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  element.style.margin = '0';
  element.style.padding = '0';
  element.style.boxSizing = 'border-box';
  element.style.whiteSpace = 'pre-wrap';
  element.style.wordBreak = 'break-all';
  element.style.overflowWrap = 'anywhere';
  element.style.lineHeight = `${LABEL_FONT_SIZE}px`;
  element.style.fontSize = `${LABEL_FONT_SIZE}px`;
  document.body.append(element);
  labelMeasureElement = element;
  return element;
}

function measureHtmlLabelContentHeight(text: string, breakWidth: number): number {
  if (!document.body) {
    return LABEL_FONT_SIZE;
  }

  const element = ensureLabelMeasureElement();
  const width = Math.max(1, breakWidth);
  element.style.width = `${width}px`;
  element.textContent = text.length > 0 ? text : ' ';
  return Math.max(Math.ceil(element.getBoundingClientRect().height), LABEL_FONT_SIZE);
}

function getCurrentLabelDisplay(thisElement: joint.dia.Element, key: LabelKey): 'block' | 'none' {
  const svgDisplay = thisElement.attr(`${key}/display`);
  const foDisplay = thisElement.attr(`${key}Fo/display`);
  return svgDisplay === 'none' && foDisplay === 'none' ? 'none' : 'block';
}

function applyLabelVisibility(thisElement: joint.dia.Element, key: LabelKey, display: 'block' | 'none'): void {
  const { svgDisplay, foDisplay } = resolveLabelDisplays(display);
  thisElement.attr(`${key}/display`, svgDisplay);
  thisElement.attr(`${key}Fo/display`, foDisplay);
}

function applyLabelText(thisElement: joint.dia.Element, key: LabelKey, breakWidth: number): void {
  const attrs = thisElement.get('attrs');
  const labelAttrs = getNestedRecord(attrs, key);
  const labelText = getString(labelAttrs, 'text');
  const currentDisplay = getCurrentLabelDisplay(thisElement, key);
  const wrapMode = getLabelWrapMode();

  if (wrapMode === 'foreignObject') {
    const contentHeight = measureHtmlLabelContentHeight(labelText, breakWidth);
    const labelBox = calcLabelBoxFromContentHeight(contentHeight, breakWidth);
    thisElement.attr(`${key}/text`, labelText);
    thisElement.attr(`${key}Html/htmlText`, labelText);
    thisElement.attr(`${key}Fo`, labelBox);
    if (TEXT_LABEL_BG === 'rect') {
      thisElement.attr(`${key}Bg`, labelBox);
    }
    applyLabelVisibility(thisElement, key, currentDisplay);
    return;
  }

  const brokenText = labelText.length > 0 ? joint.util.breakText(labelText, { width: breakWidth }) : '';
  thisElement.attr(`${key}/text`, brokenText);
  thisElement.attr(`${key}Html/htmlText`, labelText);
  thisElement.attr(`${key}Fo`, calcLabelBg(brokenText, breakWidth));
  if (TEXT_LABEL_BG === 'rect') {
    thisElement.attr(`${key}Bg`, calcLabelBg(brokenText, breakWidth));
  }
  applyLabelVisibility(thisElement, key, currentDisplay);
}

function toggleLabel(this: joint.dia.Element): void {
  const titleDisplay = getCurrentLabelDisplay(this, 'title');
  const ipaddrDisplay = getCurrentLabelDisplay(this, 'ipaddr');
  const newTitleDisplay = titleDisplay === 'none' ? 'block' : 'none';
  const newIpaddrDisplay = ipaddrDisplay === 'none' ? 'block' : 'none';
  applyLabelVisibility(this, 'title', newTitleDisplay);
  applyLabelVisibility(this, 'ipaddr', newIpaddrDisplay);
  this.attr('titleBg/display', resolveBgDisplay(newTitleDisplay));
  this.attr('ipaddrBg/display', resolveBgDisplay(newIpaddrDisplay));
}

export function createIconElement<TMethods extends object>(
  config: IconElementFactoryConfig<TMethods>
): joint.dia.Cell.Constructor<joint.dia.Element<joint.dia.Element.Attributes, joint.dia.ModelSetOptions>> {
  type Instance = IconElementInstance<TMethods>;

  return joint.dia.Element.define(
    config.type,
    {
      type: config.type,
      z: 100,
      attrs: config.attrs
    },
    {
      markup: [...getElementMarkup(), config.iconMarkup],

      initialize: function (this: Instance, ...args: joint.dia.Element.Attributes[]) {
        joint.dia.Element.prototype.initialize.apply(this, args as [joint.dia.Element.Attributes]);

        const attrs = this.get('attrs');
        const iconAttrs = getNestedRecord(attrs, 'icon');

        config.onIconInit?.(this as joint.dia.Element & TMethods, iconAttrs);

        const breakWidth = config.getBreakWidth(this as joint.dia.Element & TMethods, iconAttrs);
        applyLabelText(this, 'title', breakWidth);
        applyLabelText(this, 'ipaddr', breakWidth);

        this.on('change:attrs', () => {
          const currentAttrs = this.get('attrs');
          const currentIconAttrs = getNestedRecord(currentAttrs, 'icon');
          config.onIconAttrsChange?.(this as joint.dia.Element & TMethods, currentIconAttrs);
        });
      },

      toggleLabel,
      ...config.methods
    },
    {
      attributes: {
        'html-text': {
          qualify: (_value: unknown, node: Element) => node instanceof HTMLElement,
          set: (value: unknown, _refBBox: unknown, node: Element) => {
            if (!(node instanceof HTMLElement)) {
              return;
            }
            node.textContent = typeof value === 'string' ? value : '';
          },
          unset: (node: Element) => {
            if (node instanceof HTMLElement) {
              node.textContent = '';
            }
          }
        }
      }
    }
  );
}
