import { createIconElement, getNumber, getString, IconElementInstance } from './iconElementFactory';
import { textLabelBg } from './labeling';

let stencilDir = '/stencils';

interface ImageIconElementMethods {
  setStatus: (filter: string) => void;
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

export const ImageIconElement = createIconElement<ImageIconElementMethods>({
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

    const statusValue = getString(iconAttrs, 'status');
    if (statusValue.length > 0) {
      instance.setStatus(statusValue);
    }
  },
  onIconAttrsChange: (instance, iconAttrs) => {
    syncImageHref(instance as ImageIconElementInstance, iconAttrs);

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
