import { describe, expect, it } from 'vitest';
import { ImageIconElement } from '../src/shapes/ImageIconElement';

describe('ImageIconElement', () => {
  it('normalizes image references into matching href and xlinkHref values', () => {
    const element = new ImageIconElement({
      attrs: {
        nodeName: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          href: '#img-Cisco-workstation',
          status_code: 4
        }
      }
    });

    expect(element.attr('icon/href')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/xlinkHref')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/filter')).toBe('url(#osDown)');
  });

  it('keeps href in sync when only xlinkHref is updated', () => {
    const element = new ImageIconElement({
      attrs: {
        nodeName: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          href: '#img-Cisco-router',
          status_code: 2
        }
      }
    });

    element.attr('icon/xlinkHref', '#img-Cisco-workstation');

    expect(element.attr('icon/href')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/xlinkHref')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/filter')).toBe('url(#osAlarm)');
  });

  it('adds badge markup and filter from shapeOverlay', () => {
    const element = new ImageIconElement({
      size: {
        width: 64,
        height: 64
      },
      data: {
        shapeOverlay: [{ code: 61972, position: 'NE', form: 's' }]
      },
      attrs: {
        nodeName: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          href: '#img-Cisco-router',
          status_code: 4
        }
      }
    });

    expect(element.get('markup')).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: 'badgeNeBody' }),
      expect.objectContaining({ selector: 'badgeNeText' })
    ]));
    expect(element.attr('badgeNeText/text')).toBe(String.fromCodePoint(61972));
    expect(element.attr('badgeNeBody/filter')).toBe('url(#osDown)');
    expect(element.attr('badgeNeText/filter')).toBe('url(#osDown)');
  });
});
