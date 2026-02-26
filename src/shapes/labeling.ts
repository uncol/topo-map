export type TextLabelBackgroundMode = 'stroke' | 'rect';
export type LabelDisplay = 'block' | 'none';
export type LabelWrapMode = 'svg' | 'foreignObject';

export const LABEL_FONT_SIZE = 12;
export const LABEL_PADDING = 2;
const LABEL_MIN_CONTENT_HEIGHT = LABEL_FONT_SIZE;
const LABEL_TEXT_SHADOW = '0 0 2px #FFFFFF, 0 0 2px #FFFFFF';

export const TEXT_LABEL_BG: TextLabelBackgroundMode = 'stroke';
let labelWrapMode: LabelWrapMode = 'svg';
let cachedForeignObjectSupport: boolean | null = null;

function isRectBackground(mode: TextLabelBackgroundMode): boolean {
  return mode === 'rect';
}

function calcLabelBox(contentHeight: number, breakWidth: number): { x: number; y: number; width: number; height: number } {
  const width = breakWidth + LABEL_PADDING * 2;
  const normalizedContentHeight = Number.isFinite(contentHeight) ? Math.max(contentHeight, LABEL_MIN_CONTENT_HEIGHT) : LABEL_MIN_CONTENT_HEIGHT;
  const height = normalizedContentHeight + LABEL_PADDING * 2;
  return {
    x: -width / 2,
    y: -LABEL_FONT_SIZE * 0.75 - LABEL_PADDING,
    width,
    height
  };
}

export function setLabelWrapMode(mode: LabelWrapMode): void {
  labelWrapMode = mode;
}

function isForeignObjectSupported(): boolean {
  if (cachedForeignObjectSupport !== null) {
    return cachedForeignObjectSupport;
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedForeignObjectSupport = false;
    return cachedForeignObjectSupport;
  }
  cachedForeignObjectSupport = 'SVGForeignObjectElement' in window;
  return cachedForeignObjectSupport;
}

export function getLabelWrapMode(): LabelWrapMode {
  if (labelWrapMode === 'foreignObject' && !isForeignObjectSupported()) {
    return 'svg';
  }
  return labelWrapMode;
}

export function resolveLabelDisplays(display: LabelDisplay): { svgDisplay: LabelDisplay; foDisplay: LabelDisplay } {
  if (getLabelWrapMode() === 'foreignObject') {
    return {
      svgDisplay: 'none',
      foDisplay: display
    };
  }
  return {
    svgDisplay: display,
    foDisplay: 'none'
  };
}

export const textLabelBg =
  TEXT_LABEL_BG === 'stroke'
    ? {
        stroke: '#FFFFFF',
        strokeWidth: 3,
        paintOrder: 'stroke fill'
      }
    : {};

const labelHtmlStyle = {
  width: '100%',
  height: '100%',
  margin: '0',
  padding: `${LABEL_PADDING}px`,
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  overflowWrap: 'anywhere',
  lineHeight: `${LABEL_FONT_SIZE}px`,
  fontSize: `${LABEL_FONT_SIZE}px`,
  textAlign: 'center',
  color: '#000000',
  textShadow: LABEL_TEXT_SHADOW,
  overflow: 'hidden'
} as const;

const titleTextMarkup = { tagName: 'text', selector: 'title', className: 'rotatable' } as const;
const ipaddrTextMarkup = { tagName: 'text', selector: 'ipaddr', className: 'rotatable' } as const;
const titleFoMarkup = {
  tagName: 'foreignObject',
  selector: 'titleFo',
  className: 'rotatable',
  attributes: { overflow: 'visible' },
  children: [
    {
      tagName: 'div',
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      selector: 'titleHtml',
      style: labelHtmlStyle
    }
  ]
} as const;
const ipaddrFoMarkup = {
  tagName: 'foreignObject',
  selector: 'ipaddrFo',
  className: 'rotatable',
  attributes: { overflow: 'visible' },
  children: [
    {
      tagName: 'div',
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      selector: 'ipaddrHtml',
      style: labelHtmlStyle
    }
  ]
} as const;

export function getElementMarkup(): ReadonlyArray<Record<string, unknown>> {
  if (getLabelWrapMode() === 'foreignObject') {
    return [
      { tagName: 'rect', selector: 'titleBg' },
      titleFoMarkup,
      { tagName: 'rect', selector: 'ipaddrBg' },
      ipaddrFoMarkup
    ];
  }
  return [
    { tagName: 'rect', selector: 'titleBg' },
    titleTextMarkup,
    { tagName: 'rect', selector: 'ipaddrBg' },
    ipaddrTextMarkup
  ];
}

export const labelBgAttrs = {
  titleBg: {
    fill: '#FFFFFF',
    ref: 'icon',
    refX: '50%',
    refY: '100%',
    rx: 2,
    width: 0,
    height: 0,
    display: isRectBackground(TEXT_LABEL_BG) ? 'block' : 'none'
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
} as const;

export const labelFoAttrs = {
  titleFo: {
    ref: 'icon',
    refX: '50%',
    refY: '100%',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    display: 'none'
  },
  ipaddrFo: {
    ref: 'icon',
    refX: '50%',
    refY: '100%',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    display: 'none'
  },
  titleHtml: {
    htmlText: ''
  },
  ipaddrHtml: {
    htmlText: ''
  }
} as const;

export function calcLabelBg(text: string, breakWidth: number): { x: number; y: number; width: number; height: number } {
  const lines = text ? text.split('\n').length : 1;
  return calcLabelBox(lines * LABEL_FONT_SIZE, breakWidth);
}

export function calcLabelBoxFromContentHeight(
  contentHeight: number,
  breakWidth: number
): { x: number; y: number; width: number; height: number } {
  return calcLabelBox(contentHeight, breakWidth);
}

export function resolveBgDisplay(display: LabelDisplay): LabelDisplay {
  return isRectBackground(TEXT_LABEL_BG) ? display : 'none';
}
