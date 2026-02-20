import * as joint from '@joint/core';
import { ResetViewCommand } from './commands/ResetViewCommand';
import { ZoomInCommand } from './commands/ZoomInCommand';
import { ZoomOutCommand } from './commands/ZoomOutCommand';
import { DiagramService } from './core/DiagramService';
import type {
  LinkData,
  NodeData,
  SerializedTopologyMap,
  TopologyMapConfig,
  TopologyMode
} from './core/types';
import { ViewportState } from './core/ViewportState';
import { GuidesManager } from './managers/GuidesManager';
import { MinimapManager } from './managers/MinimapManager';
import { ModeManager } from './managers/ModeManager';
import { PanManager } from './managers/PanManager';
import { SnapManager } from './managers/SnapManager';
import { ViewportManager } from './managers/ViewportManager';
import { ZoomManager } from './managers/ZoomManager';
import { EditMode } from './modes/EditMode';
import { PanMode } from './modes/PanMode';
import { ZoomToAreaMode } from './modes/ZoomToAreaMode';

const DEFAULT_INITIAL_SCALE = 1;
const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 5;
const DEFAULT_GRID_SIZE = 20;
const DEFAULT_GUIDE_THRESHOLD = 5;
const DEFAULT_BOUNDS_PADDING = 12;
const DEFAULT_SCHEMA_VERSION = '1.0.0';
const DEFAULT_FONT_ICON_UNICODE = '\uE003';
const DEFAULT_FONT_ICON_SIZE_CLASS = 'gf-1x';
const DEFAULT_FONT_ICON_STATUS_CLASS = 'gf-ok';
const DEFAULT_NODE_SIZE = 64;

interface GraphEnvelope {
  graph: joint.dia.Graph.JSON;
  viewport?: {
    scale: number;
    tx: number;
    ty: number;
  };
}

type DebugHandler = (eventName: string, ...args: unknown[]) => void;

interface EventEmitterLike {
  on(eventName: string, callback: DebugHandler): void;
  off(eventName: string, callback: DebugHandler): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toGraphEnvelope(input: object): GraphEnvelope {
  if (!isObject(input)) {
    return { graph: { cells: [] } };
  }

  if ('graph' in input) {
    const graphValue = input.graph;
    if (isObject(graphValue)) {
      const viewportValue = 'viewport' in input && isObject(input.viewport) ? input.viewport : undefined;
      const viewport =
        viewportValue &&
        typeof viewportValue.scale === 'number' &&
        typeof viewportValue.tx === 'number' &&
        typeof viewportValue.ty === 'number'
          ? {
              scale: viewportValue.scale,
              tx: viewportValue.tx,
              ty: viewportValue.ty
            }
          : undefined;
      if (viewport) {
        return { graph: graphValue as joint.dia.Graph.JSON, viewport };
      }
      return { graph: graphValue as joint.dia.Graph.JSON };
    }
  }

  return { graph: input as joint.dia.Graph.JSON };
}

export class TopologyMap {
  private readonly config: Required<Omit<TopologyMapConfig, 'onReady'>> & { onReady: (() => void) | undefined };

  private readonly viewportState: ViewportState;

  private readonly diagramService: DiagramService;

  private readonly viewportManager: ViewportManager;

  private readonly zoomManager: ZoomManager;

  private readonly panManager: PanManager;

  private readonly guidesManager: GuidesManager;

  private readonly snapManager: SnapManager;

  private readonly minimapManager: MinimapManager;

  private readonly editMode: EditMode;

  private readonly modeManager: ModeManager;

  private readonly zoomInCommand: ZoomInCommand;

  private readonly zoomOutCommand: ZoomOutCommand;

  private readonly resetViewCommand: ResetViewCommand;

  private readonly debugLogsEnabled: boolean;

  private readonly debugDisposers: Array<() => void> = [];

  private graphDebugHandler: DebugHandler | null = null;

  private paperDebugHandler: DebugHandler | null = null;

  private lastMainWidth = -1;

  private lastMainHeight = -1;

  private lastMinimapWidth = -1;

  private lastMinimapHeight = -1;

  public constructor(config: TopologyMapConfig) {
    this.config = {
      mainContainer: config.mainContainer,
      minimapContainer: config.minimapContainer,
      initialScale: config.initialScale ?? DEFAULT_INITIAL_SCALE,
      minScale: config.minScale ?? DEFAULT_MIN_SCALE,
      maxScale: config.maxScale ?? DEFAULT_MAX_SCALE,
      gridSize: config.gridSize ?? DEFAULT_GRID_SIZE,
      snapThreshold: config.snapThreshold ?? DEFAULT_GUIDE_THRESHOLD,
      boundsPadding: config.boundsPadding ?? DEFAULT_BOUNDS_PADDING,
      preserveViewportOnLoad: config.preserveViewportOnLoad ?? false,
      enableViewportCulling: config.enableViewportCulling ?? false,
      asyncRendering: config.asyncRendering ?? false,
      debugLogs: config.debugLogs ?? false,
      onReady: config.onReady
    };
    this.debugLogsEnabled = this.config.debugLogs;

    this.viewportState = new ViewportState(this.config.initialScale, this.config.minScale, this.config.maxScale);
    this.diagramService = new DiagramService(
      this.config.mainContainer,
      this.viewportState,
      this.config.gridSize,
      this.config.asyncRendering,
      this.config.boundsPadding
    );
    this.viewportState.setTranslateBoundsResolver((snapshot) => this.diagramService.getTranslateBounds(snapshot.scale));

    this.viewportManager = new ViewportManager(
      this.diagramService.getGraph(),
      this.diagramService.getPaper(),
      this.viewportState
    );
    if (this.config.enableViewportCulling) {
      this.diagramService.setViewportPredicate((view) => this.viewportManager.isCellVisible(view));
    } else {
      this.diagramService.setViewportPredicate(null);
    }

    this.zoomManager = new ZoomManager(this.viewportState, this.diagramService, 1.15, this.config.initialScale);
    this.panManager = new PanManager(this.viewportState);
    this.snapManager = new SnapManager(this.config.gridSize);
    this.guidesManager = new GuidesManager(
      this.diagramService.getPaper(),
      this.viewportState,
      this.config.snapThreshold,
      (rect) => this.viewportManager.searchNearby(rect)
    );
    this.minimapManager = new MinimapManager(
      this.config.minimapContainer,
      this.diagramService.getGraph(),
      this.diagramService.getPaper(),
      this.viewportState,
      this.config.asyncRendering
    );

    const panMode = new PanMode(this.panManager, this.diagramService);
    const zoomToAreaMode = new ZoomToAreaMode(this.diagramService, this.zoomManager, this.viewportState);
    this.editMode = new EditMode(this.diagramService, this.guidesManager, this.snapManager);
    this.editMode.setGuidesEnabled(true);

    this.modeManager = new ModeManager(
      this.diagramService.getPaper(),
      {
        pan: panMode,
        zoomToArea: zoomToAreaMode,
        edit: this.editMode
      },
      'pan'
    );

    this.zoomInCommand = new ZoomInCommand(this.zoomManager);
    this.zoomOutCommand = new ZoomOutCommand(this.zoomManager);
    this.resetViewCommand = new ResetViewCommand(this.zoomManager);

    this.setupDebugLogs();
    this.config.onReady?.();
    this.logDebug('initialized', this.config);
  }

  public loadData(nodes: NodeData[], links: LinkData[]): void {
    this.logDebug('loadData:start', { nodes: nodes.length, links: links.length });
    const cells: Array<Record<string, unknown>> = [
      ...nodes.map((node) => {
        const customAttrs = node.attrs ?? {};
        const customIconAttrs = isObject(customAttrs.icon) ? customAttrs.icon : {};
        const customTitleAttrs = isObject(customAttrs.title) ? customAttrs.title : {};
        const customIpaddrAttrs = isObject(customAttrs.ipaddr) ? customAttrs.ipaddr : {};
        const titleText =
          typeof node.status === 'string' && node.status.length > 0 ? `${node.label}\n${node.status}` : node.label;

        return {
          id: node.id,
          type: 'noc.FontIconElement',
          position: { x: node.x, y: node.y },
          size: {
            width: node.width ?? DEFAULT_NODE_SIZE,
            height: node.height ?? DEFAULT_NODE_SIZE
          },
          attrs: {
            ...customAttrs,
            icon: {
              text: node.iconUnicode ?? DEFAULT_FONT_ICON_UNICODE,
              size: node.iconSizeClass ?? DEFAULT_FONT_ICON_SIZE_CLASS,
              status: node.iconStatusClass ?? DEFAULT_FONT_ICON_STATUS_CLASS,
              ...customIconAttrs
            },
            title: {
              text: titleText,
              ...customTitleAttrs
            },
            ipaddr: {
              text: '',
              ...customIpaddrAttrs
            }
          }
        };
      }),
      ...links.map((link) => {
        const labels =
          link.label && link.label.length > 0
            ? [
                {
                  position: 0.5,
                  attrs: {
                    text: {
                      text: link.label
                    }
                  }
                }
              ]
            : [];

        return {
          id: link.id,
          type: 'noc.LinkElement',
          source: { id: link.sourceId },
          target: { id: link.targetId },
          labels,
          attrs: link.attrs ?? {}
        };
      })
    ];

    this.diagramService.fromJSON({ cells } as joint.dia.Graph.JSON);
    this.viewportManager.rebuildIndex();
    this.viewportState.enforceConstraints();
    this.logDebug('loadData:done');
  }

  public toJSON(): object {
    const snapshot = this.viewportState.getSnapshot();
    const payload: SerializedTopologyMap = {
      schemaVersion: DEFAULT_SCHEMA_VERSION,
      viewport: {
        scale: snapshot.scale,
        tx: snapshot.tx,
        ty: snapshot.ty
      },
      graph: this.diagramService.toJSON()
    };
    return payload;
  }

  public fromJSON(data: object): void {
    this.logDebug('fromJSON:start');
    const envelope = toGraphEnvelope(data);

    this.diagramService.fromJSON(envelope.graph);
    this.viewportManager.rebuildIndex();
    this.viewportState.enforceConstraints();

    if (this.config.preserveViewportOnLoad) {
      return;
    }

    if (envelope.viewport) {
      this.viewportState.setViewport(envelope.viewport.scale, envelope.viewport.tx, envelope.viewport.ty);
      this.logDebug('fromJSON:applied-viewport', envelope.viewport);
      return;
    }

    this.viewportState.setViewport(this.config.initialScale, 0, 0);
    this.logDebug('fromJSON:reset-viewport');
  }

  public setMode(mode: TopologyMode): void {
    this.logDebug('setMode', { from: this.modeManager.getMode(), to: mode });
    this.modeManager.setMode(mode);
  }

  public getMode(): string {
    return this.modeManager.getMode();
  }

  public setSnapToGrid(enabled: boolean): void {
    this.logDebug('setSnapToGrid', enabled);
    this.editMode.setSnapEnabled(enabled);
  }

  public setGuidesEnabled(enabled: boolean): void {
    this.logDebug('setGuidesEnabled', enabled);
    this.editMode.setGuidesEnabled(enabled);
  }

  public setBoundsPadding(padding: number): void {
    this.logDebug('setBoundsPadding', padding);
    this.diagramService.setBoundsPadding(padding);
    this.viewportState.enforceConstraints();
  }

  public zoomIn(): void {
    this.logDebug('zoomIn');
    this.zoomInCommand.execute();
  }

  public zoomOut(): void {
    this.logDebug('zoomOut');
    this.zoomOutCommand.execute();
  }

  public resetView(): void {
    this.logDebug('resetView');
    this.resetViewCommand.execute();
  }

  public resizeMain(width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      this.logDebug('resizeMain:skip-invalid', { width, height });
      return;
    }
    if (width === this.lastMainWidth && height === this.lastMainHeight) {
      this.logDebug('resizeMain:skip', { width, height });
      return;
    }
    this.lastMainWidth = width;
    this.lastMainHeight = height;
    this.logDebug('resizeMain:apply', { width, height });
    this.diagramService.resize(width, height);
    this.viewportState.enforceConstraints();
  }

  public resizeMinimap(width: number, height: number): void {
    if (width <= 1 || height <= 1) {
      this.logDebug('resizeMinimap:skip-invalid', { width, height });
      return;
    }
    if (width === this.lastMinimapWidth && height === this.lastMinimapHeight) {
      this.logDebug('resizeMinimap:skip', { width, height });
      return;
    }
    this.lastMinimapWidth = width;
    this.lastMinimapHeight = height;
    this.logDebug('resizeMinimap:apply', { width, height });
    this.minimapManager.resize(width, height);
  }

  public destroy(): void {
    this.logDebug('destroy:start');
    this.teardownDebugLogs();
    this.modeManager.destroy();
    this.zoomManager.destroy();
    this.guidesManager.destroy();
    this.minimapManager.destroy();
    this.viewportManager.destroy();
    this.diagramService.destroy();
    this.logDebug('destroy:done');
  }

  private setupDebugLogs(): void {
    if (!this.debugLogsEnabled) {
      return;
    }

    const viewportDisposer = this.viewportState.subscribe((snapshot) => {
      this.logDebug('viewport', snapshot);
    });
    this.debugDisposers.push(viewportDisposer);

    const graphEmitter = this.diagramService.getGraph() as unknown as EventEmitterLike;
    this.graphDebugHandler = (eventName: string, ...args: unknown[]) => {
      this.logDebug(`graph:${eventName}`, ...args.map((arg) => this.summarizeDebugArg(arg)));
    };
    graphEmitter.on('all', this.graphDebugHandler);

    const paperEmitter = this.diagramService.getPaper() as unknown as EventEmitterLike;
    this.paperDebugHandler = (eventName: string, ...args: unknown[]) => {
      this.logDebug(`paper:${eventName}`, ...args.map((arg) => this.summarizeDebugArg(arg)));
    };
    paperEmitter.on('all', this.paperDebugHandler);
  }

  private teardownDebugLogs(): void {
    if (!this.debugLogsEnabled) {
      return;
    }

    while (this.debugDisposers.length > 0) {
      const disposer = this.debugDisposers.pop();
      disposer?.();
    }

    const graphEmitter = this.diagramService.getGraph() as unknown as EventEmitterLike;
    if (this.graphDebugHandler) {
      graphEmitter.off('all', this.graphDebugHandler);
      this.graphDebugHandler = null;
    }

    const paperEmitter = this.diagramService.getPaper() as unknown as EventEmitterLike;
    if (this.paperDebugHandler) {
      paperEmitter.off('all', this.paperDebugHandler);
      this.paperDebugHandler = null;
    }
  }

  private summarizeDebugArg(value: unknown): unknown {
    if (value instanceof joint.dia.Cell) {
      const type = value.get('type');
      return {
        id: String(value.id),
        type: typeof type === 'string' ? type : 'unknown',
        isLink: value.isLink()
      };
    }

    if (value instanceof joint.dia.CellView) {
      return {
        view: value.cid,
        modelId: String(value.model.id),
        modelType: value.model.get('type')
      };
    }

    if (isObject(value) && 'width' in value && 'height' in value) {
      const width = value.width;
      const height = value.height;
      if (typeof width === 'number' && typeof height === 'number') {
        return { width, height };
      }
    }

    return value;
  }

  private logDebug(message: string, ...payload: unknown[]): void {
    if (!this.debugLogsEnabled) {
      return;
    }
    console.log('[TopologyMap]', message, ...payload);
  }
}

export type { LinkData, NodeData, TopologyMapConfig, TopologyMode } from './core/types';
