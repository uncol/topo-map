import * as joint from '@joint/core';
import { elementMarkup } from './labeling';

type LabelKey = 'nodeName' | 'ipaddr';
type AttrMap = Record<string, unknown>;

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
  buildExtraMarkup?: (instance: joint.dia.Element & TMethods) => joint.dia.MarkupJSON;
  buildExtraAttrs?: (instance: joint.dia.Element & TMethods) => AttrMap;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mergeAttrs(base: AttrMap, extra: AttrMap): AttrMap {
  const next: AttrMap = { ...base };
  Object.entries(extra).forEach(([key, value]) => {
    const prev = next[key];
    if (isRecord(prev) && isRecord(value)) {
      next[key] = {
        ...prev,
        ...value
      };
      return;
    }

    next[key] = value;
  });
  return next;
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
}

function toggleLabel(this: joint.dia.Element): void {
  const nodeNameDisplay = this.attr('nodeName/display');
  const ipaddrDisplay = this.attr('ipaddr/display');
  const newNodeNameDisplay = nodeNameDisplay === 'none' ? 'block' : 'none';
  const newIpaddrDisplay = ipaddrDisplay === 'none' ? 'block' : 'none';
  this.attr('nodeName/display', newNodeNameDisplay);
  this.attr('ipaddr/display', newIpaddrDisplay);
}

export type IconElementConstructor = joint.dia.Cell.Constructor<
  joint.dia.Element<joint.dia.Element.Attributes, joint.dia.ModelSetOptions>
>;

export function createIconElement<TMethods extends object>(
  config: IconElementFactoryConfig<TMethods>
): IconElementConstructor {
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

        const applyExtraPresentation = (): void => {
          const baseMarkup = [...elementMarkup, config.iconMarkup];
          const extraMarkup = config.buildExtraMarkup?.(this as joint.dia.Element & TMethods) ?? [];
          const extraAttrs = config.buildExtraAttrs?.(this as joint.dia.Element & TMethods) ?? {};

          this.set('markup', extraMarkup.length > 0 ? [...baseMarkup, ...extraMarkup] : baseMarkup, { silent: true });

          if (Object.keys(extraAttrs).length > 0) {
            const currentAttrs = this.get('attrs');
            const normalizedAttrs = isRecord(currentAttrs) ? currentAttrs : {};
            this.set('attrs', mergeAttrs(normalizedAttrs, extraAttrs), { silent: true });
          }
        };

        applyExtraPresentation();

        const attrs = this.get('attrs');
        const iconAttrs = getNestedRecord(attrs, 'icon');

        config.onIconInit?.(this as joint.dia.Element & TMethods, iconAttrs);

        const breakWidth = config.getBreakWidth(this as joint.dia.Element & TMethods, iconAttrs);
        applyLabelText(this, 'nodeName', breakWidth);
        applyLabelText(this, 'ipaddr', breakWidth);

        this.on('change:attrs', () => {
          applyExtraPresentation();
          const currentAttrs = this.get('attrs');
          const currentIconAttrs = getNestedRecord(currentAttrs, 'icon');
          config.onIconAttrsChange?.(this as joint.dia.Element & TMethods, currentIconAttrs);
        });

        this.on('change:data', () => {
          applyExtraPresentation();
        });
      },

      toggleLabel,
      ...config.methods
    }
  );
}
