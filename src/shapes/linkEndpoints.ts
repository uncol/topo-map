import type * as joint from '@joint/core';

const LINK_ICON_SELECTOR = 'icon';
const LINK_CENTER_ANCHOR: joint.anchors.AnchorJSON = { name: 'center' };

export function createIconLinkEnd(id: joint.dia.Cell.ID): joint.dia.Link.EndJSON {
  return {
    id,
    selector: LINK_ICON_SELECTOR,
    anchor: { ...LINK_CENTER_ANCHOR }
  };
}
