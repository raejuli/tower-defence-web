/**
 * Core Components - Transform
 */

import { Component } from '../ecs/Component';

export class TransformComponent extends Component {
  public x: number = 0;
  public y: number = 0;
  public rotation: number = 0;
  public scaleX: number = 1;
  public scaleY: number = 1;

  constructor(x: number = 0, y: number = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  public getType(): string {
    return 'Transform';
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public setScale(x: number, y: number): void {
    this.scaleX = x;
    this.scaleY = y;
  }

  public toString(): undefined {
    return undefined;
  }
}
