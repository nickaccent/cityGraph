import * as THREE from 'three';
import { Point } from './point.js';
import { Polygon } from './polygon.js';
import { translate, angle, subtract } from '../math/utils.js';

export class Envelope {
  constructor(skeleton, width = 1, roundness = 0) {
    this.skeleton = skeleton;
    this.width = width;
    this.roundness = Math.max(1, roundness);
    this.polys = this.#generatePolygon(this.width);
  }

  #generatePolygon(width) {
    let points = [];
    let polysArray = [];
    if (this.skeleton.curve == true) {
      let spline = this.#generateSplinePoints();
      for (let i = 0; i < spline.length - 1; i++) {
        points = this.#generatePointsFromSplinePoints(width, spline[i], spline[i + 1]);

        polysArray.push(new Polygon(points));
      }
      return polysArray;
    } else {
      points = this.#generatePoints(width);
      polysArray.push(new Polygon(points));
      return polysArray;
    }
  }

  #generatePoints(width) {
    const points = [];
    const { p1, p2 } = this.skeleton;
    const radius = width / 2;
    const alpha = angle(subtract(p1, p2));
    const alphaCw = alpha + Math.PI / 2;
    const alphaCcw = alpha - Math.PI / 2;

    const step = Math.PI / Math.max(1, this.roundness);

    const eps = step / 2;
    for (let i = alphaCcw; i <= alphaCw + eps; i += step) {
      points.push(translate(p1, i, radius));
    }
    for (let i = alphaCcw; i <= alphaCw + eps; i += step) {
      points.push(translate(p2, Math.PI + i, radius));
    }
    return points;
  }

  #generatePointsFromSplinePoints(width, p1, p2) {
    const points = [];
    const radius = width / 2;
    const alpha = angle(subtract(p1, p2));
    const alphaCw = alpha + Math.PI / 2;
    const alphaCcw = alpha - Math.PI / 2;
    const step = Math.PI / Math.max(1, this.roundness);

    const eps = step / 2;
    for (let i = alphaCcw; i <= alphaCw + eps; i += step) {
      points.push(translate(p1, i, radius));
    }
    for (let i = alphaCcw; i <= alphaCw + eps; i += step) {
      points.push(translate(p2, Math.PI + i, radius));
    }
    return points;
  }

  #generateSplinePoints() {
    const pointObjects = [];
    const { p1, p2, controlPoint } = this.skeleton;
    pointObjects.push(p1);
    pointObjects.push(controlPoint);
    pointObjects.push(p2);
    let curvePoints = pointObjects.map((p) => new THREE.Vector3(p.x + 0.5, p.y - 0.5, 0.01));
    let curveQuad = new THREE.QuadraticBezierCurve3(curvePoints[0], curvePoints[1], curvePoints[2]);
    var splinePoints = curveQuad.getPoints(10);
    const points = [];
    for (var i = 0; i < splinePoints.length; i++) {
      points.push(new Point(splinePoints[i].x, splinePoints[i].y));
    }
    return points;
  }

  #updatePoints(width) {
    let points = [];
    let polysArray = [];
    if (this.skeleton.curve == true) {
      let spline = this.#generateSplinePoints();
      for (let i = 0; i < spline.length - 1; i++) {
        points = this.#generatePointsFromSplinePoints(width, spline[i], spline[i + 1]);

        polysArray.push(new Polygon(points));
      }
      this.polys = polysArray;
    } else {
      points = this.#generatePoints(width);
      polysArray.push(new Polygon(points));
      this.polys = polysArray;
    }
  }

  draw(scene, options) {
    this.#updatePoints(this.width);
    for (let i = 0; i < this.polys.length; i++) {
      this.polys[i].draw(scene, options);
    }
  }
}
