/**
 * Game Systems - Tower System
 * Core logic for tower targeting and shooting
 */

import { System } from '../../engine/ecs/System';
import { World } from '../../engine/ecs/World';
import { Entity } from '../../engine/ecs/Entity';
import { TowerComponent } from '../components/TowerComponent';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';
import { RenderableComponent } from '../../engine/components/RenderableComponent';
import { ChainLightningComponent } from '../components/ChainLightningComponent';
import { ChainLightningTowerComponent } from '../components/ChainLightningTowerComponent';

export class TowerSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 10;
  }

  public getRequiredComponents(): string[] {
    return ['Tower', 'Transform'];
  }

  /**
   * Update tower cooldowns
   */
  public updateCooldowns(deltaTime: number): void {
    const towers = this.getEntities();
    for (const tower of towers) {
      const towerComp = tower.getComponent('Tower') as TowerComponent;
      if (towerComp) {
        towerComp.timeSinceLastShot += deltaTime;
      }
    }
  }

  /**
   * Process tower targeting and shooting
   */
  public processTowers(enemies: Entity[]): void {
    const towers = this.getEntities();

    for (const tower of towers) {
      const towerComp = tower.getComponent('Tower') as TowerComponent;
      const towerTransform = tower.getComponent('Transform') as TransformComponent;

      if (!towerComp || !towerTransform || !towerComp.enabled) continue;

      // Find target in range
      let target: Entity | null = null;
      let closestDistance = towerComp.stats.range;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const enemyTransform = enemy.getComponent('Transform') as TransformComponent;
        if (!enemyTransform) continue;

        const distance = this._getDistance(
          towerTransform.x,
          towerTransform.y,
          enemyTransform.x,
          enemyTransform.y
        );

        if (distance <= towerComp.stats.range && distance < closestDistance) {
          closestDistance = distance;
          target = enemy;
        }
      }

      towerComp.currentTarget = target ? target.id : null;

      // Shoot at target
      if (target && towerComp.canShoot()) {
        this._shootProjectile(tower, target, towerComp);
        towerComp.resetShootTimer();
      }
    }
  }

  private _shootProjectile(tower: Entity, target: Entity, towerComp: TowerComponent): void {
    const towerTransform = tower.getComponent('Transform') as TransformComponent;
    if (!towerTransform) return;
    
    // Create projectile entity
    const projectile = this._world.createEntity('Projectile');
    
    // Add transform at tower position (center)
    const transform = new TransformComponent(towerTransform.x + 15, towerTransform.y + 15);
    projectile.addComponent(transform);

    // Add projectile component
    const projectileComp = new ProjectileComponent(
      towerComp.stats.damage,
      towerComp.stats.projectileSpeed,
      target.id,
      towerComp.color
    );
    projectile.addComponent(projectileComp);

    // Add chain lightning component if tower has ChainLightningTower component
    const chainTowerComp = tower.getComponent('ChainLightningTower') as ChainLightningTowerComponent;
    if (chainTowerComp) {
      const chainLightning = new ChainLightningComponent(
        chainTowerComp.maxChains,
        chainTowerComp.chainRange
      );
      projectile.addComponent(chainLightning);
    }

    // Add renderable
    const renderable = new RenderableComponent();
    renderable.graphics.circle(0, 0, 3);
    renderable.graphics.fill(towerComp.color);
    projectile.addComponent(renderable);
  }

  private _getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
