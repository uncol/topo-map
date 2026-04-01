import * as joint from '@joint/core';
import { workflowCellNamespace } from './shapes/workflowCellNamespace';
import type {
  WorkflowContextMenuDetail,
  WorkflowDocument,
  WorkflowEditorConfig,
  WorkflowMode,
  WorkflowPoint,
  WorkflowSelection,
  WorkflowState,
  WorkflowTransition
} from './types';
import { emitContextMenu, emitDirtyChange, emitDocumentChange, emitSelectionChange, emitValidationChange } from './internal/events';
import { resolveInteractivity, bindEvents } from './internal/bindings';
import { createDefaultWorkflow as createInitialWorkflow } from './internal/helpers';
import { clearPendingEndLinkCreationTimeout, beginLinkCreation, endLinkCreation, endLinkCreationSoon, setElementPortsVisible, shouldShowPortsForElement, syncPortsVisibility, validateConnection, validateMagnet } from './internal/ports';
import { createWorkflowEditorState, resolveWorkflowEditorConfig } from './internal/editorState';
import { clearSelection, getSelection, selectCell } from './internal/selection';
import { cancelScheduledGraphSync, flushScheduledGraphSync, markDocumentChanged, performGraphSync, scheduleGraphSync, setDirty, syncWorkflowFromGraph, withDocumentSyncSuspended } from './internal/sync';
import { decorateState, decorateStateById, decorateStates, refreshAllLinks, refreshLink } from './internal/styling';
import { WorkflowGuidesManager } from './internal/GuidesManager';
import { autoLayout, createDefaultLink, exportForSave, loadWorkflow, prepareLinkData, toJSON, addState, removeSelected, updateState, updateTransition, updateWorkflowMeta } from './internal/mutations';
import type { WorkflowEditorRuntime } from './internal/runtime';
import { WorkflowSpatialIndex } from './internal/spatialIndex';
import { applyViewport, clientToLocalPoint, fitToContent, resize, setZoom, zoomIn, zoomOut } from './internal/viewport';

const PAPER_BACKGROUND = '#f8fafc';

export class WorkflowEditor extends EventTarget {
  private readonly runtime: WorkflowEditorRuntime;

  private readonly resizeObserver: ResizeObserver | null;

  public constructor(config: WorkflowEditorConfig) {
    super();

    const resolvedConfig = resolveWorkflowEditorConfig(config);
    const state = createWorkflowEditorState(resolvedConfig, createInitialWorkflow());
    const paperHost = document.createElement('div');
    paperHost.className = 'workflow-editor-paper-host';
    paperHost.style.width = '100%';
    paperHost.style.height = '100%';
    paperHost.style.cursor = 'default';
    resolvedConfig.mainContainer.replaceChildren(paperHost);

    const graph = new joint.dia.Graph({}, { cellNamespace: workflowCellNamespace });
    const runtime = {} as WorkflowEditorRuntime;
    const paper = new joint.dia.Paper({
      el: paperHost,
      model: graph,
      cellViewNamespace: workflowCellNamespace,
      width: paperHost.clientWidth || 800,
      height: paperHost.clientHeight || 600,
      gridSize: resolvedConfig.gridSize,
      drawGrid: { name: 'dot', args: { color: '#cbd5e1', thickness: 1 } },
      background: { color: PAPER_BACKGROUND },
      async: false,
      linkPinning: false,
      defaultRouter: { name: 'metro' },
      defaultConnector: { name: 'rounded' },
      defaultLink: () => createDefaultLink(),
      interactive: (cellView, eventName) => resolveInteractivity(runtime, cellView, eventName),
      validateMagnet: (_cellView, magnet) => validateMagnet(runtime, magnet),
      validateConnection: (sourceView, sourceMagnet, targetView, targetMagnet) =>
        validateConnection(runtime, sourceView, sourceMagnet, targetView, targetMagnet)
    });
    const spatialIndex = new WorkflowSpatialIndex(graph);
    const guidesManager = new WorkflowGuidesManager(
      paper,
      () => ({
        scale: runtime.state.scale,
        tx: runtime.state.tx,
        ty: runtime.state.ty
      }),
      resolvedConfig.guideThreshold,
      (rect) => spatialIndex.searchNearby(rect)
    );
    guidesManager.setEnabled(resolvedConfig.guidesEnabled);

    Object.assign(runtime, {
      host: this,
      config: resolvedConfig,
      state,
      graph,
      paper,
      paperHost,
      spatialIndex,
      guidesManager,
      emitDirtyChange: (dirty: boolean) => {
        emitDirtyChange(this, dirty);
      },
      emitSelectionChange: () => {
        emitSelectionChange(this, getSelection(runtime));
      },
      emitDocumentChange: () => {
        emitDocumentChange(this, runtime.state.workflow);
      },
      emitContextMenu: (detail: WorkflowContextMenuDetail) => {
        emitContextMenu(this, detail);
      },
      emitValidationChange: () => {
        runtime.state.validationIssues = emitValidationChange(this, runtime.state.workflow);
      },
      getSelection: () => getSelection(runtime),
      selectCell: (cellId: string | null) => {
        selectCell(runtime, cellId);
      },
      beginLinkCreation: () => {
        beginLinkCreation(runtime);
      },
      endLinkCreation: () => {
        endLinkCreation(runtime);
      },
      endLinkCreationSoon: () => {
        endLinkCreationSoon(runtime);
      },
      setElementPortsVisible: (element: joint.dia.Element, visible: boolean) => {
        setElementPortsVisible(runtime, element, visible);
      },
      shouldShowPortsForElement: (element: joint.dia.Element) => shouldShowPortsForElement(runtime, element),
      syncPortsVisibility: () => {
        syncPortsVisibility(runtime);
      },
      decorateState: (element: joint.dia.Element) => {
        decorateState(runtime, element);
      },
      decorateStateById: (id: string) => {
        decorateStateById(runtime, id);
      },
      decorateStates: () => {
        decorateStates(runtime);
      },
      refreshLink: (link: joint.dia.Link) => {
        refreshLink(runtime, link);
      },
      refreshAllLinks: () => {
        refreshAllLinks(runtime);
      },
      applyViewport: () => {
        applyViewport(runtime);
      },
      resize: () => {
        resize(runtime);
      },
      fitToContent: (padding?: number) => {
        fitToContent(runtime, padding);
      },
      setZoom: (nextScale: number, focus?: WorkflowPoint) => {
        setZoom(runtime, nextScale, focus);
      },
      rebuildSpatialIndex: () => {
        spatialIndex.rebuildIndex();
      },
      updateGuidesForElement: (element: joint.dia.Element) => {
        guidesManager.updateForElement(element);
      },
      clearGuides: () => {
        guidesManager.clear();
      },
      setGuidesEnabled: (enabled: boolean) => {
        guidesManager.setEnabled(enabled);
      },
      withDocumentSyncSuspended: (callback: () => void) => {
        withDocumentSyncSuspended(runtime, callback);
      },
      syncWorkflowFromGraph: () => {
        syncWorkflowFromGraph(runtime);
      },
      performGraphSync: () => {
        performGraphSync(runtime);
      },
      markDocumentChanged: () => {
        markDocumentChanged(runtime);
      },
      scheduleGraphSync: (options?: { selectionChange?: boolean }) => {
        scheduleGraphSync(runtime, options);
      },
      flushScheduledGraphSync: () => {
        flushScheduledGraphSync(runtime);
      },
      cancelScheduledGraphSync: () => {
        cancelScheduledGraphSync(runtime);
      },
      setDirty: (nextDirty: boolean) => {
        setDirty(runtime, nextDirty);
      },
      prepareLinkData: (link: joint.dia.Link) => {
        prepareLinkData(runtime, link);
      }
    } satisfies WorkflowEditorRuntime);

    this.runtime = runtime;
    applyViewport(this.runtime);
    bindEvents(this.runtime);

    this.resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            resize(this.runtime);
          })
        : null;
    this.resizeObserver?.observe(this.runtime.config.mainContainer);
    this.runtime.emitSelectionChange();
    this.runtime.emitValidationChange();
  }

  public loadWorkflow(input: unknown): void {
    loadWorkflow(this.runtime, input);
  }

  public toJSON() {
    return toJSON(this.runtime);
  }

  public exportForSave(): Record<string, unknown> {
    return exportForSave(this.runtime);
  }

  public addState(position: WorkflowPoint, partial: Partial<WorkflowState> = {}): string {
    return addState(this.runtime, position, partial);
  }

  public updateWorkflowMeta(patch: Partial<WorkflowDocument>): void {
    updateWorkflowMeta(this.runtime, patch);
  }

  public updateState(id: string, patch: Partial<WorkflowState>): boolean {
    return updateState(this.runtime, id, patch);
  }

  public updateTransition(id: string, patch: Partial<WorkflowTransition>): boolean {
    return updateTransition(this.runtime, id, patch);
  }

  public removeSelected(): boolean {
    return removeSelected(this.runtime);
  }

  public selectCell(cellId: string | null): void {
    selectCell(this.runtime, cellId);
  }

  public clearSelection(): void {
    clearSelection(this.runtime);
  }

  public getSelection(): WorkflowSelection {
    return getSelection(this.runtime);
  }

  public setMode(mode: WorkflowMode): void {
    if (this.runtime.state.mode === mode) {
      return;
    }
    this.runtime.clearGuides();
    this.runtime.state.activeDragElementId = null;
    this.runtime.state.mode = mode;
    this.runtime.state.panState = null;
    this.runtime.paperHost.style.cursor = mode === 'pan' ? 'grab' : 'default';
    this.runtime.selectCell(this.runtime.state.selectedCellId);
  }

  public getMode(): WorkflowMode {
    return this.runtime.state.mode;
  }

  public autoLayout(): void {
    autoLayout(this.runtime);
  }

  public zoomIn(): void {
    zoomIn(this.runtime);
  }

  public zoomOut(): void {
    zoomOut(this.runtime);
  }

  public setZoom(nextScale: number, focus?: WorkflowPoint): void {
    setZoom(this.runtime, nextScale, focus);
  }

  public fitToContent(padding = 48): void {
    fitToContent(this.runtime, padding);
  }

  public setGuidesEnabled(enabled: boolean): void {
    this.runtime.setGuidesEnabled(enabled);
    if (!enabled) {
      this.runtime.clearGuides();
    }
  }

  public notifyResize(): void {
    this.runtime.clearGuides();
    resize(this.runtime);
  }

  public clientToLocalPoint(clientX: number, clientY: number): WorkflowPoint {
    return clientToLocalPoint(this.runtime, clientX, clientY);
  }

  public destroy(): void {
    cancelScheduledGraphSync(this.runtime);
    clearPendingEndLinkCreationTimeout(this.runtime);
    this.resizeObserver?.disconnect();
    this.runtime.clearGuides();
    this.runtime.guidesManager.destroy();
    this.runtime.spatialIndex.destroy();
    this.runtime.paper.remove();
    this.runtime.config.mainContainer.replaceChildren();
  }
}
