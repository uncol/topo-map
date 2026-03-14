import * as joint from '@joint/core';
import type { TopologyConfig, ViewportSnapshot } from '../types';
import { getEventClientPoint, isPrimaryMouseButton } from './eventUtils';

const LINK_HOVER_STROKE = '#3498db';
const LINK_HOVER_STROKE_WIDTH = 3;
const LINK_HOVER_OPACITY = 0.6;
const LINK_HOVER_HIGHLIGHT_ID = 'topology:link-hover-highlight';
const ELEMENT_HIGHLIGHT_ID = 'topology:element-highlight';
const TOPOLOGY_CELL_POINTERDOWN_EVENT = 'topology:cell:pointerdown';
const TOPOLOGY_CELL_POINTERDBLCLICK_EVENT = 'topology:cell:pointerdblclick';
const TOPOLOGY_BLANK_POINTERDOWN_EVENT = 'topology:blank:pointerdown';
const TOPOLOGY_CELL_HIGHLIGHT_EVENT = 'topology:cell:highlight';
const TOPOLOGY_CELL_UNHIGHLIGHT_EVENT = 'topology:cell:unhighlight';
const TOPOLOGY_CELL_CONTEXTMENU_EVENT = 'topology:cell:contextmenu';
const TOPOLOGY_BLANK_CONTEXTMENU_EVENT = 'topology:blank:contextmenu';
const TOPOLOGY_WHEEL_EVENT = 'topology:wheel';

export class TopologyInteractionEvents {
  private readonly mainContainer: TopologyConfig['mainContainer'];

  private readonly paper: joint.dia.Paper;

  private readonly getViewportSnapshot: () => ViewportSnapshot;

  private highlightedElementView: joint.dia.ElementView | null = null;

  private readonly pendingContextMenuTimers = new Set<number>();

  private readonly onLinkMouseEnterBound = (linkView: joint.dia.LinkView): void => {
    this.applyLinkHoverStyle(linkView);
  };

  private readonly onLinkMouseLeaveBound = (linkView: joint.dia.LinkView): void => {
    this.restoreLinkHoverStyle(linkView);
  };

  private readonly onCellPointerDownBound = (
    cellView: joint.dia.CellView,
    event: joint.dia.Event,
    x: number,
    y: number
  ): void => {
    this.handleCellPointerDown(cellView, event, x, y);
  };

  private readonly onCellPointerDblClickBound = (
    cellView: joint.dia.CellView,
    event: joint.dia.Event,
    x: number,
    y: number
  ): void => {
    this.handleCellPointerDblClick(cellView, event, x, y);
  };

  private readonly onBlankPointerDownBound = (event: joint.dia.Event, x: number, y: number): void => {
    this.handleBlankPointerDown(event, x, y);
  };

  private readonly onCellContextMenuBound = (
    cellView: joint.dia.CellView,
    event: joint.dia.Event,
    x: number,
    y: number
  ): void => {
    this.handleCellContextMenu(cellView, event, x, y);
  };

  private readonly onBlankContextMenuBound = (event: joint.dia.Event, x: number, y: number): void => {
    this.handleBlankContextMenu(event, x, y);
  };

  private readonly onPaperWheelBound = (event: WheelEvent): void => {
    this.handlePaperWheel(event);
  };

  public constructor(
    mainContainer: TopologyConfig['mainContainer'],
    paper: joint.dia.Paper,
    getViewportSnapshot: () => ViewportSnapshot
  ) {
    this.mainContainer = mainContainer;
    this.paper = paper;
    this.getViewportSnapshot = getViewportSnapshot;
  }

  public setup(): void {
    this.paper.on('link:mouseenter', this.onLinkMouseEnterBound);
    this.paper.on('link:mouseleave', this.onLinkMouseLeaveBound);
    this.paper.on('cell:pointerdown', this.onCellPointerDownBound);
    this.paper.on('cell:pointerdblclick', this.onCellPointerDblClickBound);
    this.paper.on('blank:pointerdown', this.onBlankPointerDownBound);
    this.paper.on('cell:contextmenu', this.onCellContextMenuBound);
    this.paper.on('blank:contextmenu', this.onBlankContextMenuBound);
    this.paper.el.addEventListener('wheel', this.onPaperWheelBound);
  }

  public teardown(): void {
    this.paper.off('link:mouseenter', this.onLinkMouseEnterBound);
    this.paper.off('link:mouseleave', this.onLinkMouseLeaveBound);
    this.paper.off('cell:pointerdown', this.onCellPointerDownBound);
    this.paper.off('cell:pointerdblclick', this.onCellPointerDblClickBound);
    this.paper.off('blank:pointerdown', this.onBlankPointerDownBound);
    this.paper.off('cell:contextmenu', this.onCellContextMenuBound);
    this.paper.off('blank:contextmenu', this.onBlankContextMenuBound);
    this.paper.el.removeEventListener('wheel', this.onPaperWheelBound);
    this.clearPendingContextMenuTimers();
  }

  public clearInteractionState(): void {
    this.clearElementHighlight();
    this.clearLinkHoverStyles();
  }

  public clearHighlightedElement(): void {
    this.clearElementHighlight();
  }

  public highlightElementById(cellId: joint.dia.Cell.ID): boolean {
    const cell = this.paper.model.getCell(cellId);
    if (!cell?.isElement()) {
      return false;
    }

    const elementView = this.resolveElementView(cell);
    if (!elementView) {
      return false;
    }

    this.highlightElement(elementView);
    return true;
  }

  private applyLinkHoverStyle(linkView: joint.dia.LinkView): void {
    joint.highlighters.mask.add(linkView, 'line', LINK_HOVER_HIGHLIGHT_ID, {
      padding: 1,
      attrs: {
        stroke: LINK_HOVER_STROKE,
        strokeWidth: LINK_HOVER_STROKE_WIDTH,
        opacity: LINK_HOVER_OPACITY
      }
    });
    this.paper.el.style.cursor = 'pointer';
  }

  private restoreLinkHoverStyle(linkView: joint.dia.LinkView): void {
    joint.highlighters.mask.remove(linkView, LINK_HOVER_HIGHLIGHT_ID);
    this.paper.el.style.cursor = 'grab';
  }

  private handleCellPointerDown(cellView: joint.dia.CellView, event: joint.dia.Event, x: number, y: number): void {
    if (!isPrimaryMouseButton(event)) {
      return;
    }

    this.updateElementHighlight(cellView);
    this.emitBubbledEvent(TOPOLOGY_CELL_POINTERDOWN_EVENT, {
      ...this.getCellEventDetail(cellView),
      x,
      y
    });
  }

  private handleCellPointerDblClick(cellView: joint.dia.CellView, event: joint.dia.Event, x: number, y: number): void {
    if (!isPrimaryMouseButton(event)) {
      return;
    }

    this.emitBubbledEvent(TOPOLOGY_CELL_POINTERDBLCLICK_EVENT, {
      ...this.getCellEventDetail(cellView),
      x,
      y
    });
  }

  private handleBlankPointerDown(event: joint.dia.Event, x: number, y: number): void {
    if (!isPrimaryMouseButton(event)) {
      return;
    }

    this.clearElementHighlight();
    this.emitBubbledEvent(TOPOLOGY_BLANK_POINTERDOWN_EVENT, { x, y });
  }

  private handleCellContextMenu(
    cellView: joint.dia.CellView,
    event: joint.dia.Event,
    _x: number,
    _y: number
  ): void {
    this.preventDefaultEvent(event);
    const clientPoint = getEventClientPoint(event);
    this.emitBubbledContextMenuEvent(TOPOLOGY_CELL_CONTEXTMENU_EVENT, {
      ...this.getCellEventDetail(cellView),
      clientX: clientPoint?.x ?? 0,
      clientY: clientPoint?.y ?? 0
    });
  }

  private handleBlankContextMenu(event: joint.dia.Event, _x: number, _y: number): void {
    this.preventDefaultEvent(event);
    const clientPoint = getEventClientPoint(event);
    this.emitBubbledContextMenuEvent(TOPOLOGY_BLANK_CONTEXTMENU_EVENT, {
      clientX: clientPoint?.x ?? 0,
      clientY: clientPoint?.y ?? 0
    });
  }

  private handlePaperWheel(_: WheelEvent): void {
    const snapshot = this.getViewportSnapshot();

    this.emitBubbledEvent(TOPOLOGY_WHEEL_EVENT, {
      scale: snapshot.scale
    });
  }

  private updateElementHighlight(cellView: joint.dia.CellView): void {
    if (!cellView.model.isElement()) {
      this.clearElementHighlight();
      return;
    }

    const elementView = cellView as joint.dia.ElementView;
    if (this.isHighlightedElement(elementView)) {
      this.clearElementHighlight();
      return;
    }

    this.highlightElement(elementView);
  }

  private highlightElement(elementView: joint.dia.ElementView): void {
    if (this.highlightedElementView && this.highlightedElementView !== elementView) {
      this.emitBubbledEvent(TOPOLOGY_CELL_UNHIGHLIGHT_EVENT, this.getCellEventDetail(this.highlightedElementView));
      joint.highlighters.mask.remove(this.highlightedElementView, ELEMENT_HIGHLIGHT_ID);
    }

    joint.highlighters.mask.add(elementView, 'root', ELEMENT_HIGHLIGHT_ID, {
      padding: 8,
      attrs: {
        stroke: '#f59e0b',
        strokeWidth: 2,
        fill: 'none',
        pointerEvents: 'none'
      }
    });
    this.highlightedElementView = elementView;
    this.emitBubbledEvent(TOPOLOGY_CELL_HIGHLIGHT_EVENT, this.getCellEventDetail(elementView));
  }

  private clearElementHighlight(): void {
    if (!this.highlightedElementView) {
      return;
    }
    this.emitBubbledEvent(TOPOLOGY_CELL_UNHIGHLIGHT_EVENT, this.getCellEventDetail(this.highlightedElementView));
    joint.highlighters.mask.remove(this.highlightedElementView, ELEMENT_HIGHLIGHT_ID);
    this.highlightedElementView = null;
  }

  private clearLinkHoverStyles(): void {
    joint.highlighters.mask.removeAll(this.paper, LINK_HOVER_HIGHLIGHT_ID);
  }

  private resolveElementView(element: joint.dia.Element): joint.dia.ElementView | null {
    const existingView = this.paper.findViewByModel<joint.dia.ElementView>(element);
    if (existingView) {
      return existingView;
    }

    try {
      return this.paper.requireView<joint.dia.ElementView>(element);
    } catch {
      return null;
    }
  }

  private getCellEventDetail(cellView: joint.dia.CellView): Record<string, unknown> {
    const model = cellView.model;
    return {
      id: String(model.id),
      data: model.get('data') || {}
    };
  }

  private isHighlightedElement(elementView: joint.dia.ElementView): boolean {
    return this.highlightedElementView?.model.id === elementView.model.id;
  }

  private preventDefaultEvent(event: joint.dia.Event): void {
    if ('preventDefault' in event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
  }

  private emitBubbledContextMenuEvent(eventName: string, detail: Record<string, unknown>): void {
    const timerId = window.setTimeout(() => {
      this.pendingContextMenuTimers.delete(timerId);
      this.emitBubbledEvent(eventName, detail);
    }, 0);

    this.pendingContextMenuTimers.add(timerId);
  }

  private clearPendingContextMenuTimers(): void {
    this.pendingContextMenuTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    this.pendingContextMenuTimers.clear();
  }

  private emitBubbledEvent(eventName: string, detail: Record<string, unknown>): void {
    this.mainContainer.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail
      })
    );
  }
}
