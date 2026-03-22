import type * as joint from '@joint/core';
import {
  buildNodePresentationAttrs,
  getNodePresentationOverrides,
  type NodePresentationModel
} from './nodePresentation';

type AttrMap = Record<string, unknown>;

function isRecord(value: unknown): value is AttrMap {
  return typeof value === 'object' && value !== null;
}

function getString(record: AttrMap, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function isStatusSupportedElement(cell: joint.dia.Cell | null | undefined): cell is joint.dia.Element {
  if (!cell?.isElement()) {
    return false;
  }

  const type = String(cell.get('type') ?? '');
  return type === 'noc.FontIconElement' || type === 'noc.ImageIconElement';
}

export function readElementStatus(element: joint.dia.Element): string | null {
  const data = isRecord(element.get('data')) ? element.get('data') : {};
  const type = String(element.get('type') ?? '');
  const attrStatus = String(element.attr('icon/status') ?? '').trim();
  const fallbackStatus = attrStatus.length > 0 ? attrStatus : null;

  if (type === 'noc.ImageIconElement') {
    return getString(data, 'status') ?? fallbackStatus;
  }

  return getString(data, 'status') ?? getString(data, 'iconStatusClass') ?? fallbackStatus;
}

export function applyElementStatus(element: joint.dia.Element, status: string): boolean {
  const normalizedStatus = status.trim();
  if (normalizedStatus.length === 0 || !isStatusSupportedElement(element)) {
    return false;
  }

  const currentData = isRecord(element.get('data')) ? element.get('data') : {};
  const nextData: AttrMap = { ...currentData, status: normalizedStatus };
  const type = String(element.get('type') ?? '');
  if (type === 'noc.FontIconElement') {
    nextData.iconStatusClass = normalizedStatus;
  }

  const nextPresentationModel = buildPresentationModelForElement(element, normalizedStatus);
  const nextAttrs = buildNodePresentationAttrs(
    nextPresentationModel,
    getNodePresentationOverrides(element.get('attrs'))
  );

  element.set('data', nextData);
  element.set('attrs', nextAttrs);
  return true;
}

function buildPresentationModelForElement(element: joint.dia.Element, status: string): NodePresentationModel {
  const type = String(element.get('type') ?? '');
  const iconText = String(element.attr('icon/text') ?? '');
  const iconSize = String(element.attr('icon/size') ?? '');
  const iconHref = String(element.attr('icon/href') ?? element.attr('icon/xlinkHref') ?? '');
  const titleText = String(element.attr('title/text') ?? '');
  const ipaddrText = String(element.attr('ipaddr/text') ?? '');

  if (type === 'noc.ImageIconElement') {
    const size = element.size();
    return {
      kind: 'image',
      width: size.width,
      height: size.height,
      iconHref,
      iconStatus: status,
      titleText,
      ipaddrText
    };
  }

  return {
    kind: 'font',
    iconUnicode: iconText,
    iconSizeClass: iconSize,
    iconStatus: status,
    titleText,
    ipaddrText
  };
}
