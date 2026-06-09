export function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function norm180(deg: number): number {
  let normalized = deg % 180;
  if (normalized < 0) normalized += 180;
  return normalized;
}

export function fmt(value: number): string {
  return Number(value).toFixed(2);
}
