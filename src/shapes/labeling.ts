export type TextLabelBackgroundMode = 'stroke' | 'rect';
export type LabelDisplay = 'block' | 'none';

const LABEL_FONT_SIZE = 12;
const LABEL_PADDING = 2;

export const TEXT_LABEL_BG: TextLabelBackgroundMode = 'stroke';

function isRectBackground(mode: TextLabelBackgroundMode): boolean {
  return mode === 'rect';
}

export const textLabelBg =
  TEXT_LABEL_BG === 'stroke'
    ? {
        stroke: '#FFFFFF',
        strokeWidth: 3,
        paintOrder: 'stroke fill'
      }
    : {};

export const elementMarkup = [
  { tagName: 'rect', selector: 'titleBg' },
  { tagName: 'text', selector: 'title', className: 'rotatable' },
  { tagName: 'rect', selector: 'ipaddrBg' },
  { tagName: 'text', selector: 'ipaddr', className: 'rotatable' }
] as const;

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

export function calcLabelBg(text: string, breakWidth: number): { x: number; y: number; width: number; height: number } {
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

export function resolveBgDisplay(display: LabelDisplay): LabelDisplay {
  return isRectBackground(TEXT_LABEL_BG) ? display : 'none';
}
