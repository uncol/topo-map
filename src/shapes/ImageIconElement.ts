import { labelBgAttrs, labelFoAttrs, textLabelBg } from './labeling';
import { createIconElement, getNumber, getString, IconElementInstance } from './iconElementFactory';

let stencilDir = '/stencils';

interface ImageIconElementMethods {
  setStatus: (filter: string) => void;
  convertImageIdToPath: (href: string) => string;
}

type ImageIconElementInstance = IconElementInstance<ImageIconElementMethods>;

export function setStencilDir(dir: string): void {
  stencilDir = dir;
}

export function getStencilDir(): string {
  return stencilDir;
}

export function createImageIconElement() {
  return createIconElement<ImageIconElementMethods>({
    type: 'noc.ImageIconElement',
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
      ...labelFoAttrs,
      ...labelBgAttrs
    },
    iconMarkup: { tagName: 'image', selector: 'icon', className: 'scalable' },
    getBreakWidth: (_instance, iconAttrs) => getNumber(iconAttrs, 'width', 64) * 2,
    onIconInit: (instance, iconAttrs) => {
      const initialHrefCandidate = getString(iconAttrs, 'xlinkHref') || getString(iconAttrs, 'href');
      if (initialHrefCandidate.length > 0) {
        if (initialHrefCandidate.startsWith('#img-')) {
          const path = instance.convertImageIdToPath(initialHrefCandidate);
          instance.attr('icon/xlinkHref', path);
        } else if (getString(iconAttrs, 'xlinkHref').length === 0 && getString(iconAttrs, 'href').length > 0) {
          instance.attr('icon/xlinkHref', initialHrefCandidate);
        }
      }

      const statusValue = getString(iconAttrs, 'status');
      if (statusValue.length > 0) {
        instance.setStatus(statusValue);
      }
    },
    onIconAttrsChange: (instance, iconAttrs) => {
      const nextHref = getString(iconAttrs, 'xlinkHref') || getString(iconAttrs, 'href');
      if (nextHref.length > 0 && nextHref.startsWith('#img-')) {
        const path = instance.convertImageIdToPath(nextHref);
        instance.attr('icon/xlinkHref', path);
      } else if (nextHref.length > 0 && getString(iconAttrs, 'xlinkHref').length === 0) {
        instance.attr('icon/xlinkHref', nextHref);
      }

      const nextStatus = getString(iconAttrs, 'status');
      if (nextStatus.length > 0) {
        instance.setStatus(nextStatus);
        return;
      }

      instance.attr('icon/filter', null);
      const embeddedCells = instance.getEmbeddedCells();
      embeddedCells.forEach((badge) => {
        badge.attr('body/filter', null);
        badge.attr('text/filter', null);
      });
    },
    methods: {
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
  });
}
