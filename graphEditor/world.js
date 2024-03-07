import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Envelope } from './primitives/envelope';
import { Polygon } from './primitives/polygon';
import { Point } from './primitives/point';
import { Segment } from './primitives/segment';
import {
  add,
  scale,
  lerp,
  distance,
  getNearestSegments,
  getNearestSegment,
  normalize,
  subtract,
} from './math/utils';

export class World {
  constructor(
    graph,
    models,
    viewport,
    scene,
    roadWidth = 10,
    roadRoundness = 10,
    buildingZoneWidth = 15,
    buildingZoneMinLength = 15,
    spacing = 0.2,
    treeSize = 6,
  ) {
    this.graph = graph;
    this.viewport = viewport;
    this.roadWidth = roadWidth;
    this.roadRoundness = roadRoundness;
    this.buildingZoneWidth = buildingZoneWidth;
    this.buildingZoneMinLength = buildingZoneMinLength;
    this.spacing = spacing;

    this.models = models;
    this.tree = this.models.tree;
    this.trafficLight = this.models.trafficLight;

    this.treeSize = treeSize;

    this.envelopes = [];
    this.roadBorders = [];

    this.laneGuides = [];
    this.laneGuideSegs = [];

    this.buildingZones = [];
    this.trees = [];
    this.trafficLights = [];
    this.scene = scene;

    this.generate();
  }

  generate() {
    this.envelopes.length = 0;
    for (const seg of this.graph.segments) {
      this.envelopes.push(new Envelope(seg, this.roadWidth, this.roadRoundness));
    }
    this.roadBorders.length = 0;
    this.roadBorders = Polygon.union(this.envelopes.map((e) => e.polys));
    this.buildingZones = this.#generateBuildingZones();
    this.trees = this.#generateTrees();
    this.laneGuides.length = 0;
    this.laneGuides.push(...this.#generateLaneGuides());
    this.#generateTrafficLights();
  }

  #generateLaneGuides() {
    const tmpEnvelopes = [];
    for (const seg of this.graph.segments) {
      tmpEnvelopes.push(new Envelope(seg, this.roadWidth * 0.85, this.roadRoundness));
    }

    const segments = Polygon.union(tmpEnvelopes.map((e) => e.polys));
    return segments;
  }

  #distanceBetweenPoints(p1, p2) {
    let p1v = new THREE.Vector3(p1.x, 0, p1.y);
    let p2v = new THREE.Vector3(p2.x, 0, p2.y);
    return p1v.distanceTo(p2v);
  }

  #generateTrafficLights() {
    this.trafficLights = [];
    // for (const point of this.graph.points) {
    //   // this.laneGuideSegs.length = 0;
    //   const segments = getNearestSegments(
    //     point,
    //     this.graph.segments,
    //     this.viewport.zoom / 10 / 1.5,
    //   );
    //   if (segments.length > 2) {
    //     // console.log(point);
    //     for (const seg of segments) {
    //       let targetP = null;
    //       let sourceP = null;
    //       if (
    //         new THREE.Vector3(seg.p1.x, 0, seg.p1.y).distanceTo(
    //           new THREE.Vector3(point.x, 0, point.y),
    //         ) < 5
    //       ) {
    //         targetP = seg.p2;
    //         sourceP = seg.p1;
    //       } else {
    //         targetP = seg.p1;
    //         sourceP = seg.p2;
    //       }
    //       const laneGuides = [];
    //       const lgs = getNearestSegments(sourceP, this.laneGuides, this.viewport.zoom / 10 / 2);
    //       for (let lg of lgs) {
    //         if (lg.length() > 2) {
    //           this.laneGuideSegs.push(lg);
    //           laneGuides.push(lg);
    //         }
    //       }

    //       const distances = [];
    //       for (const l of laneGuides) {
    //         distances.push({ p: l.p1, distance: this.#distanceBetweenPoints(point, l.p1) });
    //         distances.push({ p: l.p2, distance: this.#distanceBetweenPoints(point, l.p2) });
    //       }
    //       console.log(distances);
    // if (
    //   new THREE.Vector3(laneGuideSeg.p1.x, 0, laneGuideSeg.p1.y).distanceTo(
    //     new THREE.Vector3(point.x, 0, point.y),
    //   ) < 5
    // ) {
    //   targetPG = laneGuideSeg.p2;
    //   sourcePG = laneGuideSeg.p1;
    // } else {
    //   targetPG = laneGuideSeg.p1;
    //   sourcePG = laneGuideSeg.p2;
    // }

    // if (this.trafficLight) {
    //   let tL = this.trafficLight.clone();
    //   let dir = normalize(subtract(targetP, point));
    //   let directionLook = new THREE.Vector3(dir.x, 0, -dir.y);
    //   let dirNormal = new THREE.Vector3(dir.x, 0, -dir.y);
    //   dirNormal.normalize();
    //   // const length = 20;
    //   // const hex = 0xffff00;
    //   // const arrowHelper = new THREE.ArrowHelper(
    //   //   dirNormal,
    //   //   new THREE.Vector3(point.x, 0, -point.y),
    //   //   length,
    //   //   hex,
    //   // );
    //   // arrowHelper.position.y += 1;
    //   // this.trafficLights.push(arrowHelper);
    //   // this.scene.add(arrowHelper);
    //   tL.lookAt(directionLook);
    //   tL.position.set(targetPG.x, 0, -targetPG.y);
    //   // tL.position.addScaledVector(directionLook, 5);
    //   // tL.updateMatrix();
    //   // const up = new THREE.Vector3();
    //   // up.copy(tL.up).applyMatrix4(tL.matrixWorld).normalize();
    //   // const right = new THREE.Vector3();
    //   // right.crossVectors(directionLook, up).normalize();
    //   // tL.position.addScaledVector(right, 6);
    //   // tL.position.addScaledVector(directionLook, 8);

    //   this.trafficLights.push(tL);
    // }
    //     }
    //   }
    // }
  }

  #generateTrees(count = 100) {
    const points = [
      ...this.roadBorders.map((s) => [s.p1, s.p2]).flat(),
      ...this.buildingZones.map((b) => b.points).flat(),
    ];
    const left = Math.min(...points.map((p) => p.x));
    const right = Math.max(...points.map((p) => p.x));
    const top = Math.min(...points.map((p) => p.y));
    const bottom = Math.max(...points.map((p) => p.y));

    const illegalPolys = [...this.buildingZones, ...this.envelopes.map((e) => e.polys)];

    const trees = [];
    let tryCount = 0;
    while (tryCount < count) {
      const p = new Point(lerp(left, right, Math.random()), lerp(bottom, top, Math.random()));
      let keep = true;
      for (const poly of illegalPolys) {
        if (poly instanceof Polygon) {
          if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeSize) {
            keep = false;
            break;
          }
        } else {
          for (const pol of poly) {
            if (pol.containsPoint(p) || pol.distanceToPoint(p) < this.treeSize) {
              keep = false;
              break;
            }
          }
        }
      }

      if (keep) {
        for (const tree of trees) {
          if (distance(tree, p) < this.treeSize * 2) {
            keep = false;
            break;
          }
        }
      }

      if (keep) {
        let closeToSomething = false;
        for (const poly of illegalPolys) {
          if (poly instanceof Polygon) {
            if (poly.distanceToPoint(p) < this.treeSize * 2) {
              closeToSomething = true;
              break;
            }
          } else {
            for (const pol of poly) {
              if (pol.containsPoint(p) || pol.distanceToPoint(p) < this.treeSize * 2) {
                keep = false;
                break;
              }
            }
          }
        }
        keep = closeToSomething;
      }

      if (keep) {
        trees.push(p);
        tryCount = 0;
      }
      tryCount++;
    }
    return trees;
  }

  #generateBuildingZones() {
    const tmpEnvelopes = [];
    for (const seg of this.graph.segments) {
      tmpEnvelopes.push(
        new Envelope(
          seg,
          this.roadWidth * 1.5 + this.buildingZoneWidth + this.spacing * 2,
          this.roadRoundness,
        ),
      );
    }

    const guides = Polygon.union(tmpEnvelopes.map((e) => e.polys));
    for (let i = 0; i < guides.length; i++) {
      const seg = guides[i];
      if (seg.length() < this.buildingZoneMinLength) {
        guides.splice(i, 1);
        i--;
      }
    }

    const supports = [];

    for (let seg of guides) {
      const len = seg.length() + this.spacing;
      // console.log(len);
      const buildingCount = Math.floor(len / (this.buildingZoneMinLength + this.spacing));
      const buildingLength = len / buildingCount - this.spacing;

      // console.log(buildingLength);
      const dir = seg.directionVector();
      let q1 = seg.p1;
      let q2 = add(q1, scale(dir, buildingLength));

      supports.push(new Segment(q1, q2));

      for (let i = 2; i <= buildingCount; i++) {
        q1 = add(q2, scale(dir, this.spacing));
        q2 = add(q1, scale(dir, buildingLength));
        supports.push(new Segment(q1, q2));
      }
    }

    const bases = [];
    for (const seg of supports) {
      bases.push(new Envelope(seg, this.buildingZoneWidth, 0).polys[0]);
    }

    const eps = 0.001;

    for (let i = 0; i < bases.length; i++) {
      for (let j = i + 1; j < bases.length; j++) {
        if (
          bases[i].intersectsPoly(bases[j]) ||
          bases[i].distanceToPoly(bases[j]) < this.spacing - eps
        ) {
          bases.splice(j, 1);
          j--;
        }
      }
    }
    return bases;
  }

  draw(scene) {
    for (const env of this.envelopes) {
      env.draw(scene, { opacity: 1, color: 0x343434 });
    }
    // for (const seg of this.roadBorders) {
    //   seg.draw(scene, { width: 0.5, opacity: 0, color: 0xffffff });
    // }
    for (const seg of this.graph.segments) {
      seg.draw(scene, { opacity: 1, width: 0.1, color: 0xffffff });
    }

    for (const bld of this.buildingZones) {
      bld.draw(scene, { opacity: 0.75 });
    }

    for (const tree of this.trees) {
      if (this.tree) {
        let t = this.tree.clone();
        t.position.set(tree.x, 0, -tree.y);
        scene.add(t);
      }
    }

    for (const seg of this.laneGuides) {
      seg.draw(scene, { opacity: 1, color: 0xfdda16 });
    }

    // for (const seg of this.laneGuideSegs) {
    //   seg.draw(scene, { opacity: 1, color: 0xf7b500 });
    //   // console.log(bld);
    // }

    for (const light of this.trafficLights) {
      scene.add(light);
    }
  }
}
