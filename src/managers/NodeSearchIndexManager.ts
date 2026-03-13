import * as joint from '@joint/core';
import type { TopologyNodeLabelField, TopologyNodeSearchResult } from '../core/types';

interface SearchEntry {
  id: string;
  title: string;
  normalizedTitle: string;
  ipaddr: string;
  normalizedIpaddr: string;
  order: number;
}

interface SortedEntry {
  id: string;
  text: string;
  normalizedText: string;
  order: number;
}

interface FieldIndex {
  exact: Map<string, SortedEntry[]>;
  sorted: SortedEntry[];
  trigrams: Map<string, Set<string>>;
}

const SEARCH_FIELDS: TopologyNodeLabelField[] = ['title', 'ipaddr'];

export class NodeSearchIndexManager {
  private readonly graph: joint.dia.Graph;

  private entriesById = new Map<string, SearchEntry>();

  private readonly indexes: Record<TopologyNodeLabelField, FieldIndex> = {
    title: this.createEmptyFieldIndex(),
    ipaddr: this.createEmptyFieldIndex()
  };

  private readonly onAddOrRemoveBound = (): void => {
    this.rebuildIndex();
  };

  private readonly onAttrsChangeBound = (cell: joint.dia.Cell): void => {
    if (!cell.isElement()) {
      return;
    }

    const id = String(cell.id);
    const current = this.entriesById.get(id);
    const nextTitle = this.readLabelText(cell, 'title');
    const nextIpaddr = this.readLabelText(cell, 'ipaddr');
    const nextNormalizedTitle = this.normalizeSearchText(nextTitle);
    const nextNormalizedIpaddr = this.normalizeSearchText(nextIpaddr);

    if (!current) {
      this.rebuildIndex();
      return;
    }

    if (
      current.normalizedTitle !== nextNormalizedTitle ||
      current.normalizedIpaddr !== nextNormalizedIpaddr
    ) {
      this.rebuildIndex();
    }
  };

  public constructor(graph: joint.dia.Graph) {
    this.graph = graph;
    this.rebuildIndex();

    this.graph.on('add', this.onAddOrRemoveBound);
    this.graph.on('remove', this.onAddOrRemoveBound);
    this.graph.on('change:attrs', this.onAttrsChangeBound);
  }

  public rebuildIndex(): void {
    this.entriesById = new Map();
    this.indexes.title = this.createEmptyFieldIndex();
    this.indexes.ipaddr = this.createEmptyFieldIndex();

    this.graph.getElements().forEach((element, order) => {
      const entry: SearchEntry = {
        id: String(element.id),
        title: this.readLabelText(element, 'title'),
        normalizedTitle: '',
        ipaddr: this.readLabelText(element, 'ipaddr'),
        normalizedIpaddr: '',
        order
      };
      entry.normalizedTitle = this.normalizeSearchText(entry.title);
      entry.normalizedIpaddr = this.normalizeSearchText(entry.ipaddr);
      this.entriesById.set(entry.id, entry);

      SEARCH_FIELDS.forEach((field) => {
        const text = entry[field];
        const normalizedText = field === 'title' ? entry.normalizedTitle : entry.normalizedIpaddr;
        if (normalizedText.length === 0) {
          return;
        }

        const sortedEntry: SortedEntry = {
          id: entry.id,
          text,
          normalizedText,
          order: entry.order
        };
        this.addExactEntry(field, sortedEntry);
        this.indexes[field].sorted.push(sortedEntry);
        this.addTrigrams(field, sortedEntry);
      });
    });

    SEARCH_FIELDS.forEach((field) => {
      this.indexes[field].sorted.sort((left, right) => {
        if (left.normalizedText === right.normalizedText) {
          return left.order - right.order;
        }
        return left.normalizedText.localeCompare(right.normalizedText);
      });
    });
  }

  public search(field: TopologyNodeLabelField, query: string): TopologyNodeSearchResult | null {
    const normalizedQuery = this.normalizeSearchText(query);
    if (normalizedQuery.length === 0) {
      return null;
    }

    const exactMatch = this.findExact(field, normalizedQuery);
    if (exactMatch) {
      return { id: exactMatch.id, text: exactMatch.text, field };
    }

    const prefixMatch = this.findPrefix(field, normalizedQuery);
    if (prefixMatch) {
      return { id: prefixMatch.id, text: prefixMatch.text, field };
    }

    const containsMatch = this.findContains(field, normalizedQuery);
    if (containsMatch) {
      return { id: containsMatch.id, text: containsMatch.text, field };
    }

    return null;
  }

  public destroy(): void {
    this.graph.off('add', this.onAddOrRemoveBound);
    this.graph.off('remove', this.onAddOrRemoveBound);
    this.graph.off('change:attrs', this.onAttrsChangeBound);
    this.entriesById.clear();
    this.indexes.title = this.createEmptyFieldIndex();
    this.indexes.ipaddr = this.createEmptyFieldIndex();
  }

  private createEmptyFieldIndex(): FieldIndex {
    return {
      exact: new Map(),
      sorted: [],
      trigrams: new Map()
    };
  }

  private readLabelText(element: joint.dia.Element, field: TopologyNodeLabelField): string {
    const value = element.attr(`${field}/text`);
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  }

  private normalizeSearchText(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }

  private addExactEntry(field: TopologyNodeLabelField, entry: SortedEntry): void {
    const bucket = this.indexes[field].exact.get(entry.normalizedText) ?? [];
    bucket.push(entry);
    this.indexes[field].exact.set(entry.normalizedText, bucket);
  }

  private addTrigrams(field: TopologyNodeLabelField, entry: SortedEntry): void {
    const grams = this.buildTrigrams(entry.normalizedText);
    if (grams.length === 0) {
      return;
    }

    grams.forEach((gram) => {
      const bucket = this.indexes[field].trigrams.get(gram) ?? new Set<string>();
      bucket.add(entry.id);
      this.indexes[field].trigrams.set(gram, bucket);
    });
  }

  private findExact(field: TopologyNodeLabelField, normalizedQuery: string): SortedEntry | null {
    const bucket = this.indexes[field].exact.get(normalizedQuery);
    if (!bucket || bucket.length === 0) {
      return null;
    }

    return this.pickBestCandidate(bucket);
  }

  private findPrefix(field: TopologyNodeLabelField, normalizedQuery: string): SortedEntry | null {
    const sorted = this.indexes[field].sorted;
    if (sorted.length === 0) {
      return null;
    }

    let left = 0;
    let right = sorted.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midEntry = sorted[mid];
      if (!midEntry) {
        break;
      }
      if (midEntry.normalizedText.localeCompare(normalizedQuery) < 0) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    let best: SortedEntry | null = null;
    for (let index = left; index < sorted.length; index += 1) {
      const candidate = sorted[index];
      if (!candidate) {
        break;
      }
      if (!candidate.normalizedText.startsWith(normalizedQuery)) {
        break;
      }
      if (!best || candidate.order < best.order) {
        best = candidate;
      }
    }

    return best;
  }

  private findContains(field: TopologyNodeLabelField, normalizedQuery: string): SortedEntry | null {
    const candidates = normalizedQuery.length >= 3
      ? this.collectTrigramCandidates(field, normalizedQuery)
      : this.indexes[field].sorted;
    if (candidates.length === 0) {
      return null;
    }

    let best: SortedEntry | null = null;
    for (const candidate of candidates) {
      if (!candidate.normalizedText.includes(normalizedQuery)) {
        continue;
      }
      if (!best || candidate.order < best.order) {
        best = candidate;
      }
    }

    return best;
  }

  private collectTrigramCandidates(field: TopologyNodeLabelField, normalizedQuery: string): SortedEntry[] {
    const grams = this.buildTrigrams(normalizedQuery);
    if (grams.length === 0) {
      return this.indexes[field].sorted;
    }

    const buckets = grams
      .map((gram) => this.indexes[field].trigrams.get(gram))
      .filter((bucket): bucket is Set<string> => Boolean(bucket))
      .sort((left, right) => left.size - right.size);
    if (buckets.length !== grams.length || buckets.length === 0) {
      return [];
    }

    const [seed, ...rest] = buckets;
    if (!seed) {
      return [];
    }
    const candidateIds = Array.from(seed).filter((id) => rest.every((bucket) => bucket.has(id)));

    return candidateIds
      .map((id) => this.entriesById.get(id))
      .filter((entry): entry is SearchEntry => Boolean(entry))
      .map((entry) => ({
        id: entry.id,
        text: entry[field],
        normalizedText: field === 'title' ? entry.normalizedTitle : entry.normalizedIpaddr,
        order: entry.order
      }));
  }

  private buildTrigrams(value: string): string[] {
    if (value.length < 3) {
      return [];
    }

    const grams = new Set<string>();
    for (let index = 0; index <= value.length - 3; index += 1) {
      grams.add(value.slice(index, index + 3));
    }
    return Array.from(grams);
  }

  private pickBestCandidate(entries: SortedEntry[]): SortedEntry | null {
    const first = entries[0];
    if (!first) {
      return null;
    }

    let best = first;
    for (let index = 1; index < entries.length; index += 1) {
      const candidate = entries[index];
      if (candidate && candidate.order < best.order) {
        best = candidate;
      }
    }
    return best;
  }
}
