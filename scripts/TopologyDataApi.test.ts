import * as joint from '@joint/core';
import { describe, expect, it } from 'vitest';
import { TopologyDataFacade } from '../src/core/TopologyDataApi';

function createGraph() {
  return new joint.dia.Graph({}, { cellNamespace: {} });
}

describe('TopologyDataFacade', () => {
  it('returns element ids filtered by data.type', () => {
    const graph = createGraph();
    graph.addCells([
      new joint.dia.Element({
        id: 'node-1',
        type: 'standard.Rectangle',
        data: { type: 'managedobject', name: 'alpha' }
      }),
      new joint.dia.Element({
        id: 'node-2',
        type: 'standard.Rectangle',
        data: { type: 'segment', name: 'beta' }
      }),
      new joint.dia.Link({
        id: 'link-1',
        type: 'standard.Link',
        source: { x: 0, y: 0 },
        target: { x: 100, y: 100 },
        data: { type: 'managedobject' }
      })
    ]);

    const api = new TopologyDataFacade(graph);

    expect(api.elements.getIdsByDataType('managedobject')).toEqual(['node-1']);
  });

  it('returns cloned records for elements and links', () => {
    const graph = createGraph();
    graph.addCells([
      new joint.dia.Element({
        id: 'node-1',
        type: 'standard.Rectangle',
        data: { type: 'managedobject', nested: { name: 'alpha' } }
      }),
      new joint.dia.Link({
        id: 'link-1',
        type: 'standard.Link',
        source: { x: 0, y: 0 },
        target: { x: 100, y: 100 },
        data: { type: 'uplink', nested: { weight: 10 } }
      })
    ]);

    const api = new TopologyDataFacade(graph);
    const elementRecord = api.elements.getById<{ type: string; nested: { name: string } }>('node-1');
    const linkRecord = api.links.getById<{ type: string; nested: { weight: number } }>('link-1');

    expect(elementRecord).toEqual({
      id: 'node-1',
      data: { type: 'managedobject', nested: { name: 'alpha' } }
    });
    expect(linkRecord).toEqual({
      id: 'link-1',
      data: { type: 'uplink', nested: { weight: 10 } }
    });

    if (!elementRecord || !linkRecord) {
      return;
    }

    elementRecord.data.nested.name = 'changed';
    linkRecord.data.nested.weight = 99;

    expect(api.elements.getById<{ type: string; nested: { name: string } }>('node-1')?.data.nested.name).toBe('alpha');
    expect(api.links.getById<{ type: string; nested: { weight: number } }>('link-1')?.data.nested.weight).toBe(10);
  });
});
