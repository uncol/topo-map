import type * as joint from '@joint/core';
import type {
  CellData,
  DataApi,
  ElementDataApi,
  ElementRecord,
  LinkDataApi,
  LinkRecord
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

function toRecord<TData extends CellData>(
  cell: joint.dia.Cell
): ElementRecord<TData> | LinkRecord<TData> | null {
  const data = cell.get('data');
  if (!isRecord(data)) {
    return null;
  }

  return {
    id: String(cell.id),
    data: cloneValue(data as TData)
  };
}

class ElementDataFacade implements ElementDataApi {
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

  public getById<TData extends CellData = CellData>(id: string): ElementRecord<TData> | null {
    const cell = this.graph.getCell(id);
    if (!cell?.isElement()) {
      return null;
    }

    return toRecord<TData>(cell);
  }

  public getAll<TData extends CellData = CellData>(): ElementRecord<TData>[] {
    return this.graph.getElements().flatMap((element) => {
      const record = toRecord<TData>(element);
      return record ? [record] : [];
    });
  }
}

class LinkDataFacade implements LinkDataApi {
  public constructor(private readonly graph: joint.dia.Graph) {}

  public getById<TData extends CellData = CellData>(id: string): LinkRecord<TData> | null {
    const cell = this.graph.getCell(id);
    if (!cell?.isLink()) {
      return null;
    }

    return toRecord<TData>(cell);
  }

  public getAll<TData extends CellData = CellData>(): LinkRecord<TData>[] {
    return this.graph.getLinks().flatMap((link) => {
      const record = toRecord<TData>(link);
      return record ? [record] : [];
    });
  }
}

export class DataFacade implements DataApi {
  public readonly elements: ElementDataApi;

  public readonly links: LinkDataApi;

  public constructor(graph: joint.dia.Graph) {
    this.elements = new ElementDataFacade(graph);
    this.links = new LinkDataFacade(graph);
  }
}
