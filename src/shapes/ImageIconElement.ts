import { getDefaultImageIconAttrs, getImageStatusFilter } from '../core/nodePresentation';
import { createIconElement, getNumber, getString, IconElementConstructor, IconElementInstance } from './iconElementFactory';
import { textLabelBg } from './labeling';

let stencilDir = '/stencils';

interface ImageIconElementMethods {
  setStatus: (statusCode: number) => void;
  convertImageIdToPath: (href: string) => string;
}

type ImageIconElementInstance = IconElementInstance<ImageIconElementMethods>;

function syncImageHref(
  instance: ImageIconElementInstance,
  iconAttrs: Record<string, unknown>
): void {
  const currentHref = getString(iconAttrs, 'href');
  const currentXlinkHref = getString(iconAttrs, 'xlinkHref');
  const nextHref = currentXlinkHref || currentHref;
  if (nextHref.length === 0) {
    return;
  }

  const normalizedHref = instance.convertImageIdToPath(nextHref);
  if (currentHref !== normalizedHref) {
    instance.attr('icon/href', normalizedHref);
  }
  if (currentXlinkHref !== normalizedHref) {
    instance.attr('icon/xlinkHref', normalizedHref);
  }
}

export function setStencilDir(dir: string): void {
  stencilDir = dir;
}

export function getStencilDir(): string {
  return stencilDir;
}

export const ImageIconElement: IconElementConstructor = createIconElement<ImageIconElementMethods>({
  type: 'noc.ImageIconElement',
  attrs: {
    icon: {
      ...getDefaultImageIconAttrs(),
      xlinkHref: '',
      preserveAspectRatio: 'xMidYMid meet'
    },
    nodeName: {
      text: 'New Object',
      fill: '#000000',
      ...textLabelBg,
      ref: 'icon',
      refX: '50%',
      refY: '105%',
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
      refY: '105%',
      textAnchor: 'middle',
      lineHeight: '1em',
      display: 'none'
    }
  },
  iconMarkup: { tagName: 'image', selector: 'icon', className: 'scalable' },
  getBreakWidth: (_instance, iconAttrs) => getNumber(iconAttrs, 'width', 64) * 2,
  onIconInit: (instance, iconAttrs) => {
    syncImageHref(instance as ImageIconElementInstance, iconAttrs);
    instance.setStatus(getNumber(iconAttrs, 'status_code', 0));
  },
  onIconAttrsChange: (instance, iconAttrs) => {
    syncImageHref(instance as ImageIconElementInstance, iconAttrs);
    instance.setStatus(getNumber(iconAttrs, 'status_code', 0));
  },
  methods: {
    setStatus: function (this: ImageIconElementInstance, statusCode: number): void {
      const filter = getImageStatusFilter(statusCode);
      this.attr('icon/filter', `url(#${filter})`);
      const embeddedCells = this.getEmbeddedCells();
      embeddedCells.forEach((badge) => {
        badge.attr('body/filter', `url(#${filter})`);
        badge.attr('text/filter', `url(#${filter})`);
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
