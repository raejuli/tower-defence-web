/**
 * Tower Service Implementation
 */

import { ITowerService } from './IGameServices';
import { ServiceLocator } from '@raejuli/core-engine-gdk/services';
import { EventBus } from '@raejuli/core-engine-gdk/events';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { SelectableComponent } from '../components/enemy/SelectableComponent';
import { LevelModel } from '../models/LevelModel';
import { TransformComponent } from '@raejuli/core-engine-gdk/components';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { TowerComponent } from '../components/tower/TowerComponent';
import { UpgradeComponent } from '../components/tower/UpgradeComponent';
import { ChainLightningTowerComponent } from '../components/tower/ChainLightningTowerComponent';
import { FlamethrowerTowerComponent } from '../components/tower/FlamethrowerTowerComponent';
import { InteractableComponent } from '@raejuli/core-engine-gdk/components';
import { World } from '@raejuli/core-engine-gdk/ecs';
import { TowerUpgradeSystem } from '../systems';
import { UIService } from './UIService';
import { GameStateService } from './GameStateService';

export class TowerService implements ITowerService {
  private _placedTowers: Entity[] = [];
  private _level: LevelModel;
  private _events: EventBus;
  private _world: World;
  private _towerUpgradeSystem: TowerUpgradeSystem;

  constructor(level: LevelModel, placedTowers: Entity[], world: World) {
    this._level = level;
    this._placedTowers = placedTowers;
    this._world = world;
    this._towerUpgradeSystem = world.getSystem(TowerUpgradeSystem)!;

    // Get global event bus from ServiceLocator
    this._events = ServiceLocator.get<EventBus>('EventBus');

    this._events.on<Entity>('tower:clicked', this.showTowerDetails.bind(this));
  }

  public onTowerClicked(tower: Entity): void {
    // Deselect all towers first
    this.deselectAllTowers();

    // Select clicked tower
    const selectable = tower.getComponent('Selectable') as SelectableComponent;
    if (selectable) {
      selectable.selected = true;

      // Emit tower:clicked event instead of calling callback
      this._events.emit('tower:clicked', tower);
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
    return this.isPositionInBounds(x, y, size) &&
      !this.isPositionOnPath(x, y, size) &&
      !this.isPositionOccupied(x, y, size);
  }

  public isPositionInBounds(x: number, y: number, size: number = 30): boolean {
    // x, y is cursor position (center of tower)
    // Convert to top-left position to check if tower fits in bounds
    const halfSize = size / 2;
    const topLeftX = x - halfSize;
    const topLeftY = y - halfSize;

    // Check if tower is fully within canvas bounds
    return topLeftX >= 0 &&
      topLeftY >= 0 &&
      topLeftX + size <= this._level.width &&
      topLeftY + size <= this._level.height;
  }

  public isPositionOnPath(x: number, y: number, size: number = 30): boolean {
    // x, y is cursor position (center of tower)
    // Convert to top-left position for AABB collision check
    const halfSize = size / 2;
    const topLeftX = x - halfSize;
    const topLeftY = y - halfSize;

    // Get all path entities from the world (supports multiple paths)
    const pathEntities = this._world.getEntitiesWithComponents(['Path']);
    
    // Check AABB collision with all path entities
    for (const pathEntity of pathEntities) {
      const pathComponent = pathEntity.getComponent('Path') as any;
      if (!pathComponent || !pathComponent.waypoints) continue;

      const pathWidth = pathComponent.pathWidth || 30;
      const waypoints = pathComponent.waypoints;

      // Check each path segment
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const minX = Math.min(start.x, end.x) - pathWidth / 2;
        const minY = Math.min(start.y, end.y) - pathWidth / 2;
        const maxX = Math.max(start.x, end.x) + pathWidth / 2;
        const maxY = Math.max(start.y, end.y) + pathWidth / 2;

        // AABB collision check
        if (
          topLeftX < maxX &&
          topLeftX + size > minX &&
          topLeftY < maxY &&
          topLeftY + size > minY
        ) {
          return true; // Collision detected with this path segment
        }
      }
    }
    
    return false; // No collision with any path
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

  public createAndPlaceTower(x: number, y: number, towerType: string, towerData: any): Entity {
    const tower = this._world.createEntity('Tower');

    const size = 30;
    // Center the tower on the cursor position
    const centerX = x - size / 2;
    const centerY = y - size / 2;

    // Add transform (top-left corner for rendering)
    const transform = new TransformComponent(centerX, centerY);
    tower.addComponent(transform);

    // Add tower component
    const towerComp = new TowerComponent(towerData.stats, towerData.color);
    tower.addComponent(towerComp);

    // Add upgrade component for tracking upgrades
    const upgradeComp = new UpgradeComponent(towerType);
    tower.addComponent(upgradeComp);

    // Add chain lightning component if this is an electric tower
    if (towerType === 'electric') {
      const chainLightningTower = new ChainLightningTowerComponent(4, 150);
      tower.addComponent(chainLightningTower);
    }

    // Add flamethrower component if this is a flamethrower tower
    if (towerType === 'flamethrower') {
      const flamethrowerTower = new FlamethrowerTowerComponent(60, towerData.stats.range, towerData.stats.damage);
      tower.addComponent(flamethrowerTower);
    }

    // Add renderable (no range circle by default)
    const renderable = new RenderableComponent();
    renderable.graphics.rect(0, 0, size, size);
    renderable.graphics.fill(towerData.color);
    tower.addComponent(renderable);

    // Add selectable component
    const selectable = new SelectableComponent();
    tower.addComponent(selectable);

    // Add interactable component for clicking
    const interactable = new InteractableComponent(size, size);
    interactable.onClick = () => {
      this.onTowerClicked(tower);
    };
    tower.addComponent(interactable);

    // Initialize available upgrades after tower is fully created with all components
    if (this._towerUpgradeSystem && typeof this._towerUpgradeSystem.initializeUpgradeComponent === 'function') {
      this._towerUpgradeSystem.initializeUpgradeComponent(tower);
      console.log(`🔧 Initialized upgrades for ${towerType} tower`);
    }

    // Add to placed towers array
    this._placedTowers.push(tower);
    console.log('✅ Tower created and added! Total towers:', this._placedTowers.length);

    return tower;
  }

  public showTowerDetails(tower: Entity): void {
    // Get available upgrades from the upgrade system
    let availableUpgrades: any[] = [];

    if (this._towerUpgradeSystem && typeof this._towerUpgradeSystem.getAvailableUpgrades === 'function') {
      availableUpgrades = this._towerUpgradeSystem.getAvailableUpgrades(tower);
    }

    // Pass the tower entity and available upgrades to the UI
    ServiceLocator.get<UIService>('UI').ui.showTowerDetails(tower, availableUpgrades);
  }

  public towerSell(tower: Entity): void {
    // Get tower component to get base cost
    const towerComponent = tower.getComponent('Tower') as TowerComponent;
    if (!towerComponent) {
      console.error('Tower component not found');
      return;
    }

    // Get upgrade component to calculate refund
    const upgradeComponent = tower.getComponent('Upgrade') as UpgradeComponent;
    const baseCost = towerComponent.stats.cost;
    const refundAmount = upgradeComponent
      ? upgradeComponent.getRefundValue(baseCost, 0.5) // 50% refund
      : Math.floor(baseCost * 0.5);

    // Refund money (50% of total cost including upgrades)
    (ServiceLocator.get('GameStateService') as GameStateService).addMoney(refundAmount);

    // Remove tower from placed towers array
    const index = this._placedTowers.indexOf(tower);
    if (index > -1) {
      this._placedTowers.splice(index, 1);
    }

    // Remove tower entity from world
    tower.destroy();

    console.log(`💰 Sold tower ${tower.id} for ${refundAmount} (50% refund)`);

    // UI will be updated in next frame via _postUpdate
  }

  public clearAllTowers(): void {
    this._placedTowers.length = 0;
    console.log('🧹 Cleared all placed towers');
  }
}
