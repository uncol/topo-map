import * as joint from '@joint/core';
import { describe, expect, it } from 'vitest';
import { DataFacade } from '../src/core/DataFacade';

function createGraph() {
  return new joint.dia.Graph({}, { cellNamespace: {} });
}

describe('DataFacade', () => {
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

    const api = new DataFacade(graph);

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

    const api = new DataFacade(graph);
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

  it('gets and sets status for one or many supported elements', () => {
    const graph = createGraph();
    graph.addCells([
      new joint.dia.Element({
        id: 'node-1',
        type: 'noc.FontIconElement',
        size: { width: 64, height: 64 },
        attrs: {
          icon: {
            text: '\uF20A',
            size: 'gf-1x',
            status: 'gf-ok'
          },
          title: {
            text: 'alpha'
          }
        },
        data: {
          id: 'node-1',
          status: 'gf-ok',
          iconStatusClass: 'gf-ok'
        }
      }),
      new joint.dia.Element({
        id: 'node-2',
        type: 'noc.ImageIconElement',
        size: { width: 64, height: 64 },
        attrs: {
          icon: {
            href: '#img-Cisco-router',
            width: '64',
            height: '64',
            status: 'Warning'
          },
          title: {
            text: 'beta'
          }
        },
        data: {
          id: 'node-2',
          status: 'Warning'
        }
      })
    ]);

    const api = new DataFacade(graph);

    expect(api.elements.getStatus('node-1')).toBe('gf-ok');
    expect(api.elements.getStatuses(['node-1', 'node-2', 'missing'])).toEqual([
      { id: 'node-1', status: 'gf-ok' },
      { id: 'node-2', status: 'Warning' },
      { id: 'missing', status: null }
    ]);

    expect(api.elements.setStatus('node-1', 'gf-fail')).toBe(true);
    expect(api.elements.getStatus('node-1')).toBe('gf-fail');
    expect(api.elements.setStatuses(['node-1', 'missing', 'node-2'], 'Critical')).toEqual(['node-1', 'node-2']);
    expect(api.elements.getStatuses(['node-1', 'node-2'])).toEqual([
      { id: 'node-1', status: 'Critical' },
      { id: 'node-2', status: 'Critical' }
    ]);
  });
});
