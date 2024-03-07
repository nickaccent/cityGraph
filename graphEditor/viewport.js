import * as THREE from 'three';
import { Point } from './primitives/point.js';
import { subtract, add, scale } from './math/utils';

export class ViewPort {
  constructor(domElement, camera, plane, planesize) {
    this.domElement = domElement;
    this.camera = camera;
    this.plane = plane;
    this.planesize = planesize;
    this.raycaster = new THREE.Raycaster();

    this.zoom = 300;
    this.offset = new Point(0, 0);
    this.key = null;

    this.drag = {
      start: new Point(0, 0),
      end: new Point(0, 0),
      offset: new Point(0, 0),
      active: false,
    };

    this.#addEventListeners();
  }

  getPointer(evt) {
    return new Point(
      (evt.layerX / window.innerWidth) * 2 - 1,
      -(evt.layerY / window.innerHeight) * 2 + 1,
    );
  }

  getMouse(pointer) {
    this.raycaster.setFromCamera(pointer, this.camera);
    var objects = [];
    objects.push(this.plane);
    const intersects = this.raycaster.intersectObjects(objects);
    if (intersects.length > 0) {
      var vector = new THREE.Vector3().copy(intersects[0].point);
      intersects[0].object.worldToLocal(vector);
      const mouse = vector;
      mouse.x = mouse.x - this.planesize / 2 - 0.5;
      mouse.y = mouse.y - this.planesize / 2 - 0.5;
      return mouse;
    }
    return null;
  }

  getOffset() {
    return add(this.offset, this.drag.offset);
  }

  #addEventListeners() {
    window.addEventListener('mousewheel', this.#handleMouseWheel.bind(this));
    window.addEventListener('keydown', this.#handleKeyDown.bind(this));
    window.addEventListener('keyup', this.#handleKeyUp.bind(this));
  }

  #handleMouseWheel(evt) {
    const dir = Math.sign(evt.deltaY);
    const step = 10;
    this.zoom += dir * step;
    this.zoom = Math.max(50, Math.min(400, this.zoom));
  }

  #handleKeyDown(evt) {
    this.key = evt.key;
    if (this.key == 's') {
      this.camera.position.z -= (this.zoom / 50) * 1;
    } else if (this.key == 'w') {
      this.camera.position.z += (this.zoom / 50) * 1;
    } else if (this.key == 'a') {
      this.camera.position.x += (this.zoom / 50) * 1;
    } else if (this.key == 'd') {
      this.camera.position.x -= (this.zoom / 50) * 1;
    }
  }

  #handleKeyUp(evt) {
    this.key = null;
  }

  update() {
    this.camera.position.y = this.zoom;
  }
}
