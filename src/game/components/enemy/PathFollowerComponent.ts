/**
 * Game Components - Path Following
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class PathFollowerComponent extends Component {
  public pathEntityId: number; // Reference to the path entity
  public currentIndex: number = 0;
  public readonly speed: number;

  constructor(pathEntityId: number, speed: number) {
    super();
    this.pathEntityId = pathEntityId;
    this.speed = speed;
  }

  public getType(): string {
    return 'PathFollower';
  }

  public nextWaypoint(): void {
    this.currentIndex++;
  }

  public resetToStart(): void {
    this.currentIndex = 0;
  }

  public toString(): string {
    return `Speed: ${this.speed}
Current Waypoint: ${this.currentIndex}
Path Entity: ${this.pathEntityId}`;
  }
}
