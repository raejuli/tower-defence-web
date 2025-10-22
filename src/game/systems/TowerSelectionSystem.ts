/**
 * Game Systems - Tower Selection System
 * Core logic for updating tower graphics based on selection
 */

import { System } from '../../engine/ecs/System';
import { World } from '../../engine/ecs/World';
import { SelectableComponent } from '../components/SelectableComponent';
import { RenderableComponent } from '../../engine/components/RenderableComponent';
import { TowerComponent } from '../components/TowerComponent';

export class TowerSelectionSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 90; // Run before render
  }

  public getRequiredComponents(): string[] {
    return ['Selectable', 'Renderable', 'Tower'];
  }

  /**
   * Update all tower graphics based on selection state
   */
  public updateTowerGraphics(): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const selectable = entity.getComponent('Selectable') as SelectableComponent;
      const renderable = entity.getComponent('Renderable') as RenderableComponent;
      const tower = entity.getComponent('Tower') as TowerComponent;

      if (!selectable || !renderable || !tower) continue;

      // Update graphics based on selection state
      this._renderTower(renderable, tower, selectable.selected);
    }
  }

  private _renderTower(renderable: RenderableComponent, tower: TowerComponent, showRange: boolean): void {
    const size = 30;
    
    // Clear and redraw
    renderable.graphics.clear();
    
    // Draw tower square
    renderable.graphics.rect(0, 0, size, size);
    renderable.graphics.fill(tower.color);
    
    // Draw range indicator if selected
    if (showRange) {
      renderable.graphics.circle(size / 2, size / 2, tower.stats.range);
      renderable.graphics.stroke({ width: 2, color: tower.color, alpha: 0.5 });
    }
  }
}
