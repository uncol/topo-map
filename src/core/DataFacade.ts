import type * as joint from '@joint/core';
import { applyElementStatus, isStatusSupportedElement, readElementStatus } from './elementStatus';
import type {
  CellData,
  DataApi,
  ElementDataApi,
  ElementRecord,
  LinkBwValue,
  ElementStatusRecord,
  ElementStatusUpdate,
  ElementStatusUpdateMap,
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

function toOptionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mergePatchedData(currentData: unknown, patch: CellData): CellData {
  const nextData = isRecord(currentData) ? cloneValue(currentData) : {};

  Object.entries(patch).forEach(([key, value]) => {
    if (value == null) {
      delete nextData[key];
      return;
    }

    nextData[key] = cloneValue(value);
  });

  return nextData;
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

  public getStatus(id: string): ElementStatusUpdate | null {
    const element = this.getStatusTargetElement(id);
    if (!element) {
      return null;
    }

    return readElementStatus(element);
  }

  public getStatuses(ids: string[]): ElementStatusRecord[] {
    return ids.map((id) => {
      const status = this.getStatus(id);
      return {
        id,
        status_code: status?.status_code ?? null,
        metrics_label: status?.metrics_label ?? null
      };
    });
  }

  public setStatus(id: string, update: ElementStatusUpdate): boolean {
    const element = this.getStatusTargetElement(id);
    if (!element) {
      return false;
    }

    return applyElementStatus(element, update);
  }

  public setStatuses(updates: ElementStatusUpdateMap): string[] {
    const entries = Object.entries(updates);
    if (entries.length === 0) {
      return [];
    }

    const updatedIds: string[] = [];
    this.graph.startBatch('element-status');
    try {
      entries.forEach(([id, update]) => {
        const element = this.getStatusTargetElement(id);
        if (!element) {
          return;
        }

        if (applyElementStatus(element, update)) {
          updatedIds.push(id);
        }
      });
    } finally {
      this.graph.stopBatch('element-status');
    }

    return updatedIds;
  }

  public setRandomStatuses(updates: ElementStatusUpdate[]): string[] {
    if (updates.length === 0) {
      return [];
    }

    const updatedIds: string[] = [];
    this.graph.startBatch('element-status');
    try {
      this.graph.getElements().forEach((element) => {
        if (!isStatusSupportedElement(element)) {
          return;
        }

        const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
        if (randomUpdate && applyElementStatus(element, randomUpdate)) {
          updatedIds.push(String(element.id));
        }
      });
    } finally {
      this.graph.stopBatch('element-status');
    }

    return updatedIds;
  }

  private getStatusTargetElement(id: string): joint.dia.Element | null {
    const cell = this.graph.getCell(id);
    if (!isStatusSupportedElement(cell)) {
      return null;
    }

    return cell;
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

  public getLinkBw(id: string): LinkBwValue | null {
    const cell = this.graph.getCell(id);
    if (!cell?.isLink()) {
      return null;
    }

    const data = cell.get('data');
    if (!isRecord(data)) {
      return null;
    }

    const inputBw = toOptionalFiniteNumber(data.in_bw);
    const outputBw = toOptionalFiniteNumber(data.out_bw);
    return {
      in: inputBw ?? 0,
      out: outputBw ?? 0
    };
  }

  public updateData(id: string, patch: CellData): boolean {
    const cell = this.graph.getCell(id);
    if (!cell?.isLink()) {
      return false;
    }

    const nextData = mergePatchedData(cell.get('data'), patch);
    cell.set('data', nextData, { silent: true });
    return true;
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
