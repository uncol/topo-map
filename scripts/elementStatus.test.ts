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
          status: 'gf-ok'
        },
        title: {
          text: 'Core'
        },
        ipaddr: {
          text: ''
        }
      },
      data: {
        id: 'node-1',
        iconStatusClass: 'gf-ok'
      }
    });

    expect(readElementStatus(element)).toBe('gf-ok');
    expect(applyElementStatus(element, 'gf-fail')).toBe(true);
    expect(readElementStatus(element)).toBe('gf-fail');
    expect(element.get('data')).toMatchObject({
      status: 'gf-fail',
      iconStatusClass: 'gf-fail'
    });
    expect(element.attr('icon/status')).toBe('gf-fail');
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
          status: 'Warning'
        },
        title: {
          text: 'Router'
        },
        ipaddr: {
          text: ''
        }
      },
      data: {
        id: 'node-2',
        status: 'Warning'
      }
    });

    expect(readElementStatus(element)).toBe('Warning');
    expect(applyElementStatus(element, 'Critical')).toBe(true);
    expect(readElementStatus(element)).toBe('Critical');
    expect(element.get('data')).toMatchObject({
      status: 'Critical'
    });
    expect(element.attr('icon/status')).toBe('Critical');
  });
});
