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
          status_code: 1
        }
      },
      data: {
        id: 'node-1',
        isMaintenance: false,
        name: 'Core',
        status_code: 1,
        metrics_label: undefined
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
        statusCode: 0
      }
    ], []);

    expect(graph.cells).toHaveLength(1);
    expect(graph.cells[0]).toMatchObject({
      id: 'node-1',
      type: 'noc.ImageIconElement',
      attrs: {
        icon: {
          href: '#img-Cisco-router',
          status_code: 0
        },
        title: {
          text: 'Router'
        }
      },
      data: {
        id: 'node-1',
        isMaintenance: false,
        name: 'Router',
        status_code: 0,
        metrics_label: undefined,
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
