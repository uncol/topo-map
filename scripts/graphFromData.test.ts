import { describe, expect, it } from 'vitest';
import { createGraphFromData } from '../src/core/graphFromData';

describe('createGraphFromData', () => {
  it('creates node data records for elements loaded through loadData', () => {
    const graph = createGraphFromData([
      {
        id: 'node-1',
        x: 10,
        y: 20,
        label: 'Core',
        iconStatusClass: 'gf-ok'
      }
    ], []);

    expect(graph.cells).toHaveLength(1);
    expect(graph.cells[0]).toMatchObject({
      id: 'node-1',
      type: 'noc.FontIconElement',
      attrs: {
        title: {
          text: 'Core'
        },
        icon: {
          status: 'gf-ok'
        }
      },
      data: {
        id: 'node-1',
        label: 'Core',
        iconStatusClass: 'gf-ok'
      }
    });
  });

  it('creates image nodes when iconHref is provided', () => {
    const graph = createGraphFromData([
      {
        id: 'node-1',
        x: 10,
        y: 20,
        label: 'Router',
        iconHref: '#img-Cisco-router',
        status: 'Warning'
      }
    ], []);

    expect(graph.cells).toHaveLength(1);
    expect(graph.cells[0]).toMatchObject({
      id: 'node-1',
      type: 'noc.ImageIconElement',
      attrs: {
        icon: {
          href: '#img-Cisco-router',
          status: 'Warning'
        },
        title: {
          text: 'Router'
        }
      },
      data: {
        id: 'node-1',
        label: 'Router',
        status: 'Warning',
        iconHref: '#img-Cisco-router'
      }
    });
  });

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
