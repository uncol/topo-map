import type * as joint from '@joint/core';
import type {
  TopologyCellData,
  TopologyDataApi,
  TopologyElementDataApi,
  TopologyElementRecord,
  TopologyLinkDataApi,
  TopologyLinkRecord
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (!isRecord(value)) {
    return value;
  }

  const clone: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, item]) => {
    clone[key] = cloneValue(item);
  });
  return clone as T;
}

function toRecord<TData extends TopologyCellData>(
  cell: joint.dia.Cell
): TopologyElementRecord<TData> | TopologyLinkRecord<TData> | null {
  const data = cell.get('data');
  if (!isRecord(data)) {
    return null;
  }

  return {
    id: String(cell.id),
    data: cloneValue(data as TData)
  };
}

class TopologyElementDataFacade implements TopologyElementDataApi {
  public constructor(private readonly graph: joint.dia.Graph) {}

  public getIdsByDataType(type: string): string[] {
    const expectedType = type.trim();
    if (expectedType.length === 0) {
      return [];
    }

    return this.graph.getElements().flatMap((element) => {
      const data = element.get('data');
      if (!isRecord(data) || data.type !== expectedType) {
        return [];
      }

      return [String(element.id)];
    });
  }

  public getById<TData extends TopologyCellData = TopologyCellData>(id: string): TopologyElementRecord<TData> | null {
    const cell = this.graph.getCell(id);
    if (!cell?.isElement()) {
      return null;
    }

    return toRecord<TData>(cell);
  }

  public getAll<TData extends TopologyCellData = TopologyCellData>(): TopologyElementRecord<TData>[] {
    return this.graph.getElements().flatMap((element) => {
      const record = toRecord<TData>(element);
      return record ? [record] : [];
    });
  }
}

class TopologyLinkDataFacade implements TopologyLinkDataApi {
  public constructor(private readonly graph: joint.dia.Graph) {}

  public getById<TData extends TopologyCellData = TopologyCellData>(id: string): TopologyLinkRecord<TData> | null {
    const cell = this.graph.getCell(id);
    if (!cell?.isLink()) {
      return null;
    }

    return toRecord<TData>(cell);
  }

  public getAll<TData extends TopologyCellData = TopologyCellData>(): TopologyLinkRecord<TData>[] {
    return this.graph.getLinks().flatMap((link) => {
      const record = toRecord<TData>(link);
      return record ? [record] : [];
    });
  }
}

export class TopologyDataFacade implements TopologyDataApi {
  public readonly elements: TopologyElementDataApi;

  public readonly links: TopologyLinkDataApi;

  public constructor(graph: joint.dia.Graph) {
    this.elements = new TopologyElementDataFacade(graph);
    this.links = new TopologyLinkDataFacade(graph);
  }
}
