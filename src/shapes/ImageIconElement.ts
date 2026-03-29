import { getDefaultImageIconAttrs, getImageStatusFilter } from '../core/nodePresentation';
import { createIconElement, getNumber, getString, IconElementConstructor, IconElementInstance } from './iconElementFactory';
import { buildBadgeMarkup, getBadgeGeometry, getBadgeSelectors, getShapeOverlays } from './iconBadges';
import { textLabelBg } from './labeling';

let stencilDir = '/stencils';

interface ImageIconElementMethods {
  setStatus: (statusCode: number) => void;
  convertImageIdToPath: (href: string) => string;
}

type ImageIconElementInstance = IconElementInstance<ImageIconElementMethods>;

function buildImageBadgeMarkup(instance: ImageIconElementInstance) {
  return buildBadgeMarkup(getShapeOverlays(instance.get('data')));
}

function buildImageBadgeAttrs(instance: ImageIconElementInstance): Record<string, unknown> {
  const overlays = getShapeOverlays(instance.get('data'));
  const filter = `url(#${getImageStatusFilter(instance.attr('icon/status_code'))})`;

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
          strokeWidth: 0.5,
          filter
        }
      : {
          x: geometry.x,
          y: geometry.y,
          width: geometry.size,
          height: geometry.size,
          strokeWidth: 0.5,
          filter
        };

    attrs[selectors.text] = {
      text: String.fromCodePoint(overlay.code),
      x: centerX,
      y: centerY,
      xAlignment: 'middle',
      yAlignment: 'middle',
      textAnchor: 'middle',
      textVerticalAnchor: 'middle',
      class: 'gf',
      filter
    };

    return attrs;
  }, {});
}

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
  buildExtraMarkup: (instance) => buildImageBadgeMarkup(instance as ImageIconElementInstance),
  buildExtraAttrs: (instance) => buildImageBadgeAttrs(instance as ImageIconElementInstance),
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
      getShapeOverlays(this.get('data')).forEach((overlay) => {
        const selectors = getBadgeSelectors(overlay.position);
        this.attr(`${selectors.body}/filter`, `url(#${filter})`);
        this.attr(`${selectors.text}/filter`, `url(#${filter})`);
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
