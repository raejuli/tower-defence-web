/**
 * Core Components - Input/Interaction
 */

import { Component } from '../ecs/Component';

export type ClickCallback = (x: number, y: number) => void;

export class InteractableComponent extends Component {
  public onClick: ClickCallback | null = null;
  public onHover: ClickCallback | null = null;
  public readonly width: number;
  public readonly height: number;
  public interactive: boolean = true;

  constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  public getType(): string {
    return 'Interactable';
  }

  public isPointInside(x: number, y: number, entityX: number, entityY: number): boolean {
    return (
      x >= entityX &&
      x <= entityX + this.width &&
      y >= entityY &&
      y <= entityY + this.height
    );
  }

  public toString(): undefined {
    return undefined;
  }
}
