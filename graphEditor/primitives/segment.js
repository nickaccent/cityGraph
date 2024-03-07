import * as THREE from 'three';
import { Point } from './point';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import {
  add,
  distance,
  normalize,
  subtract,
  scale,
  magnitude,
  dot,
  getNearestSegment,
} from '../math/utils';

export class Segment {
  constructor(p1, p2, controlPoint, curve = false) {
    this.p1 = p1;
    this.p2 = p2;
    this.controlPoint = controlPoint;
    this.curve = curve;
    this.curvePoints = [];
  }

  equals(seg) {
    return this.includes(seg.p1) && this.includes(seg.p2);
  }

  length() {
    return distance(this.p1, this.p2);
  }

  directionVector() {
    return normalize(subtract(this.p2, this.p1));
  }

  includes(point) {
    return this.p1.equals(point) || this.p2.equals(point);
  }

  distanceToPoint(point) {
    const proj = this.projectPoint(point);
    if (proj.offset > 0 && proj.offset < 1) {
      return distance(point, proj.point);
    }
    const distToP1 = distance(point, this.p1);
    const distToP2 = distance(point, this.p2);
    return Math.min(distToP1, distToP2);
  }

  projectPoint(point) {
    const a = subtract(point, this.p1);
    const b = subtract(this.p2, this.p1);
    const normB = normalize(b);
    const scaler = dot(a, normB);
    const proj = {
      point: add(this.p1, scale(normB, scaler)),
      offset: scaler / magnitude(b),
    };
    return proj;
  }

  static GetSplinePoints(pointObjects) {
    let curvePoints = pointObjects.map((p) => new THREE.Vector3(p.x + 0.5, -p.y - 0.5, 0.01));
    let curveQuad = new THREE.QuadraticBezierCurve3(curvePoints[0], curvePoints[1], curvePoints[2]);
    var splinePoints = curveQuad.getPoints(10);
    const points = [];
    for (var i = 0; i < splinePoints.length; i++) {
      points.push(splinePoints[i].x, 0.01, splinePoints[i].y);
    }
    return points;
  }

  static SplinePointsToVectors(curvePoints) {
    const points = [];
    for (let i = 0; i < curvePoints.length; i = i + 3) {
      points.push(new THREE.Vector3(curvePoints[i], curvePoints[i + 1], curvePoints[i + 2]));
    }
    return points;
  }

  generateSplinePointsMesh(pointObjects, width, color, dash) {
    const points = Segment.GetSplinePoints(pointObjects);
    if (this.curve) {
      this.curvePoints = points;
    }
    const geometry = new MeshLineGeometry();
    if (this.curve) {
      geometry.setPoints(this.curvePoints);
    } else {
      geometry.setPoints(points);
    }
    var material = null;
    if (dash) {
      material = new MeshLineMaterial({
        lineWidth: width,
        color: new THREE.Color(color),
        dashArray: 0.05,
        dashOffset: 0,
        dashRatio: 0.2,
        transparent: true,
        opacity: 1,
      });
    } else {
      material = new MeshLineMaterial({
        lineWidth: width,
        color: new THREE.Color(color),
      });
    }
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  draw(scene, { width = 1, color = 0x152238, dash = false, dashRoad = false } = {}) {
    if (this.curve == false && dashRoad == false) {
      let material = null;
      if (dash.length) {
        material = new THREE.LineDashedMaterial({
          color: 0xffffff,
          linewidth: 1,
          scale: 1,
          dashSize: 1,
          gapSize: 1,
        });
      } else {
        material = new THREE.LineBasicMaterial({ color: color });
      }
      const points = [
        new THREE.Vector3(this.p1.x + 0.5, 0.2, -this.p1.y - 0.5),
        new THREE.Vector3(this.p2.x + 0.5, 0.2, -this.p2.y - 0.5),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances();

      scene.add(line);
    } else if (dashRoad) {
      const pointObjects = [];
      pointObjects.push(this.p1);
      if (this.controlPoint == null) {
        let midPaverageX = (this.p1.x + this.p2.x) / 2;
        let midPaverageY = (this.p1.y + this.p2.y) / 2;
        let midP = new Point(midPaverageX, midPaverageY);
        pointObjects.push(midP);
      } else {
        pointObjects.push(this.controlPoint);
      }
      pointObjects.push(this.p2);
      const mesh = this.generateSplinePointsMesh(pointObjects, width, color, dash);
      scene.add(mesh);
    } else {
      const pointObjects = [];
      pointObjects.push(this.p1);
      pointObjects.push(this.controlPoint);
      pointObjects.push(this.p2);
      const mesh = this.generateSplinePointsMesh(pointObjects, width, color, dash);
      scene.add(mesh);
    }
  }
}
