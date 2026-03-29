import type * as joint from '@joint/core';
import { getDefaultFontIconAttrs, getFontStatusClass } from '../core/nodePresentation';
import type { ShapeOverlay, ShapeOverlayPosition } from '../core/types';
import { createIconElement, getNestedRecord, getNumber, getString, IconElementConstructor, IconElementInstance } from './iconElementFactory';
import { elementMarkup, textLabelBg } from './labeling';

type AttrMap = Record<string, unknown>;

const DEFAULT_ICON_SIZE = 64;

const BADGE_SCALE = 0.15; // change to resize badges: size, font, spacing, label width

const GF_SIZE_MAP: Record<string, number> = {
  'gf-1x': 64,
  'gf-2x': 128,
  'gf-3x': 192,
  'gf-16px': 16,
  'gf-24px': 24,
  'gf-32px': 32,
  'gf-48px': 48
};

const VALID_POSITIONS: ShapeOverlayPosition[] = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];

const POSITION_TO_SELECTOR: Record<ShapeOverlayPosition, string> = {
  NW: 'badgeNw',
  NE: 'badgeNe',
  SW: 'badgeSw',
  SE: 'badgeSe',
  N: 'badgeN',
  E: 'badgeE',
  S: 'badgeS',
  W: 'badgeW'
};

const FONT_ICON_MARKUP = { tagName: 'text', selector: 'icon', className: 'scalable' } as const;
const ICON_AREA_MARKUP = { tagName: 'rect', selector: 'iconArea' } as const;

interface FontIconElementMethods {
  setClass: (size?: string, statusCode?: number) => void;
}

type FontIconElementInstance = IconElementInstance<FontIconElementMethods>;

interface FontIconState {
  expectedSize: joint.dia.Size;
  glyph: string;
  iconAttrs: AttrMap;
  iconSize: number;
  overlays: ShapeOverlay[];
  sizeClass: string;
  statusCode: number;
}

function isRecord(value: unknown): value is AttrMap {
  return typeof value === 'object' && value !== null;
}

function isShapeOverlayPosition(value: unknown): value is ShapeOverlayPosition {
  return typeof value === 'string' && VALID_POSITIONS.includes(value as ShapeOverlayPosition);
}

function getShapeOverlays(data: unknown): ShapeOverlay[] {
  if (!isRecord(data) || !Array.isArray(data.shapeOverlay)) {
    return [];
  }

  const seenPositions = new Set<ShapeOverlayPosition>();

  return data.shapeOverlay.flatMap((item): ShapeOverlay[] => {
    if (!isRecord(item)) {
      return [];
    }

    const { code, position, form } = item;
    if (
      typeof code !== 'number' ||
      !Number.isFinite(code) ||
      !isShapeOverlayPosition(position) ||
      (form !== 'c' && form !== 's') ||
      seenPositions.has(position)
    ) {
      return [];
    }

    seenPositions.add(position);
    return [{
      code,
      position,
      form
    }];
  });
}

function computeSize(iconSize: number): joint.dia.Size {
  const iconPadding = iconSize / 2;
  const labelHeight = Math.ceil(iconSize * 1.85 / 4);
  const labelGap = iconSize * 0.25;
  return {
    width: iconSize * 4,
    height: iconPadding + iconSize + labelHeight * 2 + labelGap / 2
  };
}

function makeBadgeMarkup(selector: string, form: ShapeOverlay['form']): joint.dia.MarkupJSON[number] {
  const shape = form === 'c' ? 'circle' : 'rect';
  return {
    tagName: 'g',
    selector,
    children: [
      { tagName: shape, selector: `${selector}Bg` },
      { tagName: 'text', selector: `${selector}Text` }
    ]
  };
}

function makeLabelAttrs(display: 'block' | 'none'): AttrMap {
  return {
    ref: 'iconArea',
    refX: '50%',
    y: 'calc(1.7*w)',
    fontSize: 'calc(w / 4)',
    display,
    textAnchor: 'middle',
    fill: '#000000',
    textWrap: { width: 'calc(2*w)', ellipsis: false },
    ...textLabelBg
  };
}

function buildIconClassName(size: string, statusCode: number): string {
  return ['gf', size, getFontStatusClass(statusCode)].filter(Boolean).join(' ');
}

function buildBadgeClassName(statusCode: number): string {
  return [getFontStatusClass(statusCode)].filter(Boolean).join(' ');
}

function getDataString(data: unknown, key: string): string {
  if (!isRecord(data)) {
    return '';
  }
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function getFontSizeClass(data: unknown, iconAttrs: AttrMap): string {
  return getString(iconAttrs, 'size')
    || getDataString(data, 'cls')
    || getDataString(data, 'iconSizeClass')
    || 'gf-1x';
}

function getFontGlyph(data: unknown, iconAttrs: AttrMap): string {
  return getString(iconAttrs, 'text')
    || getDataString(data, 'glyph')
    || getDataString(data, 'iconUnicode')
    || '';
}

function deriveFontIconState(instance: FontIconElementInstance): FontIconState {
  const data = instance.get('data');
  const iconAttrs = getNestedRecord(instance.get('attrs'), 'icon');
  const sizeClass = getFontSizeClass(data, iconAttrs);
  const iconSize = GF_SIZE_MAP[sizeClass] ?? DEFAULT_ICON_SIZE;

  return {
    expectedSize: computeSize(iconSize),
    glyph: getFontGlyph(data, iconAttrs),
    iconAttrs,
    iconSize,
    overlays: getShapeOverlays(data),
    sizeClass,
    statusCode: getNumber(iconAttrs, 'status_code', 0)
  };
}

function buildFontMarkup(state: FontIconState): joint.dia.MarkupJSON {
  const badgeMarkup = state.overlays.map((overlay) =>
    makeBadgeMarkup(POSITION_TO_SELECTOR[overlay.position], overlay.form)
  );
  return [...elementMarkup, FONT_ICON_MARKUP, ICON_AREA_MARKUP, ...badgeMarkup];
}

function computeBadgeAttrs(state: FontIconState): AttrMap {
  const badgeSize = state.iconSize * BADGE_SCALE;
  const badgeFontSize = state.iconSize * BADGE_SCALE;
  const badgeClassName = buildBadgeClassName(state.statusCode);
  const iconXY = 1.5 * state.iconSize;

  const transforms: Record<ShapeOverlayPosition, string> = {
    NW: `translate(${state.iconSize - badgeSize}, ${badgeSize})`,
    NE: `translate(calc(w-${state.iconSize - badgeSize}), ${badgeSize})`,
    SW: `translate(${state.iconSize - badgeSize}, calc(h-${badgeSize}))`,
    SE: `translate(calc(w-${state.iconSize - badgeSize}), calc(h-${badgeSize}))`,
    N: `translate(calc(w/2), ${badgeSize})`,
    E: `translate(calc(w-${state.iconSize - badgeSize}), calc(h/2))`,
    S: `translate(calc(w/2), calc(h-${badgeSize}))`,
    W: `translate(${state.iconSize - badgeSize}, calc(h/2))`,
  };
  
  const attrs: AttrMap = {
    iconArea: {
      x: iconXY,
      y: iconXY,
      width: state.iconSize,
      height: state.iconSize,
      fill: 'none',
      stroke: 'none'
    }
  };

  state.overlays.forEach(({ position, code, form }) => {
    const selector = POSITION_TO_SELECTOR[position];
    const shapeGeom = form === 'c'
      ? { cx: 0, cy: 0, r: badgeSize }
      : { x: -badgeSize, y: -badgeSize, width: badgeSize * 2, height: badgeSize * 2 };

    attrs[selector] = { transform: transforms[position] };
    attrs[`${selector}Bg`] = {
      fill: '#FFFFFF',
      stroke: '#000000',
      strokeWidth: 0.5,
      ...shapeGeom
    };
    attrs[`${selector}Text`] = {
      x: 0,
      y: badgeFontSize / 2,
      fontSize: badgeFontSize,
      textAnchor: 'middle',
      fontFamily: 'GufoFont',
      fill: '#000000',
      class: badgeClassName,
      text: String.fromCodePoint(code)
    };
  });

  return attrs;
}

function buildFontAttrs(state: FontIconState): joint.dia.Cell.Selectors {
  return {
    ...computeBadgeAttrs(state),
    icon: {
      class: buildIconClassName(state.sizeClass, state.statusCode),
      text: state.glyph
    }
  };
}

function syncFontPresentation(instance: FontIconElementInstance, state: FontIconState): void {
  const currentSize = instance.size();

  if (
    currentSize.width !== state.expectedSize.width ||
    currentSize.height !== state.expectedSize.height
  ) {
    instance.resize(state.expectedSize.width, state.expectedSize.height, { silent: true });
  }

  instance.attr(buildFontAttrs(state));
}

export const FontIconElement: IconElementConstructor = createIconElement<FontIconElementMethods>({
  type: 'noc.FontIconElement',
  attrs: {
    icon: {
      ...getDefaultFontIconAttrs(),
      fontFamily: 'GufoFont',
      x: 'calc(0.375*w)',
      y: 'calc(0.375*w)',
      strokeWidth: 0.5
    },
    nodeName: {
      ...makeLabelAttrs('block')
    },
    ipaddr: {
      ...makeLabelAttrs('none')
    }
  },
  buildMarkup: (instance) => buildFontMarkup(deriveFontIconState(instance as FontIconElementInstance)),
  onIconInit: (instance) => {
    const element = instance as FontIconElementInstance;
    let syncing = false;

    const sync = (rebuildMarkup: boolean): void => {
      if (syncing) {
        return;
      }
      syncing = true;
      try {
        const state = deriveFontIconState(element);
        if (rebuildMarkup) {
          element.set('markup', buildFontMarkup(state), { silent: true });
        }
        syncFontPresentation(element, state);
      } finally {
        syncing = false;
      }
    };

    sync(false);
    element.on('change:attrs', () => {
      sync(false);
    });
    element.on('change:data', () => {
      sync(true);
    });
  },
  methods: {
    setClass: function (this: FontIconElementInstance, size?: string, statusCode?: number): void {
      const sizeClass = typeof size === 'string' && size.length > 0 ? size : 'gf-1x';
      const nextStatusCode = typeof statusCode === 'number' ? statusCode : 0;
      this.attr('icon/class', buildIconClassName(sizeClass, nextStatusCode));
    }
  }
});
