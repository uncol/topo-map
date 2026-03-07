import * as joint from '@joint/core';
import { ResetViewCommand } from './commands/ResetViewCommand';
import { ZoomInCommand } from './commands/ZoomInCommand';
import { ZoomOutCommand } from './commands/ZoomOutCommand';
import { DiagramService } from './core/DiagramService';
import { fitPaperToContent, type FitMode } from './core/fitBounds';
import { MapBoundsManager } from './core/MapBoundsManager';
import { createGraphFromData, serializeTopology, toGraphEnvelope } from './core/serialization';
import { TopologyDebug } from './core/TopologyDebug';
import { TopologyEvents } from './core/TopologyEvents';
import type { LinkData, NodeData, TopologyConfig, TopologyMode, ViewportSnapshot } from './core/types';
import { ViewportState } from './core/ViewportState';
import type { MapConverterInput } from './decoders/MapConverter';
import { convertMapData } from './decoders/MapConverter';
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
const DEFAULT_PADDING = 10;

export class Topology {
  private readonly config: Required<Omit<TopologyConfig, 'onReady'>> & { onReady: (() => void) | undefined };

  private readonly viewportState: ViewportState;

  private readonly diagramService: DiagramService;

  private readonly viewportManager: ViewportManager;

  private readonly mapBoundsManager: MapBoundsManager;

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

  private readonly debug: TopologyDebug;

  private readonly events: TopologyEvents;

  private lastMainWidth = -1;

  private lastMainHeight = -1;

  private lastMinimapWidth = -1;

  private lastMinimapHeight = -1;

  public constructor(config: TopologyConfig) {
    this.config = {
      mainContainer: config.mainContainer,
      minimapContainer: config.minimapContainer,
      initialScale: config.initialScale ?? DEFAULT_INITIAL_SCALE,
      minScale: config.minScale ?? DEFAULT_MIN_SCALE,
      maxScale: config.maxScale ?? DEFAULT_MAX_SCALE,
      gridSize: config.gridSize ?? DEFAULT_GRID_SIZE,
      padding: config.padding ?? DEFAULT_PADDING,
      snapThreshold: config.snapThreshold ?? DEFAULT_GUIDE_THRESHOLD,
      preserveViewportOnLoad: config.preserveViewportOnLoad ?? false,
      fitToPageOnLoad: config.fitToPageOnLoad ?? false,
      enableViewportCulling: config.enableViewportCulling ?? false,
      asyncRendering: config.asyncRendering ?? false,
      debugLogs: config.debugLogs ?? false,
      onReady: config.onReady
    };

    this.debug = new TopologyDebug(this.config.debugLogs);
    this.viewportState = new ViewportState(this.config.initialScale, this.config.minScale, this.config.maxScale);
    this.diagramService = new DiagramService(
      this.config.mainContainer,
      this.viewportState,
      this.config.gridSize,
      this.config.asyncRendering,
      DEFAULT_PADDING
    );
    this.mapBoundsManager = new MapBoundsManager(
      this.diagramService.getGraph(),
      this.diagramService.getPaper(),
      this.config.padding);
    this.diagramService.setMapBoundsProvider(() => this.mapBoundsManager.get());
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
      this.mapBoundsManager,
      this.config.asyncRendering,
      DEFAULT_PADDING
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
    this.events = new TopologyEvents(
      this.config.mainContainer,
      this.diagramService.getPaper(),
      () => this.viewportState.getSnapshot()
    );

    this.events.setup();
    this.debug.setup(this.diagramService.getGraph(), this.diagramService.getPaper(), (listener) =>
      this.viewportState.subscribe(listener)
    );
    this.config.onReady?.();
    this.logDebug('initialized', this.config);
  }

  public loadData(nodes: NodeData[], links: LinkData[]): void {
    this.logDebug('loadData:start', { nodes: nodes.length, links: links.length });
    this.events.clearInteractionState();
    this.diagramService.fromJSON(createGraphFromData(nodes, links));
    this.mapBoundsManager.refreshNow();
    this.viewportManager.rebuildIndex();
    this.viewportState.enforceConstraints();
    if (this.config.fitToPageOnLoad) {
      this.fitToPage();
    }
    this.minimapManager.refresh();
    this.logDebug('loadData:done');
  }

  public toJSON(): object {
    return serializeTopology(this.diagramService.toJSON(), this.viewportState.getSnapshot());
  }

  public fromJSON(data: object): void {
    this.logDebug('fromJSON:start');
    this.events.clearInteractionState();
    const envelope = toGraphEnvelope(data);

    this.diagramService.fromJSON(envelope.graph);
    this.mapBoundsManager.refreshNow();
    this.viewportManager.rebuildIndex();
    this.viewportState.enforceConstraints();
    this.minimapManager.refresh();

    if (this.config.preserveViewportOnLoad) {
      return;
    }

    if (envelope.viewport) {
      this.viewportState.setViewport(envelope.viewport.scale, envelope.viewport.tx, envelope.viewport.ty);
      this.logDebug('fromJSON:applied-viewport', envelope.viewport);
      return;
    }

    if (this.config.fitToPageOnLoad) {
      this.fitToPage();
      this.logDebug('fromJSON:fit-to-page');
      return;
    }

    this.viewportState.setViewport(this.config.initialScale, 0, 0);
    this.logDebug('fromJSON:reset-viewport');
  }

  public fromMapData(data: MapConverterInput): void {
    this.logDebug('fromMapData:start');
    this.fromJSON(convertMapData(data));
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

  public toggleNodeLabelMode(): void {
    this.logDebug('toggleNodeLabelMode');
    this.diagramService
      .getGraph()
      .getElements()
      .forEach((element) => {
        const toggleable = element as joint.dia.Element & { toggleLabel?: () => void };
        toggleable.toggleLabel?.();
      });
  }

  public setZoom(scale: number): void {
    if (!Number.isFinite(scale) || scale <= 0) {
      return;
    }

    const snapshot = this.viewportState.getSnapshot();
    const size = this.diagramService.getSize();
    if (size.width <= 1 || size.height <= 1) {
      this.viewportState.setScale(scale);
      return;
    }

    const centerX = size.width / 2;
    const centerY = size.height / 2;
    const localX = (centerX - snapshot.tx) / snapshot.scale;
    const localY = (centerY - snapshot.ty) / snapshot.scale;
    const nextTx = centerX - localX * scale;
    const nextTy = centerY - localY * scale;

    this.logDebug('setZoom', { scale });
    this.viewportState.setViewport(scale, nextTx, nextTy);
  }

  public fitToPage(): void {
    this.fitToContent('page');
  }

  public fitToWidth(): void {
    this.fitToContent('width');
  }

  public fitToHeight(): void {
    this.fitToContent('height');
  }

  public getViewportSnapshot(): ViewportSnapshot {
    return this.viewportState.getSnapshot();
  }

  public getScale(): number {
    return this.zoomManager.getScale();
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
    this.mapBoundsManager.refreshNow();
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
    this.events.teardown();
    this.events.clearInteractionState();
    this.debug.teardown(this.diagramService.getGraph(), this.diagramService.getPaper());
    this.modeManager.destroy();
    this.zoomManager.destroy();
    this.guidesManager.destroy();
    this.minimapManager.destroy();
    this.viewportManager.destroy();
    this.mapBoundsManager.destroy();
    this.diagramService.destroy();
    this.logDebug('destroy:done');
  }

  private logDebug(message: string, ...payload: unknown[]): void {
    this.debug.log(message, ...payload);
  }

  private fitToContent(mode: FitMode): void {
    const fittedViewport = fitPaperToContent(
      this.diagramService.getPaper(),
      this.mapBoundsManager.get(),
      this.diagramService.getSize(),
      this.viewportState.getSnapshot(),
      mode,
      DEFAULT_PADDING
    );
    if (!fittedViewport) {
      return;
    }

    const fitModeName = mode === 'page' ? 'Page' : mode === 'width' ? 'Width' : 'Height';
    this.logDebug(`fitTo${fitModeName}`, { padding: DEFAULT_PADDING, scale: fittedViewport.scale });
    this.viewportState.setViewport(fittedViewport.scale, fittedViewport.tx, fittedViewport.ty);
  }
}
