import * as THREE from 'three';
export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  equals(point) {
    return this.x == point.x && this.y == point.y;
  }

  draw(scene, { size = 0.5, color = 0xffff00, outline = false, fill = false, opacity = 1 } = {}) {
    const geometry = new THREE.CircleGeometry(size, 32);
    geometry.translate(0.5, 0.5, 0);
    let material = null;
    if (fill) {
      material = new THREE.MeshBasicMaterial({ color: color });
    } else if (outline) {
      material = new THREE.MeshBasicMaterial({ color: 0xa83281 });
    } else {
      material = new THREE.MeshBasicMaterial({ color: color });
    }
    material.transparent = true;
    material.opacity = opacity;
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(this.x, 0.1, -this.y);
    circle.rotation.x = -0.5 * Math.PI;
    scene.add(circle);
  }
}
