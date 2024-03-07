import Marking from './marking.js';
import { perpendicular } from '../math/utils.js';

export class Light extends Marking {
  constructor(center, directionVector, width, height, scene, model) {
    super(center, directionVector, width, 18, scene);
    this.state = 'off';
    this.border = this.poly.segments[0];
    this.mesh = model.clone();
    this.mesh.traverse((object) => {
      if (object.isMesh) {
        if (object.material.name == 'Red') {
          this.red = object;
        }
        if (object.material.name == 'Yellow') {
          this.yellow = object;
        }
        if (object.material.name == 'Green') {
          this.green = object;
        }
      }
    });
  }

  draw(scene) {
    const perp = perpendicular(this.directionVector);
    const point = add(this.center, scale(perp, this.width / 2));
    // switch (this.state) {
    //   case "green":
    //      green.draw(ctx, { size: this.height * 0.6, color: "#0F0" });
    //      break;
    //   case "yellow":
    //      yellow.draw(ctx, { size: this.height * 0.6, color: "#FF0" });
    //      break;
    //   case "red":
    //      red.draw(ctx, { size: this.height * 0.6, color: "#F00" });
    //      break;
    //  }
  }
}
