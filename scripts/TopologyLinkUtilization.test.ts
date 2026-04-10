import * as joint from '@joint/core';
import { describe, expect, it, vi } from 'vitest';
import { DataFacade } from '../src/core/DataFacade';
import { Topology } from '../src/Topology';
import { LinkElement } from '../src/shapes/LinkElement';

function createGraph() {
  return new joint.dia.Graph({}, { cellNamespace: {} });
}

function createTopologyLinkUtilizationHarness(graph: joint.dia.Graph): any {
  const topology = Object.create(Topology.prototype) as any;

  topology.diagramService = {
    getGraph: () => graph
  };
  topology.data = new DataFacade(graph);
  topology.debug = { log: vi.fn() };

  return topology;
}

describe('Topology link utilization API', () => {
  it('applies utilization color by threshold and sets balance point from link bandwidth', () => {
    const graph = createGraph();
    const link = new LinkElement({
      id: 'link-1',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
      data: {
        id: 'link-1',
        in_bw: 75,
        out_bw: 25
      }
    });
    graph.addCell(link);
    const topology = createTopologyLinkUtilizationHarness(graph);

    expect(topology.setLinkUtilization('link-1', 0.96)).toBe(true);
    expect(link.attr('line/stroke')).toBe('#ff0000');
    expect(link.label(0)?.position).toBe(0.75);
    expect(link.label(0)?.attrs?.text?.text).toBe(String.fromCodePoint(0xE280));
    expect(link.label(0)?.attrs?.text?.fontFamily).toBe('GufoFont');
    expect(link.label(0)?.attrs?.text?.fill).toBe('#ff0000');

    expect(topology.setLinkUtilization('link-1', 0.8)).toBe(true);
    expect(link.attr('line/stroke')).toBe('#990000');

    expect(topology.setLinkUtilization('link-1', 0.5)).toBe(true);
    expect(link.attr('line/stroke')).toBe('#ff9933');

    expect(topology.setLinkUtilization('link-1', 0.2)).toBe(true);
    expect(link.attr('line/stroke')).toBe('#006600');
  });

  it('hides the balance point when in and out are zero', () => {
    const graph = createGraph();
    const link = new LinkElement({
      id: 'link-1',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
      data: {
        id: 'link-1'
      }
    });
    graph.addCell(link);
    const topology = createTopologyLinkUtilizationHarness(graph);

    expect(topology.setLinkUtilization('link-1', -1)).toBe(true);
    expect(link.attr('line/stroke')).toBe('#006600');
    expect(link.label(0)?.position).toBe(0.5);
    expect(link.label(0)?.attrs?.text?.visibility).toBe('hidden');
  });

  it('resets utilization style and removes the balance point for all links', () => {
    const graph = createGraph();
    const linkA = new LinkElement({
      id: 'link-a',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
      data: {
        id: 'link-a',
        in_bw: 10,
        out_bw: 90
      }
    });
    const linkB = new LinkElement({
      id: 'link-b',
      source: { x: 0, y: 0 },
      target: { x: 100, y: 100 },
      data: {
        id: 'link-b',
        in_bw: 20,
        out_bw: 80
      }
    });
    graph.addCells([linkA, linkB]);
    const topology = createTopologyLinkUtilizationHarness(graph);

    topology.setLinkUtilization('link-a', 1);
    topology.setLinkUtilization('link-b', 0.5);
    topology.resetAllLinkUtilization();

    expect(linkA.attr('line/stroke')).toBe('#000000');
    expect(linkB.attr('line/stroke')).toBe('#000000');
    expect(linkA.get('labels')).toEqual([]);
    expect(linkB.get('labels')).toEqual([]);
  });

  it('returns false when applying utilization to a missing link', () => {
    const graph = createGraph();
    const topology = createTopologyLinkUtilizationHarness(graph);

    expect(topology.setLinkUtilization('missing', 0.8)).toBe(false);
  });
});
