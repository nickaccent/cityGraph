import * as THREE from 'three';
import { Segment } from './segment.js';
import { Point } from './point.js';
import { getIntersection, average } from '../math/utils.js';

export class Polygon {
  constructor(points) {
    this.points = points;
    this.segments = [];
    for (let i = 1; i <= this.points.length; i++) {
      this.segments.push(new Segment(this.points[i - 1], this.points[i % this.points.length]));
    }
  }

  static union(polys) {
    const keptSegments = [];
    const allPolys = [];

    for (let p = 0; p < polys.length; p++) {
      for (let pp = 0; pp < polys[p].length; pp++) {
        allPolys.push(polys[p][pp]);
      }
    }
    Polygon.multiBreak(allPolys);
    for (let i = 0; i < allPolys.length; i++) {
      for (const seg of allPolys[i].segments) {
        let keep = true;
        for (let j = 0; j < allPolys.length; j++) {
          if (i != j) {
            if (allPolys[j].containsSegment(seg)) {
              keep = false;
              break;
            }
          }
        }
        if (keep) {
          keptSegments.push(seg);
        }
      }
    }
    return keptSegments;
  }

  static multiBreak(polys) {
    for (let i = 0; i < polys.length - 1; i++) {
      for (let j = i + 1; j < polys.length; j++) {
        Polygon.break(polys[i], polys[j]);
      }
    }
  }

  static break(poly1, poly2) {
    const segs1 = poly1.segments;
    const segs2 = poly2.segments;

    const intersections = [];
    for (let i = 0; i < segs1.length; i++) {
      for (let j = 0; j < segs2.length; j++) {
        const int = getIntersection(segs1[i].p1, segs1[i].p2, segs2[j].p1, segs2[j].p2);

        if (int && int.offset != 1 && int.offset != 0) {
          const point = new Point(int.x, int.y);

          let aux = segs1[i].p2;
          segs1[i].p2 = point;
          segs1.splice(i + 1, 0, new Segment(point, aux));

          aux = segs2[j].p2;
          segs2[j].p2 = point;
          segs2.splice(j + 1, 0, new Segment(point, aux));
        }
      }
    }
  }

  generateSplinePoints(pointObjects) {
    let curvePoints = pointObjects.map((p) => new THREE.Vector3(p.x, -p.y, 0.01));
    let curveQuad = new THREE.QuadraticBezierCurve3(curvePoints[0], curvePoints[1], curvePoints[2]);
    var splinePoints = curveQuad.getPoints(10);
    const points = [];
    for (var i = 0; i < splinePoints.length; i++) {
      points.push(new Point(splinePoints[i].x, splinePoints[i].y));
    }
    return points;
  }

  containsSegment(seg) {
    const midpoint = average(seg.p1, seg.p2);
    return this.containsPoint(midpoint);
  }

  containsPoint(point) {
    const outerPoint = new Point(-10000, -10000);
    let intersectionCount = 0;
    for (const seg of this.segments) {
      const int = getIntersection(outerPoint, point, seg.p1, seg.p2);
      if (int) {
        intersectionCount++;
      }
    }
    return intersectionCount % 2 == 1;
  }

  distanceToPoint(point) {
    return Math.min(...this.segments.map((s) => s.distanceToPoint(point)));
  }

  distanceToPoly(poly) {
    return Math.min(...this.points.map((p) => poly.distanceToPoint(p)));
  }

  intersectsPoly(poly) {
    for (let s1 of this.segments) {
      for (let s2 of poly.segments) {
        if (getIntersection(s1.p1, s1.p2, s2.p1, s2.p2)) {
          return true;
        }
      }
    }
    return false;
  }

  draw(scene, { opacity = 0.5, color = 0x013a85 } = {}) {
    const tri = new THREE.Shape();
    tri.moveTo(this.points[0].x + 0.5, -this.points[0].y - 0.5);
    for (let i = 1; i < this.points.length; i++) {
      tri.lineTo(this.points[i].x + 0.5, -this.points[i].y - 0.5);
    }
    const geometry = new THREE.ShapeGeometry(tri);
    geometry.rotateX(Math.PI / 2); // might want to center
    const meshMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: color });
    meshMaterial.transparent = true;
    meshMaterial.opacity = opacity;
    const mesh = new THREE.Mesh(geometry, meshMaterial);
    scene.add(mesh);
  }
}
