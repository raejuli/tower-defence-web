/**
 * Game Components - Path Component
 * Represents a path that enemies can follow
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export interface PathPoint {
  x: number;
  y: number;
}

export class PathComponent extends Component {
  public readonly waypoints: PathPoint[];
  public readonly pathWidth: number;
  public color: number;

  constructor(waypoints: PathPoint[], pathWidth: number = 30, color: number = 0x4a4a4a) {
    super();
    this.waypoints = waypoints;
    this.pathWidth = pathWidth;
    this.color = color;
  }

  public getType(): string {
    return 'Path';
  }

  public getWaypoint(index: number): PathPoint | null {
    if (index < 0 || index >= this.waypoints.length) {
      return null;
    }
    return this.waypoints[index];
  }

  public getWaypointCount(): number {
    return this.waypoints.length;
  }

  public toString(): string {
    return `Path with ${this.waypoints.length} waypoints
Width: ${this.pathWidth}px
Start: (${this.waypoints[0].x}, ${this.waypoints[0].y})
End: (${this.waypoints[this.waypoints.length - 1].x}, ${this.waypoints[this.waypoints.length - 1].y})`;
  }
}
