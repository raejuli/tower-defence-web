/**
 * Game Components - Path Following
 */

import { Component } from '../../engine/ecs/Component';

export interface PathPoint {
  x: number;
  y: number;
}

export class PathFollowerComponent extends Component {
  public readonly path: PathPoint[];
  public currentIndex: number = 0;
  public readonly speed: number;

  constructor(path: PathPoint[], speed: number) {
    super();
    this.path = path;
    this.speed = speed;
  }

  public getType(): string {
    return 'PathFollower';
  }

  public getCurrentTarget(): PathPoint | null {
    if (this.currentIndex >= this.path.length) {
      return null;
    }
    return this.path[this.currentIndex];
  }

  public nextWaypoint(): void {
    this.currentIndex++;
  }

  public isAtEnd(): boolean {
    return this.currentIndex >= this.path.length;
  }

  public toString(): string {
    const current = this.getCurrentTarget();
    return `Speed: ${this.speed}
Waypoint: ${this.currentIndex}/${this.path.length}
Current Target: ${current ? `(${current.x.toFixed(0)}, ${current.y.toFixed(0)})` : 'End Reached'}
Path Length: ${this.path.length} points`;
  }
}
