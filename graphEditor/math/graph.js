import { removeFromScene } from './utils.js';
import { Point } from '../primitives/point.js';
import { Segment } from '../primitives/segment.js';
export class Graph {
  constructor(points = [], segments = [], scene) {
    this.points = points;
    this.segments = segments;
  }

  static load(info, scene) {
    const points = info.points.map((i) => new Point(i.x, i.y));
    const segments = [];
    for (var i = 0; i < info.segments.length; i++) {
      const seg = info.segments[i];
      if (seg.controlPoint) {
        segments.push(
          new Segment(
            points.find((p) => p.equals(seg.p1)),
            points.find((p) => p.equals(seg.p2)),
            new Point(seg.controlPoint.x, seg.controlPoint.y),
            true,
          ),
        );
      } else {
        segments.push(
          new Segment(
            points.find((p) => p.equals(seg.p1)),
            points.find((p) => p.equals(seg.p2)),
          ),
        );
      }
    }
    return new Graph(points, segments, scene);
  }

  hash() {
    return JSON.stringify(this);
  }

  addPoint(point) {
    this.points.push(point);
  }

  containsPoint(point) {
    return this.points.find((p) => p.equals(point));
  }

  tryAddPoint(point) {
    if (!this.containsPoint(point)) {
      this.addPoint(point);
      return true;
    }
    return false;
  }

  removePoint(point, scene) {
    removeFromScene(scene, point.uuid);
    const segs = this.getSegmentsWithPoint(point);
    for (const seg of segs) {
      this.removeSegment(seg, scene);
    }
    this.points.splice(this.points.indexOf(point), 1);
  }

  addSegment(seg) {
    this.segments.push(seg);
  }

  containsSegment(seg) {
    return this.segments.find((s) => s.equals(seg));
  }

  tryAddSegment(seg) {
    if (!this.containsSegment(seg) && !seg.p1.equals(seg.p2)) {
      this.addSegment(seg);
      return true;
    }
    return false;
  }

  removeSegment(seg, scene) {
    removeFromScene(scene, seg.uuid);
    this.segments.splice(this.segments.indexOf(seg), 1);
  }

  getSegmentsWithPoint(point) {
    const segs = [];
    for (const seg of this.segments) {
      if (seg.includes(point)) {
        segs.push(seg);
      }
    }
    return segs;
  }

  dispose(scene) {
    for (let i = 0; i < this.points.length; i++) {
      this.removePoint(this.points[i], scene);
      i--;
    }
    this.points.length = 0;
    this.segments.length = 0;
  }

  draw(scene, zoom) {
    for (const seg of this.segments) {
      seg.draw(scene, { color: 0xffff00, width: 0.1 });
    }
    for (const point of this.points) {
      point.draw(scene, { color: 0xffff00, size: zoom });
    }
  }
}
