import type { CoreLayout, Point } from '../types/ellipse';

export function getLocalPoint(
  event: PointerEvent,
  svg: SVGSVGElement | null,
  core: CoreLayout,
): Point {
  if (!svg) {
    return { x: 0, y: 0 };
  }

  const rect = svg.getBoundingClientRect();
  const sx = core.width / rect.width;
  const sy = core.height / rect.height;

  return {
    x: (event.clientX - rect.left) * sx,
    y: (event.clientY - rect.top) * sy,
  };
}
