import * as joint from '@joint/core';
import { describe, expect, it } from 'vitest';
import { NodeSearchIndexManager } from '../src/managers/NodeSearchIndexManager';

function createGraph() {
  return new joint.dia.Graph({}, { cellNamespace: {} });
}

function createElement(id: string, title: string, ipaddr: string): joint.dia.Element {
  return new joint.dia.Element({
    id,
    type: 'standard.Rectangle',
    attrs: {
      title: { text: title },
      ipaddr: { text: ipaddr }
    }
  });
}

describe('NodeSearchIndexManager', () => {
  it('finds exact and prefix matches without scanning the whole graph linearly', () => {
    const graph = createGraph();
    graph.addCells([
      createElement('node-1', 'Access Switch Alpha', '10.10.0.1'),
      createElement('node-2', 'Core Router', '10.10.0.254')
    ]);

    const index = new NodeSearchIndexManager(graph);

    expect(index.search('title', 'core router')).toEqual({
      id: 'node-2',
      text: 'Core Router',
      field: 'title'
    });
    expect(index.search('title', 'access')).toEqual({
      id: 'node-1',
      text: 'Access Switch Alpha',
      field: 'title'
    });

    index.destroy();
  });

  it('finds substring matches through the trigram index', () => {
    const graph = createGraph();
    graph.addCells([
      createElement('node-1', 'Distribution Layer', '10.0.0.1'),
      createElement('node-2', 'Metro Aggregation Edge', '10.0.0.2')
    ]);

    const index = new NodeSearchIndexManager(graph);

    expect(index.search('title', 'gation')).toEqual({
      id: 'node-2',
      text: 'Metro Aggregation Edge',
      field: 'title'
    });

    index.destroy();
  });

  it('rebuilds the index when attrs change', () => {
    const graph = createGraph();
    const element = createElement('node-1', 'Old Name', '192.168.0.1');
    graph.addCell(element);

    const index = new NodeSearchIndexManager(graph);
    element.attr('title/text', 'New Name');

    expect(index.search('title', 'new name')).toEqual({
      id: 'node-1',
      text: 'New Name',
      field: 'title'
    });

    index.destroy();
  });
});
