import * as THREE from 'three';
import { Point } from '../primitives/point';

export function getNearestPoint(loc, points, threshold = Number.MAX_SAFE_INTEGER) {
  let minDist = Number.MAX_SAFE_INTEGER;
  let nearest = null;
  for (const point of points) {
    const dist = distance(point, loc);
    if (dist < minDist && dist < threshold) {
      minDist = dist;
      nearest = point;
    }
  }
  return nearest;
}

export function getNearestSegment(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
  let minDist = Number.MAX_SAFE_INTEGER;
  let nearest = null;
  for (const seg of segments) {
    const dist = seg.distanceToPoint(loc);
    if (dist < minDist && dist < threshold) {
      minDist = dist;
      nearest = seg;
    }
  }
  return nearest;
}

export function getNearestSegments(loc, segments, threshold = Number.MAX_SAFE_INTEGER) {
  let minDist = Number.MAX_SAFE_INTEGER;
  let nearest = [];
  for (const seg of segments) {
    const dist = seg.distanceToPoint(loc);
    if (dist < minDist && dist < threshold) {
      nearest.push(seg);
    }
  }
  return nearest;
}

export function normalize(p) {
  return scale(p, 1 / magnitude(p));
}

export function magnitude(p) {
  return Math.hypot(p.x, p.y);
}

export function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export function average(p1, p2) {
  return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

export function dot(p1, p2) {
  return p1.x * p2.x + p1.y * p2.y;
}

export function add(p1, p2) {
  return new Point(p1.x + p2.x, p1.y + p2.y);
}

export function subtract(p1, p2) {
  return new Point(p1.x - p2.x, p1.y - p2.y);
}

export function translate(loc, angle, offset) {
  return new Point(loc.x + Math.cos(angle) * offset, loc.y + Math.sin(angle) * offset);
}

export function angle(p) {
  return Math.atan2(p.y, p.x);
}

export function scale(p, scaler) {
  return new Point(p.x * scaler, p.y * scaler);
}

export function perpendicular(p) {
  return new Point(-p.y, p.x);
}

export function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
  const eps = 0.001;
  if (Math.abs(bottom) > eps) {
    const t = tTop / bottom;
    const u = uTop / bottom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t,
      };
    }
  }

  return null;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function removeFromScene(scene, uuid) {
  let object = scene.getObjectByProperty('uuid', uuid);
  scene.remove(object);
}

// if you're following along, this comes in a few minutes ;-)
export function getRandomColor() {
  let h = 290 + Math.random() * 260;
  let s = 100;
  let l = 60;
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateSplinePoints(pointObjects, width, color, dash) {
  let curvePoints = pointObjects.map((p) => new THREE.Vector3(p.x + 0.5, -p.y - 0.5, 0.01));
  let curveQuad = new THREE.QuadraticBezierCurve3(curvePoints[0], curvePoints[1], curvePoints[2]);
  var splinePoints = curveQuad.getPoints(10);
  const points = [];
  for (var i = 0; i < splinePoints.length; i++) {
    points.push(new THREE.Vector3(splinePoints[i].x, 0.01, splinePoints[i].y));
  }
  return points;
}
