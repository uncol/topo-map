import * as joint from '@joint/core';
import type { ShapeOverlay, ShapeOverlayPosition } from '../core/types';

type AttrMap = Record<string, unknown>;

const VALID_POSITIONS: ShapeOverlayPosition[] = ['NW', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W'];

function isRecord(value: unknown): value is AttrMap {
  return typeof value === 'object' && value !== null;
}

function isShapeOverlayPosition(value: unknown): value is ShapeOverlayPosition {
  return typeof value === 'string' && VALID_POSITIONS.includes(value as ShapeOverlayPosition);
}

function getPositionSuffix(position: ShapeOverlayPosition): string {
  return position.charAt(0) + position.slice(1).toLowerCase();
}

export function getShapeOverlays(data: unknown): ShapeOverlay[] {
  if (!isRecord(data) || !Array.isArray(data.shapeOverlay)) {
    return [];
  }

  const seenPositions = new Set<ShapeOverlayPosition>();

  return data.shapeOverlay.flatMap((item): ShapeOverlay[] => {
    if (!isRecord(item)) {
      return [];
    }

    const { code, position, form } = item;
    if (
      typeof code !== 'number' ||
      !Number.isFinite(code) ||
      !isShapeOverlayPosition(position) ||
      (form !== 'c' && form !== 's') ||
      seenPositions.has(position)
    ) {
      return [];
    }

    seenPositions.add(position);
    return [{
      code,
      position,
      form
    }];
  });
}

export function buildBadgeMarkup(overlays: ShapeOverlay[]): joint.dia.MarkupJSON {
  return overlays.flatMap((overlay) => {
    const suffix = getPositionSuffix(overlay.position);
    return [
      {
        tagName: overlay.form === 'c' ? 'circle' : 'rect',
        selector: `badge${suffix}Body`
      },
      {
        tagName: 'text',
        selector: `badge${suffix}Text`
      }
    ];
  });
}

export function getBadgeSelectors(position: ShapeOverlayPosition): { body: string; text: string } {
  const suffix = getPositionSuffix(position);
  return {
    body: `badge${suffix}Body`,
    text: `badge${suffix}Text`
  };
}

export function getBadgeGeometry(
  size: joint.dia.Size,
  position: ShapeOverlayPosition
): { x: number; y: number; size: number } {
  const badgeSize = Math.max(Math.min(size.height / 3, size.width / 3), 18);
  let x = size.width - 0.62 * badgeSize;
  let y = -0.38 * badgeSize;

  switch (position) {
    case 'N':
      x = size.width / 2 - badgeSize / 2;
      y = -0.38 * badgeSize;
      break;
    case 'E':
      x = size.width - 0.62 * badgeSize;
      y = badgeSize;
      break;
    case 'SE':
      x = size.width - 0.62 * badgeSize;
      y = 2.25 * badgeSize;
      break;
    case 'S':
      x = size.width / 2 - badgeSize / 2;
      y = 2.25 * badgeSize;
      break;
    case 'SW':
      x = -0.38 * badgeSize;
      y = 2.25 * badgeSize;
      break;
    case 'W':
      x = -0.38 * badgeSize;
      y = badgeSize;
      break;
    case 'NW':
      x = -0.38 * badgeSize;
      y = -0.38 * badgeSize;
      break;
    case 'NE':
    default:
      break;
  }

  return {
    x,
    y,
    size: badgeSize
  };
}
