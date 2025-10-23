/**
 * Game Models - Level/Map Configuration
 */

import { PathPoint } from '../components/PathComponent';

export interface PathBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class LevelModel {
  public readonly path: PathPoint[];
  public readonly pathBounds: PathBounds[];
  public readonly width: number;
  public readonly height: number;
  public readonly backgroundColor: number;

  constructor(
    path: PathPoint[],
    width: number = 800,
    height: number = 600,
    backgroundColor: number = 0x1a1a2e
  ) {
    this.path = path;
    this.width = width;
    this.height = height;
    this.backgroundColor = backgroundColor;
    
    // Calculate path bounds on construction
    const pathWidth = 30;
    const bounds: PathBounds[] = [];

    for (let i = 0; i < this.path.length - 1; i++) {
      const start = this.path[i];
      const end = this.path[i + 1];

      const minX = Math.min(start.x, end.x) - pathWidth / 2;
      const minY = Math.min(start.y, end.y) - pathWidth / 2;
      const maxX = Math.max(start.x, end.x) + pathWidth / 2;
      const maxY = Math.max(start.y, end.y) + pathWidth / 2;

      bounds.push({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
    }
    
    this.pathBounds = bounds;
  }
}
