import { describe, expect, it } from 'vitest';
import { createGraphFromData } from '../src/core/graphFromData';

describe('createGraphFromData', () => {
  it('passes link data through to the graph JSON', () => {
    const graph = createGraphFromData([], [
      {
        id: 'link-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        data: {
          bw: 1_000_000_000,
          method: 'lldp'
        }
      }
    ]);

    expect(graph.cells).toHaveLength(1);
    expect((graph.cells[0] as Record<string, unknown>).data).toEqual({
      bw: 1_000_000_000,
      method: 'lldp'
    });
  });
});
