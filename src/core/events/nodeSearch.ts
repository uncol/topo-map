import type { NodeSearchField, NodeSearchResult } from '../types';

export const TOPOLOGY_NODE_SEARCH_REQUEST_EVENT = 'topology:node-search:request';
export const TOPOLOGY_NODE_SEARCH_RESULT_EVENT = 'topology:node-search:result';

export type NodeSearchMode = 'labelAndMove' | 'idAndMove';

export interface NodeSearchRequestDetail {
  query: string;
  mode?: NodeSearchMode;
  durationMs?: number;
}

export interface NodeSearchResultDetail extends Partial<NodeSearchResult> {
  query: string;
  mode: NodeSearchMode;
  field: NodeSearchField;
  found: boolean;
}

export function isTopologyNodeSearchMode(value: unknown): value is NodeSearchMode {
  return value === 'labelAndMove' || value === 'idAndMove';
}

export function normalizeTopologyNodeSearchMode(value: unknown): NodeSearchMode {
  return isTopologyNodeSearchMode(value) ? value : 'labelAndMove';
}

export function isTopologyNodeSearchRequestDetail(value: unknown): value is NodeSearchRequestDetail {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('query' in value) || typeof (value as { query?: unknown }).query !== 'string') {
    return false;
  }

  if ('mode' in value && !isTopologyNodeSearchMode((value as { mode?: unknown }).mode)) {
    return false;
  }

  if (
    'durationMs' in value &&
    typeof (value as { durationMs?: unknown }).durationMs !== 'undefined' &&
    typeof (value as { durationMs?: unknown }).durationMs !== 'number'
  ) {
    return false;
  }

  return true;
}
