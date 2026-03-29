import { describe, expect, it } from 'vitest';
import { FontIconElement } from '../src/shapes/FontIconElement';

describe('FontIconElement', () => {
  it('adds badge markup and class from shapeOverlay', () => {
    const element = new FontIconElement({
      size: {
        width: 64,
        height: 64
      },
      data: {
        shapeOverlay: [{ code: 61972, position: 'NE', form: 'c' }]
      },
      attrs: {
        nodeName: {
          text: ''
        },
        ipaddr: {
          text: ''
        },
        icon: {
          text: String.fromCodePoint(61996),
          size: 'gf-1x',
          status_code: 1
        }
      }
    });

    expect(element.get('markup')).toEqual(expect.arrayContaining([
      expect.objectContaining({ selector: 'badgeNeBody' }),
      expect.objectContaining({ selector: 'badgeNeText' })
    ]));
    expect(element.attr('badgeNeText/text')).toBe(String.fromCodePoint(61972));
    expect(element.attr('badgeNeText/class')).toContain('gf');
    expect(element.attr('badgeNeText/class')).toContain('gf-ok');
  });
});
