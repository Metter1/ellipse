import { EPS, MIN_A, MIN_B } from '../constants/ellipse';
import type {
  CoreLayout,
  EllipseModel,
  Point,
} from '../types/ellipse';
import { clamp, degToRad, radToDeg } from './math';

export function getApex(ellipse: EllipseModel): Point {
  const th = degToRad(ellipse.theta);
  const c = Math.cos(th);
  const s = Math.sin(th);

  const t = Math.atan2(-ellipse.b * s, ellipse.a * c);
  const ct = Math.cos(t);
  const st = Math.sin(t);

  return {
    x: ellipse.cx + ellipse.a * ct * c - ellipse.b * st * s,
    y: ellipse.cy + ellipse.a * ct * s + ellipse.b * st * c,
  };
}

export function getMajorAxisEnd(ellipse: EllipseModel): Point {
  const th = degToRad(ellipse.theta);

  return {
    x: ellipse.cx + ellipse.a * Math.cos(th),
    y: ellipse.cy + ellipse.a * Math.sin(th),
  };
}

export function getBoundingBox(ellipse: EllipseModel) {
  const th = degToRad(ellipse.theta);
  const c = Math.cos(th);
  const s = Math.sin(th);

  const dx = Math.sqrt(
    ellipse.a * ellipse.a * c * c + ellipse.b * ellipse.b * s * s,
  );
  const dy = Math.sqrt(
    ellipse.a * ellipse.a * s * s + ellipse.b * ellipse.b * c * c,
  );

  return {
    minX: ellipse.cx - dx,
    minY: ellipse.cy - dy,
    maxX: ellipse.cx + dx,
    maxY: ellipse.cy + dy,
  };
}

export function setCenterByPointer(
  ellipse: EllipseModel,
  point: Point,
  core: CoreLayout,
): void {
  const thetaRad = degToRad(ellipse.theta);
  const halfVertical = Math.sqrt(
    ellipse.a * ellipse.a * Math.sin(thetaRad) ** 2 +
      ellipse.b * ellipse.b * Math.cos(thetaRad) ** 2,
  );

  ellipse.cx = clamp(point.x, 0, core.width);
  ellipse.cy = core.coreAxisY;

  const allowedHalfHeight = Math.min(
    ellipse.cy - core.coreTop,
    core.coreBottom - ellipse.cy,
  );

  if (halfVertical > allowedHalfHeight + EPS) {
    const scale = allowedHalfHeight / halfVertical;
    ellipse.a = Math.max(MIN_A, ellipse.a * scale);
    ellipse.b = Math.max(MIN_B, ellipse.b * scale);

    if (ellipse.b >= ellipse.a) {
      ellipse.a = ellipse.b + 0.001;
    }
  }
}

export function solveEllipseFromApex(
  ellipse: EllipseModel,
  apexPoint: Point,
  core: CoreLayout,
): void {
  const cx = ellipse.cx;
  const cy = ellipse.cy;

  const px = clamp(apexPoint.x, cx + 1, core.width);
  const py = clamp(apexPoint.y, core.coreTop, core.coreBottom);

  const u = Math.max(px - cx, 1);
  const v = py - cy;
  const d = Math.min(cy - core.coreTop, core.coreBottom - cy);

  if (d <= MIN_B) {
    return;
  }

  const sign = v >= 0 ? 1 : -1;
  const absV = Math.abs(v);

  if (absV < 1e-5) {
    ellipse.theta = 0;
    ellipse.a = Math.max(u, MIN_A);
    ellipse.b = d;

    if (ellipse.b >= ellipse.a) {
      ellipse.a = ellipse.b + 0.001;
    }

    return;
  }

  const limitedAbsV = Math.min(absV, d - 1e-6);

  function calcResidual(theta: number): number {
    const s = Math.sin(theta);
    const c = Math.cos(theta);

    const det = c * c - s * s;
    if (Math.abs(det) < 1e-8) {
      return Number.NaN;
    }

    const A = (u * u * c * c - d * d * s * s) / det;
    const B = (d * d * c * c - u * u * s * s) / det;

    if (!(A > 0) || !(B > 0)) {
      return Number.NaN;
    }

    const lhs = ((A - B) * s * c) / u;
    return lhs - limitedAbsV;
  }

  let lo = 1e-6;
  let hi = Math.PI / 2 - 1e-6;

  let bestTheta = degToRad(
    clamp(radToDeg(Math.atan2(limitedAbsV, u)), 0.001, 89.999),
  );
  let bestErr = Number.POSITIVE_INFINITY;

  for (let i = 0; i < 500; i++) {
    const theta = lo + (hi - lo) * (i / 499);
    const residual = calcResidual(theta);

    if (!Number.isNaN(residual)) {
      const error = Math.abs(residual);

      if (error < bestErr) {
        bestErr = error;
        bestTheta = theta;
      }
    }
  }

  let left = Math.max(1e-6, bestTheta - 0.25);
  let right = Math.min(Math.PI / 2 - 1e-6, bestTheta + 0.25);

  let resolvedTheta = bestTheta;

  for (let i = 0; i < 80; i++) {
    const m1 = left + (right - left) / 3;
    const m2 = right - (right - left) / 3;

    const r1 = calcResidual(m1);
    const r2 = calcResidual(m2);

    const e1 = Number.isNaN(r1)
      ? Number.POSITIVE_INFINITY
      : Math.abs(r1);
    const e2 = Number.isNaN(r2)
      ? Number.POSITIVE_INFINITY
      : Math.abs(r2);

    if (e1 < e2) {
      right = m2;
      resolvedTheta = m1;
    } else {
      left = m1;
      resolvedTheta = m2;
    }
  }

  const s = Math.sin(resolvedTheta);
  const c = Math.cos(resolvedTheta);
  const det = c * c - s * s;

  let A = (u * u * c * c - d * d * s * s) / det;
  let B = (d * d * c * c - u * u * s * s) / det;

  A = Math.max(A, MIN_A * MIN_A);
  B = Math.max(B, MIN_B * MIN_B);

  let a = Math.sqrt(A);
  let b = Math.sqrt(B);

  if (b > a) {
    const temp = a;
    a = b;
    b = temp;
  }

  ellipse.a = a;
  ellipse.b = b;
  ellipse.theta = radToDeg(sign * resolvedTheta);
}
