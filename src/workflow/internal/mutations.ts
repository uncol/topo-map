import * as joint from '@joint/core';
import { clonePlain } from '../clonePlain';
import { applyWorkflowLayout } from '../layout/applyWorkflowLayout';
import { WorkflowTransitionLink } from '../shapes/WorkflowTransitionLink';
import type { WorkflowDocument, WorkflowPoint, WorkflowState, WorkflowTransition } from '../types';
import {
  DEFAULT_STATE_HEIGHT,
  DEFAULT_STATE_WIDTH,
  exportWorkflowForSave,
  hasExplicitStatePositions,
  isRecord,
  normalizeWorkflowDocument,
  workflowToGraph
} from '../workflowAdapter';
import { generateId } from './helpers';
import type { WorkflowEditorRuntime } from './runtime';

export function loadWorkflow(runtime: WorkflowEditorRuntime, input: unknown): void {
  runtime.cancelScheduledGraphSync();
  runtime.state.activeDragElementId = null;
  runtime.state.activeVertexDrag = null;
  runtime.clearGuides();
  const workflow = normalizeWorkflowDocument(input);
  const needsLayout = !hasExplicitStatePositions(workflow);

  runtime.withDocumentSyncSuspended(() => {
    runtime.graph.fromJSON(workflowToGraph(workflow), { cellNamespace: runtime.paper.options.cellViewNamespace });
    if (needsLayout) {
      applyWorkflowLayout(runtime.graph);
    }
    runtime.state.workflow = clonePlain(workflow);
    runtime.syncWorkflowFromGraph();
    runtime.decorateStates();
    runtime.refreshAllLinks();
    runtime.selectCell(null);
    runtime.setDirty(false);
  });
  runtime.rebuildSpatialIndex();

  if (runtime.config.fitToPageOnLoad) {
    runtime.fitToContent();
  } else {
    runtime.applyViewport();
  }

  runtime.emitDocumentChange();
}

export function toJSON(runtime: WorkflowEditorRuntime): WorkflowDocument {
  runtime.flushScheduledGraphSync();
  return clonePlain(runtime.state.workflow);
}

export function exportForSave(runtime: WorkflowEditorRuntime): Record<string, unknown> {
  return exportWorkflowForSave(toJSON(runtime));
}

export function addState(
  runtime: WorkflowEditorRuntime,
  position: WorkflowPoint,
  partial: Partial<WorkflowState> = {}
): string {
  runtime.flushScheduledGraphSync();
  runtime.clearGuides();
  const resolvedPosition: WorkflowPoint =
    typeof partial.x === 'number' && typeof partial.y === 'number'
      ? { x: partial.x, y: partial.y }
      : position;
  const state: WorkflowState = {
    ...partial,
    id: partial.id ?? generateId('state'),
    name: partial.name ?? 'New State',
    description: partial.description ?? '',
    is_default: partial.is_default ?? false,
    is_productive: partial.is_productive ?? false,
    is_wiping: partial.is_wiping ?? false,
    update_last_seen: partial.update_last_seen ?? false,
    ttl: partial.ttl ?? 0,
    update_expired: partial.update_expired ?? false,
    on_enter_handlers: partial.on_enter_handlers ?? [],
    job_handler: partial.job_handler ?? null,
    on_leave_handlers: partial.on_leave_handlers ?? [],
    labels: partial.labels ?? [],
    x: resolvedPosition.x,
    y: resolvedPosition.y
  };

  runtime.withDocumentSyncSuspended(() => {
    runtime.graph.addCell({
      id: state.id,
      type: 'workflow.State',
      position: resolvedPosition,
      size: { width: DEFAULT_STATE_WIDTH, height: DEFAULT_STATE_HEIGHT },
      attrs: {
        label: {
          text: state.name
        }
      },
      data: {
        ...clonePlain(state),
        kind: 'state'
      }
    } as joint.dia.Cell.JSON);
    runtime.decorateStateById(state.id);
    runtime.syncWorkflowFromGraph();
  });
  runtime.rebuildSpatialIndex();
  runtime.selectCell(state.id);
  runtime.markDocumentChanged();
  return state.id;
}

export function updateWorkflowMeta(runtime: WorkflowEditorRuntime, patch: Partial<WorkflowDocument>): void {
  runtime.flushScheduledGraphSync();
  runtime.state.workflow = {
    ...runtime.state.workflow,
    ...clonePlain(patch),
    states: runtime.state.workflow.states,
    transitions: runtime.state.workflow.transitions
  };
  runtime.selectCell(runtime.state.selectedCellId);
  runtime.emitValidationChange();
  runtime.markDocumentChanged();
}

export function updateState(
  runtime: WorkflowEditorRuntime,
  id: string,
  patch: Partial<WorkflowState>
): boolean {
  runtime.flushScheduledGraphSync();
  const cell = runtime.graph.getCell(id);
  if (!cell?.isElement()) {
    return false;
  }

  const nextData = {
    ...(clonePlain((cell.get('data') ?? {}) as Record<string, unknown>)),
    ...clonePlain(patch),
    id
  };
  cell.set('data', nextData);
  if (typeof nextData.name === 'string') {
    cell.attr('label/text', nextData.name);
  }
  runtime.decorateState(cell);
  runtime.syncWorkflowFromGraph();
  runtime.markDocumentChanged();
  if (runtime.state.selectedCellId === id) {
    runtime.emitSelectionChange();
  }
  return true;
}

export function updateTransition(
  runtime: WorkflowEditorRuntime,
  id: string,
  patch: Partial<WorkflowTransition>
): boolean {
  runtime.flushScheduledGraphSync();
  const cell = runtime.graph.getCell(id);
  if (!cell?.isLink()) {
    return false;
  }

  const nextData = {
    ...(clonePlain((cell.get('data') ?? {}) as Record<string, unknown>)),
    ...clonePlain(patch),
    id
  };
  cell.set('data', nextData);
  cell.label(0, {
    position: 0.5,
    attrs: {
      text: {
        text: typeof nextData.label === 'string' ? nextData.label : ''
      }
    }
  });
  runtime.refreshLink(cell);
  runtime.syncWorkflowFromGraph();
  runtime.markDocumentChanged();
  if (runtime.state.selectedCellId === id) {
    runtime.emitSelectionChange();
  }
  return true;
}

export function removeSelected(runtime: WorkflowEditorRuntime): boolean {
  runtime.flushScheduledGraphSync();
  runtime.state.activeDragElementId = null;
  runtime.state.activeVertexDrag = null;
  runtime.clearGuides();
  if (!runtime.state.selectedCellId) {
    return false;
  }
  const cell = runtime.graph.getCell(runtime.state.selectedCellId);
  if (!cell) {
    runtime.selectCell(null);
    return false;
  }

  runtime.withDocumentSyncSuspended(() => {
    if (cell.isElement()) {
      runtime.graph.removeCells([cell, ...runtime.graph.getConnectedLinks(cell)]);
    } else {
      cell.remove();
    }
    runtime.syncWorkflowFromGraph();
  });
  runtime.rebuildSpatialIndex();
  runtime.selectCell(null);
  runtime.markDocumentChanged();
  return true;
}

export function autoLayout(runtime: WorkflowEditorRuntime): void {
  runtime.flushScheduledGraphSync();
  runtime.state.activeDragElementId = null;
  runtime.state.activeVertexDrag = null;
  runtime.clearGuides();
  runtime.withDocumentSyncSuspended(() => {
    applyWorkflowLayout(runtime.graph);
    runtime.syncWorkflowFromGraph();
  });
  runtime.rebuildSpatialIndex();
  runtime.fitToContent();
  runtime.markDocumentChanged();
}

export function createDefaultLink(): joint.shapes.standard.Link {
  return new WorkflowTransitionLink({
    data: {
      kind: 'transition',
      id: generateId('transition'),
      label: '',
      event: '',
      is_active: true,
      enable_manual: true,
      description: '',
      handlers: [],
      required_rules: [],
      vertices: [],
      sourceStateId: '',
      targetStateId: ''
    }
  });
}

export function prepareLinkData(runtime: WorkflowEditorRuntime, link: joint.dia.Link): void {
  const sourceId = getLinkEndpointId(link.source());
  const targetId = getLinkEndpointId(link.target());
  const sourceState = runtime.state.workflow.states.find((item) => item.id === sourceId);
  const targetState = runtime.state.workflow.states.find((item) => item.id === targetId);
  const currentData = isRecord(link.get('data')) ? clonePlain(link.get('data')) : {};

  const nextData = {
    ...currentData,
    kind: 'transition',
    id: typeof currentData.id === 'string' ? currentData.id : String(link.id),
    label: typeof currentData.label === 'string' ? currentData.label : '',
    event: typeof currentData.event === 'string' ? currentData.event : '',
    is_active: currentData.is_active === undefined ? true : Boolean(currentData.is_active),
    enable_manual: currentData.enable_manual === undefined ? true : Boolean(currentData.enable_manual),
    description:
      typeof currentData.description === 'string' || currentData.description === null ? currentData.description : '',
    handlers: Array.isArray(currentData.handlers) ? currentData.handlers : [],
    required_rules: Array.isArray(currentData.required_rules) ? currentData.required_rules : [],
    sourceStateId: sourceId,
    targetStateId: targetId,
    from_state: sourceState?.name ?? '',
    to_state: targetState?.name ?? ''
  };

  link.set('data', nextData);
  if (String(link.label(0)?.attrs?.text?.text ?? '').length === 0) {
    link.label(0, {
      position: 0.5,
      attrs: {
        text: {
          text: nextData.label
        }
      }
    });
  }
  runtime.refreshLink(link);
}

export function getLinkEndpointId(endpoint: joint.dia.Link.EndJSON | joint.g.PlainPoint | null | undefined): string {
  if (!endpoint || !('id' in endpoint) || typeof endpoint.id !== 'string') {
    return '';
  }
  return endpoint.id;
}
