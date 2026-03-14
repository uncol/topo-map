import * as joint from '@joint/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopologyInteractionEvents } from '../src/core/events';

type PaperHandler = (...args: unknown[]) => void;

interface PaperStub {
  paper: joint.dia.Paper;
  handlers: Map<string, PaperHandler>;
}

interface ContainerStub {
  element: HTMLElement;
  events: CustomEvent<Record<string, unknown>>[];
}

function mockHighlighterAdd() {
  return vi
    .spyOn(joint.highlighters.mask, 'add')
    .mockImplementation(() => ({}) as ReturnType<typeof joint.highlighters.mask.add>);
}

function createPaperStub(): PaperStub {
  const handlers = new Map<string, PaperHandler>();

  return {
    paper: {
      on: vi.fn((eventName: string, handler: PaperHandler) => {
        handlers.set(eventName, handler);
      }),
      off: vi.fn((eventName: string, handler: PaperHandler) => {
        if (handlers.get(eventName) === handler) {
          handlers.delete(eventName);
        }
      }),
      el: {
        style: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    } as unknown as joint.dia.Paper,
    handlers
  };
}

function createContainerStub(): ContainerStub {
  const events: CustomEvent<Record<string, unknown>>[] = [];

  return {
    element: {
      dispatchEvent: vi.fn((event: Event) => {
        events.push(event as CustomEvent<Record<string, unknown>>);
        return true;
      })
    } as unknown as HTMLElement,
    events
  };
}

function createCellView(
  id: string,
  isElement: boolean,
  attr: Record<string, unknown>
): joint.dia.CellView | joint.dia.ElementView {
  return {
    model: {
      id,
      isElement: () => isElement,
      get: (key: string) => {
        if (key === 'attrs') {
          return attr;
        }
        return undefined;
      }
    }
  } as unknown as joint.dia.CellView;
}

describe('TopologyInteractionEvents', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('highlights an unselected element and emits its attrs in the highlight event', () => {
    const { paper, handlers } = createPaperStub();
    const { element, events } = createContainerStub();
    const addSpy = mockHighlighterAdd();
    vi.spyOn(joint.highlighters.mask, 'remove').mockImplementation(() => undefined);

    const topologyEvents = new TopologyInteractionEvents(element, paper, () => ({
      scale: 1,
      tx: 0,
      ty: 0,
      minScale: 0.5,
      maxScale: 2
    }));

    topologyEvents.setup();

    const attr = { body: { fill: '#fff' } };
    const elementView = createCellView('node-1', true, attr) as joint.dia.ElementView;
    const pointerDown = handlers.get('cell:pointerdown');

    expect(pointerDown).toBeTypeOf('function');
    pointerDown?.(elementView, { button: 0 }, 10, 20);

    expect(addSpy).toHaveBeenCalledWith(elementView, 'root', 'topology-element-highlight', expect.any(Object));

    const highlightEvent = events.find((event) => event.type === 'topology:cell:highlight');

    expect(highlightEvent?.detail).toMatchObject({
      id: 'node-1',
      cell: elementView,
      attr
    });
  });

  it('unhighlights the currently selected element when it is clicked again', () => {
    const { paper, handlers } = createPaperStub();
    const { element, events } = createContainerStub();
    mockHighlighterAdd();
    const removeSpy = vi.spyOn(joint.highlighters.mask, 'remove').mockImplementation(() => undefined);

    const topologyEvents = new TopologyInteractionEvents(element, paper, () => ({
      scale: 1,
      tx: 0,
      ty: 0,
      minScale: 0.5,
      maxScale: 2
    }));

    topologyEvents.setup();

    const attr = { body: { fill: '#fff' } };
    const elementView = createCellView('node-1', true, attr) as joint.dia.ElementView;
    const pointerDown = handlers.get('cell:pointerdown');

    pointerDown?.(elementView, { button: 0 }, 10, 20);
    events.length = 0;
    removeSpy.mockClear();

    pointerDown?.(elementView, { button: 0 }, 15, 25);

    expect(removeSpy).toHaveBeenCalledWith(elementView, 'topology-element-highlight');
    expect(events.map((event) => event.type)).toEqual(['topology:cell:unhighlight', 'topology:cell:pointerdown']);
    expect(events[0]?.detail).toMatchObject({
      id: 'node-1',
      cell: elementView,
      attr
    });
  });

  it('unhighlights the selected element when a link is clicked', () => {
    const { paper, handlers } = createPaperStub();
    const { element, events } = createContainerStub();
    mockHighlighterAdd();
    const removeSpy = vi.spyOn(joint.highlighters.mask, 'remove').mockImplementation(() => undefined);

    const topologyEvents = new TopologyInteractionEvents(element, paper, () => ({
      scale: 1,
      tx: 0,
      ty: 0,
      minScale: 0.5,
      maxScale: 2
    }));

    topologyEvents.setup();

    const selectedAttr = { body: { fill: '#fff' } };
    const elementView = createCellView('node-1', true, selectedAttr) as joint.dia.ElementView;
    const linkView = createCellView('link-1', false, { line: { stroke: '#000' } });
    const pointerDown = handlers.get('cell:pointerdown');

    pointerDown?.(elementView, { button: 0 }, 10, 20);
    events.length = 0;
    removeSpy.mockClear();

    pointerDown?.(linkView, { button: 0 }, 15, 25);

    expect(removeSpy).toHaveBeenCalledWith(elementView, 'topology-element-highlight');
    expect(events.map((event) => event.type)).toEqual(['topology:cell:unhighlight', 'topology:cell:pointerdown']);
    expect(events[0]?.detail).toMatchObject({
      id: 'node-1',
      cell: elementView,
      attr: selectedAttr
    });
    expect(events[1]?.detail).toMatchObject({
      id: 'link-1',
      attr: { line: { stroke: '#000' } }
    });
  });

  it('unhighlights the selected element when the blank area is clicked', () => {
    const { paper, handlers } = createPaperStub();
    const { element, events } = createContainerStub();
    mockHighlighterAdd();
    const removeSpy = vi.spyOn(joint.highlighters.mask, 'remove').mockImplementation(() => undefined);

    const topologyEvents = new TopologyInteractionEvents(element, paper, () => ({
      scale: 1,
      tx: 0,
      ty: 0,
      minScale: 0.5,
      maxScale: 2
    }));

    topologyEvents.setup();

    const attr = { body: { fill: '#fff' } };
    const elementView = createCellView('node-1', true, attr) as joint.dia.ElementView;
    const cellPointerDown = handlers.get('cell:pointerdown');
    const blankPointerDown = handlers.get('blank:pointerdown');

    cellPointerDown?.(elementView, { button: 0 }, 10, 20);
    events.length = 0;
    removeSpy.mockClear();

    blankPointerDown?.({ button: 0 }, 15, 25);

    expect(removeSpy).toHaveBeenCalledWith(elementView, 'topology-element-highlight');
    expect(events.map((event) => event.type)).toEqual(['topology:cell:unhighlight', 'topology:blank:pointerdown']);
    expect(events[0]?.detail).toMatchObject({
      id: 'node-1',
      cell: elementView,
      attr
    });
  });
});
