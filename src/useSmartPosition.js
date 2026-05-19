/**
 * useSmartPosition — compute popup position that avoids viewport overflow.
 *
 * @param {DOMRect} triggerRect  — bounding rect of the trigger element (from getBoundingClientRect)
 * @param {{ width: number, height: number }} popupSize — estimated popup dimensions
 * @param {number} [gap=4] — gap between trigger and popup
 * @returns {{ top: number, left: number, transform: string }}
 */
export function smartPosition(triggerRect, popupSize, gap = 4) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const popupW = popupSize.width || 160;
  const popupH = popupSize.height || 200;

  // Default: open below, centered on trigger
  let top = triggerRect.bottom + gap;
  let left = triggerRect.left + triggerRect.width / 2 - popupW / 2;
  let transformX = 0;

  // Flip upward if would overflow bottom
  if (top + popupH > vh - 8) {
    top = triggerRect.top - popupH - gap;
    if (top < 8) top = 8; // clamp to top edge
  }

  // Clamp horizontally so popup stays within viewport
  if (left + popupW > vw - 8) {
    left = vw - 8 - popupW;
  }
  if (left < 8) {
    left = 8;
  }

  return { top, left, transform: 'none' };
}
