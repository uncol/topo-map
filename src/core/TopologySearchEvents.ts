import type { TopologyNodeSearchField, TopologyNodeSearchResult } from './types';

export const TOPOLOGY_NODE_SEARCH_REQUEST_EVENT = 'topology:node-search:request';
export const TOPOLOGY_NODE_SEARCH_RESULT_EVENT = 'topology:node-search:result';

export type TopologyNodeSearchMode = 'labelAndMove' | 'idAndMove';

export interface TopologyNodeSearchRequestDetail {
  query: string;
  mode?: TopologyNodeSearchMode;
  durationMs?: number;
}

export interface TopologyNodeSearchResultDetail extends Partial<TopologyNodeSearchResult> {
  query: string;
  mode: TopologyNodeSearchMode;
  field: TopologyNodeSearchField;
  found: boolean;
}

export function isTopologyNodeSearchMode(value: unknown): value is TopologyNodeSearchMode {
  return value === 'labelAndMove' || value === 'idAndMove';
}

export function normalizeTopologyNodeSearchMode(value: unknown): TopologyNodeSearchMode {
  return isTopologyNodeSearchMode(value) ? value : 'labelAndMove';
}

export function isTopologyNodeSearchRequestDetail(value: unknown): value is TopologyNodeSearchRequestDetail {
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
