import { createIconElement, getString, IconElementConstructor, IconElementInstance } from './iconElementFactory';
import { getDefaultFontIconAttrs } from '../core/nodePresentation';
import { textLabelBg } from './labeling';

interface FontIconElementMethods {
  setClass: (size?: string, status?: string) => void;
  getSizeFromClass: (sizeClass: string) => number;
}

type FontIconElementInstance = IconElementInstance<FontIconElementMethods>;

export const FontIconElement: IconElementConstructor = createIconElement<FontIconElementMethods>({
  type: 'noc.FontIconElement',
  attrs: {
    icon: getDefaultFontIconAttrs(),
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
    }
  },
  iconMarkup: { tagName: 'text', selector: 'icon', className: 'scalable' },
  getBreakWidth: (instance, iconAttrs) => instance.getSizeFromClass(getString(iconAttrs, 'size')) * 2,
  onIconInit: (instance, iconAttrs) => {
    instance.setClass(getString(iconAttrs, 'size'), getString(iconAttrs, 'status'));
  },
  onIconAttrsChange: (instance, iconAttrs) => {
    instance.setClass(getString(iconAttrs, 'size'), getString(iconAttrs, 'status'));
  },
  methods: {
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
});
