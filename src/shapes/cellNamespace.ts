import * as joint from '@joint/core';
import { NetworkLink } from './NetworkLink';
import { NetworkNode } from './NetworkNode';

const shapesRecord = joint.shapes as unknown as Record<string, unknown>;
const maybeTopology = shapesRecord.topology;
const existingTopology: Record<string, unknown> =
  typeof maybeTopology === 'object' && maybeTopology !== null
    ? (maybeTopology as Record<string, unknown>)
    : {};

export const cellNamespace: Record<string, unknown> = {
  ...shapesRecord,
  topology: {
    ...existingTopology,
    NetworkNode,
    NetworkLink
  }
};
