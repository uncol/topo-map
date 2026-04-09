import { describe, expect, it, vi } from 'vitest';
import { MapDocument } from '../src/core/MapDocument';
import { Topology } from '../src/Topology';
import type { Interface, PaperConfig } from '../src/core/types';

function createTopologyInterfacesHarness(): any {
  const topology = Object.create(Topology.prototype) as any;

  topology.config = {
    preserveViewportOnLoad: true,
    gridSize: 20,
    mainContainer: {
      dispatchEvent: vi.fn()
    }
  };
  topology.currentPaperConfig = {};
  topology.interfaces = [];
  topology.events = { clearInteractionState: vi.fn() };
  topology.moveHistory = { clear: vi.fn() };
  topology.emitHistoryAvailabilityChanges = vi.fn();
  topology.applyMapPaperConfig = vi.fn((paperConfig: PaperConfig) => {
    topology.currentPaperConfig = { ...paperConfig };
  });
  topology.diagramService = {
    fromJSON: vi.fn(),
    toJSON: vi.fn(() => ({ cells: [] }))
  };
  topology.mapBoundsState = { refreshNow: vi.fn() };
  topology.viewportManager = { rebuildIndex: vi.fn() };
  topology.nodeSearchIndexManager = { rebuildIndex: vi.fn() };
  topology.viewportState = {
    enforceConstraints: vi.fn(),
    getSnapshot: vi.fn(() => ({ scale: 2, tx: 30, ty: 40 }))
  };
  topology.minimapManager = { refresh: vi.fn() };
  topology.debug = { log: vi.fn() };

  return topology;
}

describe('Topology interfaces API', () => {
  it('loads interfaces from MapDocument and returns them via getter', () => {
    const topology = createTopologyInterfacesHarness();
    const interfaces: Interface[] = [
      {
        id: '22',
        tags: {
          object: 'T-16@10018',
          interface: 'port0'
        }
      }
    ];

    topology.loadDocument(MapDocument.fromGraph({ cells: [] }, undefined, { name: 'test' }, interfaces));

    expect(topology.getInterfaces()).toEqual(interfaces);
  });

  it('includes interfaces in toDocumentJSON()', () => {
    const topology = createTopologyInterfacesHarness();
    const interfaces: Interface[] = [
      {
        id: '33',
        tags: {
          object: 'core-sw-1',
          interface: 'xe-0/0/0'
        }
      }
    ];

    topology.interfaces = interfaces;
    topology.currentPaperConfig = { name: 'serialized' };

    expect(topology.toDocumentJSON()).toMatchObject({
      interfaces,
      paperConfig: { name: 'serialized' },
      viewport: { scale: 2, tx: 30, ty: 40 }
    });
  });
});
