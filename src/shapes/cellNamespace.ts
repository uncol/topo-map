import * as joint from '@joint/core';
import { createFontIconElement } from './FontIconElement';
import { createImageIconElement } from './ImageIconElement';
import { LinkElement } from './LinkElement';
import { getLabelWrapMode, LabelWrapMode } from './labeling';

const shapesRecord = joint.shapes as Record<string, unknown>;

const namespaceCache = new Map<LabelWrapMode, Record<string, unknown>>();

export function createCellNamespace(): Record<string, unknown> {
  const wrapMode = getLabelWrapMode();
  const cached = namespaceCache.get(wrapMode);
  if (cached) {
    return cached;
  }

  const namespace: Record<string, unknown> = {
    noc: {
      FontIconElement: createFontIconElement(),
      ImageIconElement: createImageIconElement(),
      LinkElement
    },
    ...shapesRecord
  };

  namespaceCache.set(wrapMode, namespace);
  return namespace;
}
