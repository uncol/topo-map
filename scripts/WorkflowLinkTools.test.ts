import { describe, expect, it } from 'vitest';
import { getWorkflowVertexToolOptions, snapPointToGrid } from '../src/workflow/internal/linkTools';
import { WorkflowTransitionLink } from '../src/workflow/shapes/WorkflowTransitionLink';

describe('workflow link tools', () => {
  it('snaps added vertices to the configured grid', () => {
    expect(snapPointToGrid({ x: 33, y: 49 }, 20)).toEqual({ x: 40, y: 40 });
  });

  it('keeps vertex drag enabled while vertex add and remove stay enabled', () => {
    const options = getWorkflowVertexToolOptions();

    expect(options.vertexMoving).toBe(true);
    expect(options.vertexRemoving).toBe(true);
    expect(options.vertexAdding).toBe(true);
  });

  it('uses orthogonal routing for workflow transitions', () => {
    const link = new WorkflowTransitionLink();

    expect(link.get('router')).toEqual({
      name: 'orthogonal'
    });
  });
});
