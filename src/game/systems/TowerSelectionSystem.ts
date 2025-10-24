/**
 * Game Systems - Tower Selection System
 * Core logic for updating tower graphics based on selection
 */

import { System } from '@raejuli/core-engine-gdk/ecs';
import { World } from '@raejuli/core-engine-gdk/ecs';
import { SelectableComponent } from '../components/enemy/SelectableComponent';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { TowerComponent } from '../components/tower/TowerComponent';
import { FlamethrowerTowerComponent } from '../components/tower/FlamethrowerTowerComponent';

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
      const flamethrower = entity.getComponent('FlamethrowerTower') as FlamethrowerTowerComponent;

      if (!selectable || !renderable || !tower) continue;

      // Update graphics based on selection state
      this._renderTower(renderable, tower, selectable.selected, flamethrower);
    }
  }

  private _renderTower(renderable: RenderableComponent, tower: TowerComponent, showRange: boolean, flamethrower?: FlamethrowerTowerComponent): void {
    const size = 30;
    
    // Clear and redraw
    renderable.graphics.clear();
    
    // Draw tower square
    renderable.graphics.rect(0, 0, size, size);
    renderable.graphics.fill(tower.color);
    
    // For flamethrower towers, show cone only if selected OR attacking
    if (flamethrower) {
      const isAttacking = tower.currentTarget !== null;
      const shouldShowCone = showRange || isAttacking;
      
      if (shouldShowCone) {
        const centerX = size / 2;
        const centerY = size / 2;
        const angle = flamethrower.currentAngle;
        const halfCone = (flamethrower.coneAngle * Math.PI / 180) / 2;
        const length = flamethrower.coneLength;
        
        // Draw cone shape
        renderable.graphics.moveTo(centerX, centerY);
        const startAngle = angle - halfCone;
        const endAngle = angle + halfCone;
        
        // Calculate start and end points of cone
        const startX = centerX + Math.cos(startAngle) * length;
        const startY = centerY + Math.sin(startAngle) * length;
        const endX = centerX + Math.cos(endAngle) * length;
        const endY = centerY + Math.sin(endAngle) * length;
        
        // Draw cone with different opacity based on selection
        const fillAlpha = showRange ? 0.3 : 0.2;
        const strokeAlpha = showRange ? 0.6 : 0.4;
        
        renderable.graphics.lineTo(startX, startY);
        renderable.graphics.arc(centerX, centerY, length, startAngle, endAngle);
        renderable.graphics.lineTo(centerX, centerY);
        renderable.graphics.fill({ color: tower.color, alpha: fillAlpha });
        renderable.graphics.stroke({ width: 2, color: tower.color, alpha: strokeAlpha });
      }
    }
    // Draw range indicator if selected for non-flamethrower towers
    else if (showRange) {
      renderable.graphics.circle(size / 2, size / 2, tower.stats.range);
      renderable.graphics.stroke({ width: 2, color: tower.color, alpha: 0.5 });
    }
  }
}
