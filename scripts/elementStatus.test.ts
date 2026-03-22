import * as joint from '@joint/core';
import { describe, expect, it } from 'vitest';
import { applyElementStatus, readElementStatus } from '../src/core/elementStatus';

describe('elementStatus', () => {
  it('reads and updates status for font elements', () => {
    const element = new joint.dia.Element({
      id: 'node-1',
      type: 'noc.FontIconElement',
      size: { width: 64, height: 64 },
      attrs: {
        icon: {
          text: '\uF20A',
          size: 'gf-1x',
          status_code: 1
        },
        title: {
          text: 'Core'
        },
        ipaddr: {
          text: '10.0.0.1'
        }
      },
      data: {
        id: 'node-1',
        address: '10.0.0.1',
        name: 'Core',
        status_code: 1
      }
    });

    expect(readElementStatus(element)).toEqual({ status_code: 1 });
    expect(applyElementStatus(element, {
      status_code: 36,
      metrics_label: 'CPU<br/>85%'
    })).toBe(true);
    expect(readElementStatus(element)).toEqual({
      status_code: 36,
      metrics_label: 'CPU<br/>85%'
    });
    expect(element.get('data')).toMatchObject({
      name: 'Core',
      isMaintenance: true,
      status_code: 36,
      metrics_label: 'CPU<br/>85%'
    });
    expect(element.attr('icon/status_code')).toBe(36);
    expect(element.attr('title/text')).toBe('Core\nCPU\n85%');
    expect(element.attr('ipaddr/text')).toBe('10.0.0.1\nCPU\n85%');
  });

  it('reads and updates status for image elements', () => {
    const element = new joint.dia.Element({
      id: 'node-2',
      type: 'noc.ImageIconElement',
      size: { width: 64, height: 64 },
      attrs: {
        icon: {
          href: '#img-Cisco-router',
          width: '64',
          height: '64',
          status_code: 2
        },
        title: {
          text: 'Router'
        },
        ipaddr: {
          text: '10.0.0.2'
        }
      },
      data: {
        id: 'node-2',
        address: '10.0.0.2',
        name: 'Router',
        status_code: 2
      }
    });

    expect(readElementStatus(element)).toEqual({ status_code: 2 });
    expect(applyElementStatus(element, {
      status_code: 4,
      metrics_label: ''
    })).toBe(true);
    expect(readElementStatus(element)).toEqual({ status_code: 4 });
    expect(element.get('data')).toMatchObject({
      name: 'Router',
      isMaintenance: false,
      status_code: 4,
      metrics_label: ''
    });
    expect(element.attr('icon/status_code')).toBe(4);
    expect(element.attr('title/text')).toBe('Router');
    expect(element.attr('ipaddr/text')).toBe('10.0.0.2');
  });

  it('does not duplicate metrics in ipaddr on repeated updates', () => {
    const element = new joint.dia.Element({
      id: 'node-3',
      type: 'noc.FontIconElement',
      size: { width: 64, height: 64 },
      attrs: {
        icon: {
          text: '\uF20A',
          size: 'gf-1x',
          status_code: 1
        },
        title: {
          text: 'Edge'
        },
        ipaddr: {
          text: '10.0.0.3'
        }
      },
      data: {
        id: 'node-3',
        address: '10.0.0.3',
        name: 'Edge',
        status_code: 1
      }
    });

    expect(applyElementStatus(element, {
      status_code: 2,
      metrics_label: 'CPU<br/>85%'
    })).toBe(true);
    expect(applyElementStatus(element, {
      status_code: 4,
      metrics_label: 'MEM<br/>90%'
    })).toBe(true);

    expect(element.get('data')).toMatchObject({
      isMaintenance: false
    });
    expect(element.attr('title/text')).toBe('Edge\nMEM\n90%');
    expect(element.attr('ipaddr/text')).toBe('10.0.0.3\nMEM\n90%');
  });
});
