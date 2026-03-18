import type * as joint from '@joint/core';
import type { PaperConfig, ViewportSnapshot } from './types';

export interface MapDocumentJSON {
  graph: joint.dia.Graph.JSON;
  viewport?: ViewportSnapshot;
  paperConfig?: PaperConfig;
  schemaVersion?: string;
}

interface MapDocumentInit {
  graph: joint.dia.Graph.JSON;
  viewport: ViewportSnapshot | undefined;
  paperConfig: PaperConfig | undefined;
  schemaVersion: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeViewport(value: unknown): ViewportSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const { scale, tx, ty } = value;
  return typeof scale === 'number' && typeof tx === 'number' && typeof ty === 'number'
    ? { scale, tx, ty }
    : undefined;
}

function normalizePaperConfig(value: unknown): PaperConfig {
  return isRecord(value) ? ({ ...value } as PaperConfig) : {};
}

function normalizeGraph(value: unknown): joint.dia.Graph.JSON {
  return isRecord(value) ? (value as joint.dia.Graph.JSON) : ({ cells: [] } as joint.dia.Graph.JSON);
}

export class MapDocument {
  public static readonly DEFAULT_SCHEMA_VERSION = '1.0.0';

  private static readonly DEFAULT_VIEWPORT: ViewportSnapshot = {
    scale: 1,
    tx: 0,
    ty: 0
  };

  public readonly graph: joint.dia.Graph.JSON;

  public readonly viewport: ViewportSnapshot | undefined;

  public readonly paperConfig: PaperConfig;

  public readonly schemaVersion: string;

  public constructor(init: MapDocumentInit) {
    this.graph = normalizeGraph(init.graph);
    this.viewport = init.viewport;
    this.paperConfig = normalizePaperConfig(init.paperConfig);
    this.schemaVersion =
      typeof init.schemaVersion === 'string' && init.schemaVersion.length > 0
        ? init.schemaVersion
        : MapDocument.DEFAULT_SCHEMA_VERSION;
  }

  public static fromJSON(input: unknown): MapDocument {
    if (!isRecord(input)) {
      return new MapDocument({
        graph: { cells: [] } as joint.dia.Graph.JSON,
        viewport: MapDocument.DEFAULT_VIEWPORT,
        paperConfig: undefined,
        schemaVersion: undefined
      });
    }

    if ('graph' in input) {
      return new MapDocument({
        graph: normalizeGraph(input.graph),
        viewport: normalizeViewport(input.viewport) ?? MapDocument.DEFAULT_VIEWPORT,
        paperConfig: normalizePaperConfig(input.paperConfig),
        schemaVersion: typeof input.schemaVersion === 'string' ? input.schemaVersion : undefined
      });
    }

    return new MapDocument({
      graph: normalizeGraph(input),
      viewport: MapDocument.DEFAULT_VIEWPORT,
      paperConfig: undefined,
      schemaVersion: undefined
    });
  }

  public static fromGraph(
    graph: joint.dia.Graph.JSON,
    viewport?: ViewportSnapshot,
    paperConfig: PaperConfig = {},
    schemaVersion = MapDocument.DEFAULT_SCHEMA_VERSION
  ): MapDocument {
    return new MapDocument({
      graph,
      viewport,
      paperConfig,
      schemaVersion
    });
  }

  public hasPaperConfig(): boolean {
    return Object.keys(this.paperConfig).length > 0;
  }

  public toJSON(): MapDocumentJSON {
    const json: MapDocumentJSON = {
      graph: this.graph,
      paperConfig: { ...this.paperConfig },
      schemaVersion: this.schemaVersion
    };

    if (this.viewport) {
      json.viewport = { ...this.viewport };
    }

    return json;
  }
}
