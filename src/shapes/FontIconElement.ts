import { getDefaultFontIconAttrs, getFontStatusClass } from '../core/nodePresentation';
import { createIconElement, getNumber, getString, IconElementConstructor, IconElementInstance } from './iconElementFactory';
import { buildBadgeMarkup, getBadgeGeometry, getBadgeSelectors, getShapeOverlays } from './iconBadges';
import { textLabelBg } from './labeling';

interface FontIconElementMethods {
  setClass: (size?: string, statusCode?: number) => void;
  getSizeFromClass: (sizeClass: string) => number;
}

type FontIconElementInstance = IconElementInstance<FontIconElementMethods>;

function buildFontBadgeMarkup(instance: FontIconElementInstance) {
  return buildBadgeMarkup(getShapeOverlays(instance.get('data')));
}

function buildFontBadgeAttrs(instance: FontIconElementInstance): Record<string, unknown> {
  const overlays = getShapeOverlays(instance.get('data'));
  const className = ['gf', instance.attr('icon/size'), getFontStatusClass(instance.attr('icon/status_code'))]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');

  return overlays.reduce<Record<string, unknown>>((attrs, overlay) => {
    const selectors = getBadgeSelectors(overlay.position);
    const geometry = getBadgeGeometry(instance.size(), overlay.position);
    const centerX = geometry.x + geometry.size / 2;
    const centerY = geometry.y + geometry.size / 2;

    attrs[selectors.body] = overlay.form === 'c'
      ? {
          cx: centerX,
          cy: centerY,
          r: geometry.size / 2,
          strokeWidth: 0.5
        }
      : {
          x: geometry.x,
          y: geometry.y,
          width: geometry.size,
          height: geometry.size,
          strokeWidth: 0.5
        };

    attrs[selectors.text] = {
      text: String.fromCodePoint(overlay.code),
      x: centerX,
      y: centerY,
      xAlignment: 'middle',
      yAlignment: 'middle',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      class: className
    };

    return attrs;
  }, {});
}

export const FontIconElement: IconElementConstructor = createIconElement<FontIconElementMethods>({
  type: 'noc.FontIconElement',
  attrs: {
    icon: getDefaultFontIconAttrs(),
    nodeName: {
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
    }
  },
  iconMarkup: { tagName: 'text', selector: 'icon', className: 'scalable' },
  buildExtraMarkup: (instance) => buildFontBadgeMarkup(instance as FontIconElementInstance),
  buildExtraAttrs: (instance) => buildFontBadgeAttrs(instance as FontIconElementInstance),
  getBreakWidth: (instance, iconAttrs) => instance.getSizeFromClass(getString(iconAttrs, 'size')) * 2,
  onIconInit: (instance, iconAttrs) => {
    instance.setClass(getString(iconAttrs, 'size'), getNumber(iconAttrs, 'status_code', 0));
  },
  onIconAttrsChange: (instance, iconAttrs) => {
    instance.setClass(getString(iconAttrs, 'size'), getNumber(iconAttrs, 'status_code', 0));
  },
  methods: {
    getSizeFromClass: function (this: FontIconElementInstance, sizeClass: string): number {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        return 32;
      }

      const tempElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tempElement.setAttribute('class', ['gf', sizeClass].filter(Boolean).join(' '));
      tempElement.textContent = '\uE283';
      document.body.appendChild(tempElement);
      const computedStyle = window.getComputedStyle(tempElement);
      const fontSize = Number.parseFloat(computedStyle.fontSize) || 32;
      document.body.removeChild(tempElement);
      return fontSize;
    },

    setClass: function (this: FontIconElementInstance, size?: string, statusCode?: number): void {
      const className = ['gf', size, getFontStatusClass(statusCode)].filter(Boolean).join(' ');
      this.attr('icon/class', className);
      getShapeOverlays(this.get('data')).forEach((overlay) => {
        const selectors = getBadgeSelectors(overlay.position);
        this.attr(`${selectors.text}/class`, className);
      });
    }
  }
});
