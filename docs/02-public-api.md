# Публичный API

Актуальный API экспортируется из `/Users/dima/Projects/topo-map/src/index.ts`.

## Типы данных

```ts
export type TopologyMode = 'pan' | 'zoomToArea' | 'edit';

export interface TopologyConfig {
  mainContainer: HTMLElement;
  minimapContainer: HTMLElement;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  gridSize?: number;
  snapThreshold?: number;
  boundsPadding?: number;
  onReady?: () => void;
  preserveViewportOnLoad?: boolean;
  fitToPageOnLoad?: boolean;
  enableViewportCulling?: boolean;
  asyncRendering?: boolean;
  debugLogs?: boolean;
}

export interface NodeData {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  status?: string;
  iconUnicode?: string;
  iconSizeClass?: string;
  iconStatusClass?: string;
  iconHref?: string;
  attrs?: Record<string, unknown>;
}

export interface LinkData {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  attrs?: Record<string, unknown>;
}
```

## Класс `Topology`

### Конструктор

```ts
new Topology(config: TopologyConfig)
```

Назначение:
- создает основной paper и minimap;
- инициализирует state/managers/modes;
- включает начальный режим `pan`.

### Методы загрузки

```ts
loadData(nodes: NodeData[], links: LinkData[]): void
```

Назначение:
- очищает и заполняет граф узлами/линками;
- перестраивает spatial index;
- применяет ограничения viewport.

### Сериализация

```ts
toJSON(): object
fromJSON(data: object): void
```

Поведение `toJSON`:
- возвращает envelope с `schemaVersion`, `viewport`, `graph`.

Поведение `fromJSON`:
- принимает envelope или raw graph JSON;
- корректно восстанавливает `noc.*` типы через `cellNamespace`;
- если `preserveViewportOnLoad !== true`, применяет viewport из JSON; если viewport нет и `fitToPageOnLoad === true` — делает `fit to page`, иначе сбрасывает к initial.

### Доступ к данным

```ts
data.elements.getIdsByDataType(type: string): string[]
data.elements.getById(id: string): { id: string; data: Record<string, unknown> } | null
data.elements.getAll(): Array<{ id: string; data: Record<string, unknown> }>
data.elements.getStatus(id: string): string | null
data.elements.getStatuses(ids: string[]): Array<{ id: string; status: string | null }>
data.elements.setStatus(id: string, status: string): boolean
data.elements.setStatuses(ids: string[], status: string): string[]
data.links.getById(id: string): { id: string; data: Record<string, unknown> } | null
data.links.getAll(): Array<{ id: string; data: Record<string, unknown> }>
```

Назначение:
- синхронный read-only доступ к `data` из уже загруженного графа;
- для элементов, созданных через `loadData()` и `convertAndLoad()`, `data` заполняется на этапе построения cell;
- `getStatus`/`getStatuses` возвращают текущий статус элемента;
- `setStatus`/`setStatuses` обновляют `data` и синхронизируют presentation только для изменяемых элементов;
- `elements` читает только `graph.getElements()`;
- `links` читает только `graph.getLinks()`;
- методы возвращают обычные JS-объекты, без утечки `joint.dia.Cell`.

### Режимы и взаимодействие

```ts
setMode(mode: TopologyMode): void
getMode(): string
setSnapToGrid(enabled: boolean): void
setGuidesEnabled(enabled: boolean): void
setBoundsPadding(padding: number): void
```

Назначение:
- `setMode`: переключает `pan | zoomToArea | edit`;
- `setSnapToGrid`: включает/выключает snap и визуальную сетку в edit режиме;
- `setGuidesEnabled`: включает/выключает dynamic guides;
- `setBoundsPadding`: задает отступ ограничений перемещения/панорамирования.

### Zoom API

```ts
zoomIn(): void
zoomOut(): void
resetView(): void
```

### Resize API

```ts
resizeMain(width: number, height: number): void
resizeMinimap(width: number, height: number): void
```

Важно:
- вызывать из resize обработчиков контейнеров;
- значения `<= 1` игнорируются защитой.

### Освобождение ресурсов

```ts
destroy(): void
```

Назначение:
- отписка от событий;
- удаление paper/layers;
- очистка графа и индексов.

## Минимальный пример

```ts
import { Topology } from '../dist/index.js';

const map = new Topology({
  mainContainer: document.getElementById('topology-main')!,
  minimapContainer: document.getElementById('topology-minimap')!,
  minScale: 0.1,
  maxScale: 5,
  gridSize: 20,
  boundsPadding: 12
});

map.loadData(nodes, links);
map.setMode('edit');
map.setSnapToGrid(true);
map.setGuidesEnabled(true);

const managedObjectIds = map.data.elements.getIdsByDataType('managedobject');
```
