/**
 * Tower Service Implementation
 */

import { ITowerService } from './IGameServices';
import { Entity } from '../../engine/ecs/Entity';
import { SelectableComponent } from '../components/SelectableComponent';
import { LevelModel } from '../models/LevelModel';
import { TransformComponent } from '../../engine/components/TransformComponent';

export class TowerService implements ITowerService {
  private _placedTowers: Entity[] = [];
  private _level: LevelModel;
  private _onTowerClickedCallback: ((tower: Entity) => void) | null = null;

  constructor(level: LevelModel, placedTowers: Entity[]) {
    this._level = level;
    this._placedTowers = placedTowers;
  }

  public setOnTowerClickedCallback(callback: (tower: Entity) => void): void {
    this._onTowerClickedCallback = callback;
  }

  public onTowerClicked(tower: Entity): void {
    // Deselect all towers first
    this.deselectAllTowers();
    
    // Select clicked tower
    const selectable = tower.getComponent('Selectable') as SelectableComponent;
    if (selectable) {
      selectable.selected = true;
      
      // Call the callback if registered
      if (this._onTowerClickedCallback) {
        this._onTowerClickedCallback(tower);
      }
    }
  }

  public deselectAllTowers(): void {
    for (const tower of this._placedTowers) {
      const selectable = tower.getComponent('Selectable') as SelectableComponent;
      if (selectable) {
        selectable.selected = false;
      }
    }
  }

  public canPlaceTower(x: number, y: number, size: number = 30): boolean {
    return !this.isPositionOnPath(x - size/2, y - size/2, size) && 
           !this.isPositionOccupied(x, y, size);
  }

  public isPositionOnPath(x: number, y: number, size: number = 30): boolean {
    const radius = size / 2;
    for (const bound of this._level.pathBounds) {
      if (
        x + radius > bound.x &&
        x - radius < bound.x + bound.width &&
        y + radius > bound.y &&
        y - radius < bound.y + bound.height
      ) {
        return true;
      }
    }
    return false;
  }

  public isPositionOccupied(x: number, y: number, size: number = 30): boolean {
    // Center the collision check on the cursor position
    const halfSize = size / 2;
    const centerX = x - halfSize;
    const centerY = y - halfSize;
    
    for (const tower of this._placedTowers) {
      const transform = tower.getComponent<TransformComponent>('Transform');
      if (transform) {
        // Check if rectangles overlap (tower positions are already centered)
        if (
          centerX < transform.x + size &&
          centerX + size > transform.x &&
          centerY < transform.y + size &&
          centerY + size > transform.y
        ) {
          return true;
        }
      }
    }
    return false;
  }
}
