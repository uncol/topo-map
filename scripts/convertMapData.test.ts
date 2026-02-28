import { describe, expect, it } from 'vitest';
import { convertMapData } from '../src/decoders/MapConverter.ts';
import { configuredShapeMapData, glyphSegmentMapData } from './fixtures/configuredShapeMapData.ts';

describe('convertMapData', () => {
  it('converts segment payload with glyph nodes and port-based links', () => {
    const result = convertMapData(glyphSegmentMapData);

    expect(result.viewport).toBeUndefined();
    expect(result.graph.cells).toHaveLength(4);

    const sae = result.graph.cells.find((cell) => cell.id === '1');
    expect(sae).toBeDefined();
    expect(sae?.type).toBe('noc.FontIconElement');
    expect(sae?.position).toEqual({ x: 56.25, y: 23.75 });
    expect((sae as Record<string, any>)?.attrs.icon.text).toBe(String.fromCodePoint(61996));
    expect((sae as Record<string, any>)?.attrs.icon.size).toBe('gf-1x');
    expect((sae as Record<string, any>)?.attrs.title.text).toBe('SAE');
    expect((sae as Record<string, any>)?.attrs.ipaddr.text).toBe('1.1.1.1');

    const link = result.graph.cells.find((cell) => cell.id === '69676d2cfa1bc463f16465e2');
    expect(link).toBeDefined();
    expect(link?.type).toBe('noc.LinkElement');
    expect(link?.source).toEqual({ id: '3' });
    expect(link?.target).toEqual({ id: '2' });
    expect((link as Record<string, any>)?.attrs.connector).toBe('normal');
    expect((link as Record<string, any>)?.attrs.method).toBe('lldp');
    expect((link as Record<string, any>)?.attrs.bw).toBe(10000000000);
    expect((link as Record<string, any>)?.attrs.in_bw).toBe(10000000000);
    expect((link as Record<string, any>)?.attrs.out_bw).toBe(10000000000);
  });

  it('converts shape-based payload into image nodes and preserves port link mapping', () => {
    const result = convertMapData(configuredShapeMapData);

    expect(result.viewport).toBeUndefined();
    expect(result.graph.cells).toHaveLength(
      configuredShapeMapData.nodes.length + configuredShapeMapData.links.length
    );

    const groupNode = result.graph.cells.find((cell) => cell.id === '6973ffeb8ce3e3bca2229017');
    expect(groupNode).toBeDefined();
    expect(groupNode?.type).toBe('noc.ImageIconElement');
    expect(groupNode?.position).toEqual({ x: 1300, y: 100 });
    expect((groupNode as Record<string, any>)?.attrs.icon.href).toBe('#img-Cisco-router');
    expect((groupNode as Record<string, any>)?.attrs.icon.width).toBe('47.5');
    expect((groupNode as Record<string, any>)?.attrs.icon.height).toBe('32.5');
    expect((groupNode as Record<string, any>)?.attrs.title.text).toBe('Атмосфера+ZIAX');

    const workstationNode = result.graph.cells.find((cell) => cell.id === '31');
    expect(workstationNode).toBeDefined();
    expect(workstationNode?.type).toBe('noc.ImageIconElement');
    expect((workstationNode as Record<string, any>)?.attrs.icon.href).toBe('#img-Cisco-workstation');
    expect((workstationNode as Record<string, any>)?.attrs.ipaddr.text).toBe('10.100.16.162');

    const mappedLink = result.graph.cells.find((cell) => cell.id === '697baec7d58805e96c998c11');
    expect(mappedLink).toBeDefined();
    expect(mappedLink?.type).toBe('noc.LinkElement');
    expect(mappedLink?.source).toEqual({ id: '32' });
    expect(mappedLink?.target).toEqual({ id: '31' });
    expect((mappedLink as Record<string, any>)?.attrs.method).toBe('xmac');
    expect((mappedLink as Record<string, any>)?.attrs.bw).toBe(1000000000);

    const cloudLink = result.graph.cells.find((cell) => cell.id === '697ba229d58805e96c998be6-22-23');
    expect(cloudLink).toBeDefined();
    expect(cloudLink?.source).toEqual({ id: '697ba229d58805e96c998be6' });
    expect(cloudLink?.target).toEqual({ id: '39' });
    expect((cloudLink as Record<string, any>)?.attrs.bw).toBe(1000000000);
  });
});
