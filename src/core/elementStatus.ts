import type * as joint from '@joint/core';
import {
  buildNodePresentationAttrs,
  DEFAULT_STATUS_CODE,
  getNodePresentationOverrides,
  type NodePresentationModel
} from './nodePresentation';
import type { ElementStatusUpdate } from './types';

type AttrMap = Record<string, unknown>;

function isRecord(value: unknown): value is AttrMap {
  return typeof value === 'object' && value !== null;
}

function getString(record: AttrMap, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getNumber(record: AttrMap, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
}

export function isStatusSupportedElement(cell: joint.dia.Cell | null | undefined): cell is joint.dia.Element {
  if (!cell?.isElement()) {
    return false;
  }

  const type = String(cell.get('type') ?? '');
  return type === 'noc.FontIconElement' || type === 'noc.ImageIconElement';
}

export function readElementStatus(element: joint.dia.Element): ElementStatusUpdate | null {
  const data = isRecord(element.get('data')) ? element.get('data') : {};
  const statusCode = getNumber(data, 'status_code');
  if (typeof statusCode === 'number') {
    const metricsLabel = getString(data, 'metrics_label');
    return metricsLabel ? { status_code: statusCode, metrics_label: metricsLabel } : { status_code: statusCode };
  }

  const fallbackStatusCode = element.attr('icon/status_code');
  if (typeof fallbackStatusCode === 'number' && Number.isFinite(fallbackStatusCode)) {
    return { status_code: Math.trunc(fallbackStatusCode) };
  }

  return null;
}

export function applyElementStatus(element: joint.dia.Element, update: ElementStatusUpdate): boolean {
  if (!isStatusSupportedElement(element) || !Number.isFinite(update.status_code)) {
    return false;
  }

  const rawStatusCode = Math.trunc(update.status_code);
  const currentData = isRecord(element.get('data')) ? element.get('data') : {};
  const currentName = getString(currentData, 'name') ?? getString(currentData, 'label') ?? String(element.attr('title/text') ?? '');
  const nextMetricsLabel =
    Object.prototype.hasOwnProperty.call(update, 'metrics_label')
      ? update.metrics_label
      : getString(currentData, 'metrics_label');
  const nextData: AttrMap = {
    ...currentData,
    name: currentName,
    status_code: rawStatusCode,
    metrics_label: nextMetricsLabel
  };
  delete nextData.status;
  delete nextData.iconStatusClass;
  delete nextData.label;

  const nextPresentationModel = buildPresentationModelForElement(element, currentName, nextMetricsLabel, rawStatusCode);
  const nextAttrs = buildNodePresentationAttrs(
    nextPresentationModel,
    getNodePresentationOverrides(element.get('attrs'))
  );

  element.set('data', nextData);
  element.set('attrs', nextAttrs);
  return true;
}

function buildPresentationModelForElement(
  element: joint.dia.Element,
  name: string | undefined,
  metricsLabel: string | undefined,
  statusCode: number
): NodePresentationModel {
  const type = String(element.get('type') ?? '');
  const iconText = String(element.attr('icon/text') ?? '');
  const iconSize = String(element.attr('icon/size') ?? '');
  const iconHref = String(element.attr('icon/href') ?? element.attr('icon/xlinkHref') ?? '');
  const ipaddrText = String(element.attr('ipaddr/text') ?? '');

  if (type === 'noc.ImageIconElement') {
    const size = element.size();
    return {
      kind: 'image',
      width: size.width,
      height: size.height,
      iconHref,
      statusCode,
      name,
      metricsLabel,
      ipaddrText
    };
  }

  return {
    kind: 'font',
    iconUnicode: iconText,
    iconSizeClass: iconSize,
    statusCode,
    name,
    metricsLabel,
    ipaddrText
  };
}
