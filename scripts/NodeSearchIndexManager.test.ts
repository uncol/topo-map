import * as joint from '@joint/core';
import { describe, expect, it } from 'vitest';
import { NodeSearchIndexManager } from '../src/managers/NodeSearchIndexManager';

function createGraph() {
  return new joint.dia.Graph({}, { cellNamespace: {} });
}

function createElement(
  id: string,
  dataTitle: string,
  dataIpaddr: string,
  attrsTitle = dataTitle,
  attrsIpaddr = dataIpaddr
): joint.dia.Element {
  return new joint.dia.Element({
    id,
    type: 'standard.Rectangle',
    data: {
      name: dataTitle,
      address: dataIpaddr
    },
    attrs: {
      title: { text: attrsTitle },
      ipaddr: { text: attrsIpaddr }
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

  it('uses data fields instead of attrs fields for label search', () => {
    const graph = createGraph();
    graph.addCell(createElement('node-1', 'Data Name', '10.10.10.1', 'Attrs Name', '10.10.10.2'));

    const index = new NodeSearchIndexManager(graph);

    expect(index.search('title', 'data name')).toEqual({
      id: 'node-1',
      text: 'Data Name',
      field: 'title'
    });
    expect(index.search('title', 'attrs name')).toBeNull();
    expect(index.search('ipaddr', '10.10.10.1')).toEqual({
      id: 'node-1',
      text: '10.10.10.1',
      field: 'ipaddr'
    });
    expect(index.search('ipaddr', '10.10.10.2')).toBeNull();

    index.destroy();
  });

  it('rebuilds the index when data changes', () => {
    const graph = createGraph();
    const element = createElement('node-1', 'Old Name', '192.168.0.1');
    graph.addCell(element);

    const index = new NodeSearchIndexManager(graph);
    element.set('data', {
      name: 'New Name',
      address: '192.168.0.2'
    });

    expect(index.search('title', 'new name')).toEqual({
      id: 'node-1',
      text: 'New Name',
      field: 'title'
    });
    expect(index.search('ipaddr', '192.168.0.2')).toEqual({
      id: 'node-1',
      text: '192.168.0.2',
      field: 'ipaddr'
    });
    expect(index.search('title', 'old name')).toBeNull();

    index.destroy();
  });

  it('does not rebuild the index when only attrs change', () => {
    const graph = createGraph();
    const element = createElement('node-1', 'Stable Name', '192.168.0.1');
    graph.addCell(element);

    const index = new NodeSearchIndexManager(graph);
    element.attr('title/text', 'Attrs Only Name');
    element.attr('ipaddr/text', '192.168.0.2');

    expect(index.search('title', 'stable name')).toEqual({
      id: 'node-1',
      text: 'Stable Name',
      field: 'title'
    });
    expect(index.search('title', 'attrs only name')).toBeNull();
    expect(index.search('ipaddr', '192.168.0.1')).toEqual({
      id: 'node-1',
      text: '192.168.0.1',
      field: 'ipaddr'
    });
    expect(index.search('ipaddr', '192.168.0.2')).toBeNull();

    index.destroy();
  });

  it('finds nodes by id for the id-and-move mode', () => {
    const graph = createGraph();
    graph.addCells([
      createElement('node-access-01', 'Access Switch Alpha', '10.10.0.1'),
      createElement('node-core-01', 'Core Router', '10.10.0.254')
    ]);

    const index = new NodeSearchIndexManager(graph);

    expect(index.search('id', 'core-01')).toEqual({
      id: 'node-core-01',
      text: 'node-core-01',
      field: 'id'
    });

    index.destroy();
  });
});
