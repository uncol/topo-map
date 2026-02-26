import * as joint from '@joint/core';
import { calcLabelBg, elementMarkup, resolveBgDisplay, TEXT_LABEL_BG } from './labeling';

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

function applyLabelText(thisElement: joint.dia.Element, key: LabelKey, breakWidth: number): void {
  const attrs = thisElement.get('attrs');
  const labelAttrs = getNestedRecord(attrs, key);
  const labelText = getString(labelAttrs, 'text');
  if (labelText.length === 0) {
    return;
  }

  const brokenText = joint.util.breakText(labelText, { width: breakWidth });
  thisElement.attr(`${key}/text`, brokenText);
  if (TEXT_LABEL_BG === 'rect') {
    thisElement.attr(`${key}Bg`, calcLabelBg(brokenText, breakWidth));
  }
}

function toggleLabel(this: joint.dia.Element): void {
  const titleDisplay = this.attr('title/display');
  const ipaddrDisplay = this.attr('ipaddr/display');
  const newTitleDisplay = titleDisplay === 'none' ? 'block' : 'none';
  const newIpaddrDisplay = ipaddrDisplay === 'none' ? 'block' : 'none';
  this.attr('title/display', newTitleDisplay);
  this.attr('ipaddr/display', newIpaddrDisplay);
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
      markup: [...elementMarkup, config.iconMarkup],

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
    }
  );
}
