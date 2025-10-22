/**
 * Core Components - Renderable (PixiJS Graphics)
 */

import { Component } from '../ecs/Component';
import { Graphics } from 'pixi.js';

export class RenderableComponent extends Component {
  public readonly graphics: Graphics;
  public visible: boolean = true;
  public zIndex: number = 0;

  constructor() {
    super();
    this.graphics = new Graphics();
  }

  public getType(): string {
    return 'Renderable';
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.graphics.visible = visible;
  }

  public toString(): undefined {
    return undefined;
  }
}
