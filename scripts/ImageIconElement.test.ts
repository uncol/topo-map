import { describe, expect, it } from 'vitest';
import { ImageIconElement } from '../src/shapes/ImageIconElement.ts';

describe('ImageIconElement', () => {
  it('normalizes image references into matching href and xlinkHref values', () => {
    const element = new ImageIconElement({
      attrs: {
        title: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          href: '#img-Cisco-workstation'
        }
      }
    });

    expect(element.attr('icon/href')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/xlinkHref')).toBe('/stencils/Cisco/workstation.svg');
  });

  it('keeps href in sync when only xlinkHref is updated', () => {
    const element = new ImageIconElement({
      attrs: {
        title: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          href: '#img-Cisco-router'
        }
      }
    });

    element.attr('icon/xlinkHref', '#img-Cisco-workstation');

    expect(element.attr('icon/href')).toBe('/stencils/Cisco/workstation.svg');
    expect(element.attr('icon/xlinkHref')).toBe('/stencils/Cisco/workstation.svg');
  });
});
