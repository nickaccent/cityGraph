import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Point } from './primitives/point.js';
import { Segment } from './primitives/segment.js';
import { getNearestPoint, getNearestSegment, removeFromScene } from './math/utils.js';

export class GraphEditor {
  constructor(scene, plane, camera, renderer, graph, viewport, enabled, confirm, cancel) {
    // this.canvas = canvas;
    this.scene = scene;
    this.plane = plane;
    this.camera = camera;
    this.renderer = renderer;
    this.graph = graph;
    this.viewport = viewport;
    this.domElement = this.viewport.domElement;
    this.pointer = new THREE.Vector2();

    // this.ctx = this.canvas.getContext('2d');

    this.selected = null;
    this.hovered = null;
    this.dragging = false;
    this.mouse = new THREE.Vector2();
    this.intersect = new THREE.Vector2();
    this.intentSeg = null;
    this.enabled = false;
    this.curve = false;
    this.curveGuide = false;
    this.curveEnd = null;
    this.ctlPoint = null;

    this.segIntent = null;
    this.fromSegIntent = false;

    this.confirm = document.createElement('div');
    this.confirm.className = 'confirm';
    this.confirm.id = 'confirmBtn';
    this.confirm.style.pointerEvents = 'all';
    this.cancel = document.createElement('div');
    this.cancel.id = 'cancelBtn';
    this.cancel.className = 'cancel';
    this.cancel.style.pointerEvents = 'all';
    this.tooltipDiv = document.createElement('div');
    this.tooltipDiv.appendChild(this.confirm);
    this.tooltipDiv.appendChild(this.cancel);
    this.tooltipContainer = new CSS2DObject(this.tooltipDiv);
    this.scene.add(this.tooltipContainer);
    this.tooltipContainer.position.set(0, 0.5, 0);
    this.tooltipContainer.rotation.x = -0.5 * Math.PI;
    this.tooltipShow = false;
    this.#addEventListeners();
  }

  #addEventListeners() {
    this.confirm.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#confirmSelect();
    });
    this.cancel.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.intentSeg = null;
      this.curveEnd = null;
      this.ctlPoint = null;
      this.curveGuide = null;
      this.tooltipShow = false;
    });
    this.confirm.addEventListener('pointerover', (e) => {
      this.confirm.classList.add('hover');
    });
    this.confirm.addEventListener('pointerout', (e) => {
      this.confirm.classList.remove('hover');
    });
    this.cancel.addEventListener('pointerover', (e) => {
      this.cancel.classList.add('hover');
    });
    this.cancel.addEventListener('pointerout', (e) => {
      this.cancel.classList.remove('hover');
    });

    this.renderer.domElement.addEventListener('mousedown', (evt) => this.#handleMouseDown(evt));
    this.renderer.domElement.addEventListener('mouseup', () => {
      this.dragging = false;
      this.panning = false;
    });
    this.renderer.domElement.addEventListener('contextmenu', (evt) => evt.preventDefault());
    this.renderer.domElement.addEventListener('pointermove', (evt) => this.#handlePointerMove(evt));
  }

  #handlePointerMove(evt) {
    if (this.enabled == true) {
      this.pointer = this.viewport.getPointer(evt);
      this.mouse = this.viewport.getMouse(this.pointer);
      if (this.mouse) {
        this.hovered = getNearestPoint(this.mouse, this.graph.points, this.viewport.zoom / 10 / 2);
        if (this.hovered) {
          if (this.curveGuide == false) {
            this.tooltipContainer.position.set(this.hovered.x, 0.1, -this.hovered.y);
            this.tooltipContainer.rotation.x = -0.5 * Math.PI;
          }
        } else {
          // check for ctl point hover
          if (this.ctlPoint) {
            let pointsArr = [];
            pointsArr.push(this.ctlPoint);
            this.hovered = getNearestPoint(this.mouse, pointsArr, this.viewport.zoom / 10 / 2);
          } else {
            const seg = getNearestSegment(
              this.mouse,
              this.graph.segments,
              this.viewport.zoom / 10 / 2,
            );
            if (seg) {
              const proj = seg.projectPoint(this.mouse);
              if (proj.offset >= 0 && proj.offset <= 1) {
                this.segIntent = proj.point;
                this.segIntentSegment = seg;
                this.hovered = this.segIntent;
              } else {
                this.segIntent = null;
                this.segIntentSegment = null;
              }
            } else {
              this.segIntent = null;
              this.segIntentSegment = null;
            }
          }
        }
        if (this.dragging) {
          if (this.curveGuide) {
            this.ctlPoint.x = this.mouse.x;
            this.ctlPoint.y = this.mouse.y;

            this.intentSeg = new Segment(this.selected, this.curveEnd, this.ctlPoint, true);
          } else {
            this.selected.x = this.mouse.x;
            this.selected.y = this.mouse.y;
          }
        }
      }
    }
  }

  #handleMouseDown(evt) {
    if (this.enabled == true) {
      if (evt.button == 2) {
        this.#handleMouseDownRightClick();
      }
      if (evt.button == 0) {
        this.#handleMouseDownLeftClick();
      }
    }
  }

  #handleMouseDownLeftClick() {
    if (this.hovered) {
      if (this.curveGuide) {
        this.dragging = true;
        return;
      } else {
        if (this.selected) {
          this.curveEnd = this.hovered;
          this.ctlPoint = new Point(
            (this.selected.x + this.curveEnd.x) / 2 - 0.25,
            (this.selected.y + this.curveEnd.y) / 2,
          );
          let possibleSeg = new Segment(this.selected, this.curveEnd, this.ctlPoint, true);
          if (this.graph.containsSegment(possibleSeg)) {
            this.curveEnd = null;
            this.ctlPoint = null;
            return;
          } else {
            this.curveGuide = true;
            this.dragging = false;
            this.tooltipContainer.position.set(this.curveEnd.x, 0.1, -this.curveEnd.y);
            this.tooltipContainer.rotation.x = -0.5 * Math.PI;
            this.tooltipShow = true;

            this.intentSeg = possibleSeg;
            return;
          }
        } else {
          if (this.segIntent) {
            this.fromSegIntent = true;
            this.#select(this.hovered);
            this.dragging = true;
          } else {
            this.#select(this.hovered);
            this.dragging = true;
          }
          return;
        }
      }
    }
    if (this.dragging == true) {
      console.log('yes');
      this.curveGuide = true;
      this.dragging = false;
      this.curveEnd = new Point(this.mouse.x, this.mouse.y);
      this.tooltipContainer.position.set(this.curveEnd.x, 0.1, -this.curveEnd.y);
      this.tooltipContainer.rotation.x = -0.5 * Math.PI;
      this.tooltipShow = true;
      this.ctlPoint = new Point(
        (this.selected.x + this.curveEnd.x) / 2 - 0.25,
        (this.selected.y + this.curveEnd.y) / 2,
      );
      this.intentSeg = new Segment(this.selected, this.curveEnd, this.ctlPoint, true);
      return true;
    }

    if (this.segIntent) {
      console.log('h');
      this.#select(point);
      this.hovered = point;
      return true;
    }

    if (this.intentSeg) {
      this.curveEnd = new Point(this.mouse.x, this.mouse.y);
      this.ctlPoint = new Point(
        (this.selected.x + this.curveEnd.x) / 2 - 0.25,
        (this.selected.y + this.curveEnd.y) / 2,
      );
      let possibleSeg = new Segment(this.selected, this.curveEnd, this.ctlPoint, true);
      if (this.graph.containsSegment(possibleSeg)) {
        this.curveEnd = null;
        this.ctlPoint = null;
        return;
      } else {
        this.curveGuide = true;
        this.dragging = false;

        this.tooltipContainer.position.set(this.curveEnd.x, 0.1, -this.curveEnd.y);
        this.tooltipContainer.rotation.x = -0.5 * Math.PI;
        this.tooltipShow = true;

        this.intentSeg = possibleSeg;
        return;
      }
    }

    let point = new Point(this.mouse.x, this.mouse.y);
    this.graph.tryAddPoint(point);
    this.#select(point);
    this.hovered = point;
    this.dragging = true;
  }

  #handleMouseDownRightClick() {
    if (this.selected) {
      this.selected = null;
      removeFromScene(this.scene, this.intentSeg.uuid);
      this.intentSeg = null;
    } else if (this.hovered) {
      this.#removePoint(this.hovered);
    } else {
      this.panning = true;
    }
  }

  #select(point) {
    this.selected = point;
  }

  #removeSegmentAroundPoint(point) {
    let seg = getNearestSegment(point, this.graph.segments, this.viewport.zoom / 10 / 2);
    if (seg) {
      let p1 = seg.p1;
      let p2 = seg.p2;
      const segIndex = this.graph.segments.indexOf(seg);
      if (segIndex) {
        this.graph.segments.splice(segIndex, 1);
      }
      return { p1: p1, p2: p2 };
    }
    return null;
  }

  #confirmSelect() {
    if (this.fromSegIntent) {
      // this.graph.tryAddPoint(this.curveEnd);

      // now we need to remove the segment that was there before and add two new ones to connect to the point from both sides
      let points = this.#removeSegmentAroundPoint(this.curveEnd);
      if (points) {
        this.graph.tryAddSegment(new Segment(points.p1, this.curveEnd, null, false));
        this.graph.tryAddSegment(new Segment(this.curveEnd, points.p2, null, false));
      }
      points = this.#removeSegmentAroundPoint(this.selected);
      if (points) {
        this.graph.tryAddSegment(new Segment(points.p1, this.selected, null, false));
        this.graph.tryAddSegment(new Segment(this.selected, points.p2, null, false));
      }
      this.fromSegIntent = false;
    }

    const roundedCtl = new Point(Math.floor(this.ctlPoint.x), Math.floor(this.ctlPoint.y));
    const calcMidPoint = new Point(
      Math.floor((this.selected.x + this.curveEnd.x) / 2),
      Math.floor((this.selected.y + this.curveEnd.y) / 2),
    );

    if (roundedCtl.x != calcMidPoint.x || roundedCtl.y != calcMidPoint.y) {
      // add multiple segments for the curve
      const pointObjects = [];
      pointObjects.push(this.selected);
      pointObjects.push(this.ctlPoint);
      pointObjects.push(this.curveEnd);
      const splinePoints = Segment.GetSplinePoints(pointObjects);
      const vectors = Segment.SplinePointsToVectors(splinePoints);
      let startPoint = this.selected;

      this.graph.tryAddPoint(startPoint);
      for (var i = 0; i < vectors.length - 1; i++) {
        let endpoint = new Point(vectors[i + 1].x, -vectors[i + 1].z);
        this.graph.tryAddPoint(endpoint);
        this.graph.tryAddSegment(new Segment(startPoint, endpoint, null, false));
        startPoint = endpoint;
      }
      this.curveEnd = startPoint;
    } else {
      // add one segment for the straight line
      this.graph.tryAddSegment(new Segment(this.selected, this.curveEnd, null, false));
      this.graph.tryAddPoint(this.curveEnd);
    }
    this.selected = this.curveEnd;
    this.intentSeg = null;
    this.curveEnd = null;
    this.ctlPoint = null;
    this.curveGuide = null;
    this.tooltipShow = false;
  }

  #cancelSelect() {}

  #removePoint(point) {
    this.graph.removePoint(point, this.scene);
    this.hovered = null;
    if (this.selected == point) {
      this.selected = null;
    }
  }

  toggleEnabled(enabled) {
    this.enabled = enabled ? true : false;
  }

  toggleCurve() {
    this.curve = !this.curve;
  }

  dispose() {
    this.graph.dispose(this.scene);
    this.selected = null;
    this.hovered = null;
  }

  save() {
    localStorage.setItem('graph', JSON.stringify(this.graph));
  }

  display(zoom) {
    if (this.tooltipShow == true) {
      this.cancel.classList.add('show');
      this.confirm.classList.add('show');
    } else {
      this.cancel.classList.remove('show');
      this.confirm.classList.remove('show');
    }

    this.scene.add(this.tooltipContainer);
    this.graph.draw(this.scene, zoom);
    if (this.hovered) {
      this.hovered.draw(this.scene, { fill: true, color: 0xe8984d, size: zoom });
    }
    if (this.curveEnd) {
      this.curveEnd.draw(this.scene, { fill: true, color: 0x4334b3, size: zoom });
    }
    if (this.ctlPoint) {
      if (this.hovered) {
        if (this.hovered.equals(this.ctlPoint)) {
          this.ctlPoint.draw(this.scene, { fill: true, color: 0x3471b3, size: zoom });
        }
      } else {
        this.ctlPoint.draw(this.scene, { fill: true, color: 0x4334b3, size: zoom });
      }
    }
    if (this.selected) {
      const intent = this.hovered ? this.hovered : this.mouse;
      if (this.intentSeg != null) {
        // update the intentSeg
        if (this.curveGuide) {
          this.intentSeg.p1 = this.selected;
          this.intentSeg.p2 = this.curveEnd;
        } else {
          this.intentSeg.p1 = this.selected;
          this.intentSeg.p2 = intent;
        }
      } else {
        // create it
        this.intentSeg = new Segment(this.selected, intent);
      }
      if (this.curveGuide) {
        this.intentSeg.draw(this.scene, {
          color: 0x4334b3,
          width: 1,
          dash: true,
        });
        this.selected.draw(this.scene, { fill: true, color: 0x4334b3, size: zoom });
      } else {
        this.intentSeg.draw(this.scene, { dash: [6, 2] });
        this.selected.draw(this.scene, { outline: true, size: zoom });
      }
    }
    if (this.segIntent) {
      this.segIntent.draw(this.scene, { size: zoom, opacity: 0.4, color: 0xee4b2b });
    }
  }
}
