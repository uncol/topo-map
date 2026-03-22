export const DEFAULT_FONT_ICON_UNICODE = '\uF20A';
export const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
export const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-unknown';
export const DEFAULT_IMAGE_ICON_STATUS = 'Unknown';

const DEFAULT_IMAGE_ICON_WIDTH = 64;
const DEFAULT_IMAGE_ICON_HEIGHT = 64;

type AttrMap = Record<string, unknown>;

interface BaseNodePresentationModel {
  titleText?: string | undefined;
  ipaddrText?: string | undefined;
}

export interface FontNodePresentationModel extends BaseNodePresentationModel {
  kind: 'font';
  iconUnicode?: string | undefined;
  iconSizeClass?: string | undefined;
  iconStatus?: string | undefined;
}

export interface ImageNodePresentationModel extends BaseNodePresentationModel {
  kind: 'image';
  width: number;
  height: number;
  iconHref: string;
  iconStatus?: string | undefined;
}

export type NodePresentationModel = FontNodePresentationModel | ImageNodePresentationModel;

function isRecord(value: unknown): value is AttrMap {
  return typeof value === 'object' && value !== null;
}

function getNonEmptyText(value: string | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getNestedRecord(parent: AttrMap, key: string): AttrMap {
  const value = parent[key];
  return isRecord(value) ? value : {};
}

function omitKeys(record: AttrMap, keys: string[]): AttrMap {
  const nextRecord = { ...record };
  keys.forEach((key) => {
    delete nextRecord[key];
  });
  return nextRecord;
}

function buildLabelAttrs(text: string | undefined, customAttrs: AttrMap): AttrMap | undefined {
  if (text === undefined && Object.keys(customAttrs).length === 0) {
    return undefined;
  }

  const nextAttrs = { ...customAttrs };
  if (text !== undefined && !('text' in nextAttrs)) {
    nextAttrs.text = text;
  }
  return nextAttrs;
}

function mergeNodeAttrs(
  customAttrs: AttrMap,
  iconAttrs: AttrMap,
  titleText: string | undefined,
  ipaddrText: string | undefined
): AttrMap {
  const nextAttrs: AttrMap = {
    ...customAttrs,
    icon: {
      ...iconAttrs,
      ...getNestedRecord(customAttrs, 'icon')
    }
  };

  const titleAttrs = buildLabelAttrs(titleText, getNestedRecord(customAttrs, 'title'));
  if (titleAttrs) {
    nextAttrs.title = titleAttrs;
  }

  const ipaddrAttrs = buildLabelAttrs(ipaddrText, getNestedRecord(customAttrs, 'ipaddr'));
  if (ipaddrAttrs) {
    nextAttrs.ipaddr = ipaddrAttrs;
  }

  return nextAttrs;
}

export function getDefaultFontIconAttrs(): AttrMap {
  return {
    text: DEFAULT_FONT_ICON_UNICODE,
    size: DEFAULT_FONT_ICON_SIZE_CLASS,
    status: DEFAULT_FONT_ICON_STATUS_CLASS
  };
}

export function getDefaultImageIconAttrs(
  width = DEFAULT_IMAGE_ICON_WIDTH,
  height = DEFAULT_IMAGE_ICON_HEIGHT
): AttrMap {
  return {
    width: String(width),
    height: String(height),
    status: DEFAULT_IMAGE_ICON_STATUS
  };
}

export function buildNodePresentationAttrs(model: NodePresentationModel, customAttrs: AttrMap = {}): AttrMap {
  if (model.kind === 'image') {
    const iconStatus = getNonEmptyText(model.iconStatus) ?? DEFAULT_IMAGE_ICON_STATUS;

    return mergeNodeAttrs(
      customAttrs,
      {
        href: model.iconHref,
        ...getDefaultImageIconAttrs(model.width, model.height),
        status: iconStatus
      },
      model.titleText,
      model.ipaddrText
    );
  }

  const iconUnicode = getNonEmptyText(model.iconUnicode) ?? DEFAULT_FONT_ICON_UNICODE;
  const iconSizeClass = getNonEmptyText(model.iconSizeClass) ?? DEFAULT_FONT_ICON_SIZE_CLASS;
  const iconStatus = getNonEmptyText(model.iconStatus) ?? DEFAULT_FONT_ICON_STATUS_CLASS;

  return mergeNodeAttrs(
    customAttrs,
    {
      ...getDefaultFontIconAttrs(),
      text: iconUnicode,
      size: iconSizeClass,
      status: iconStatus
    },
    model.titleText,
    model.ipaddrText
  );
}

export function getNodePresentationOverrides(attrs: unknown): AttrMap {
  if (!isRecord(attrs)) {
    return {};
  }

  const nextAttrs: AttrMap = { ...attrs };
  const iconOverrides = omitKeys(getNestedRecord(nextAttrs, 'icon'), [
    'text',
    'size',
    'status',
    'href',
    'width',
    'height',
    'class',
    'filter'
  ]);
  const titleOverrides = omitKeys(getNestedRecord(nextAttrs, 'title'), ['text']);
  const ipaddrOverrides = omitKeys(getNestedRecord(nextAttrs, 'ipaddr'), ['text']);

  if (Object.keys(iconOverrides).length > 0) {
    nextAttrs.icon = iconOverrides;
  } else {
    delete nextAttrs.icon;
  }

  if (Object.keys(titleOverrides).length > 0) {
    nextAttrs.title = titleOverrides;
  } else {
    delete nextAttrs.title;
  }

  if (Object.keys(ipaddrOverrides).length > 0) {
    nextAttrs.ipaddr = ipaddrOverrides;
  } else {
    delete nextAttrs.ipaddr;
  }

  return nextAttrs;
}
