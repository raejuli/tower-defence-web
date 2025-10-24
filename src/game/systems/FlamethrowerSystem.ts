/**
 * Game Systems - Flamethrower System
 * Handles flamethrower tower logic with cone-based area damage
 */

import { System } from '@raejuli/core-engine-gdk/ecs';
import { World } from '@raejuli/core-engine-gdk/ecs';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { FlamethrowerTowerComponent } from '../components/tower/FlamethrowerTowerComponent';
import { TransformComponent } from '@raejuli/core-engine-gdk/components';
import { TowerComponent } from '../components/tower/TowerComponent';
import { EnemyComponent } from '../components/enemy/EnemyComponent';

export class FlamethrowerSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 11; // Run after TowerSystem but before ProjectileSystem
  }

  public getRequiredComponents(): string[] {
    return ['FlamethrowerTower', 'Tower', 'Transform'];
  }

  /**
   * Process flamethrower towers - find enemies in cone and damage them
   */
  public processFlamethrowers(deltaTime: number, enemies: Entity[]): void {
    const flamethrowers = this.getEntities();

    for (const tower of flamethrowers) {
      const flamethrowerComp = tower.getComponent('FlamethrowerTower') as FlamethrowerTowerComponent;
      const towerComp = tower.getComponent('Tower') as TowerComponent;
      const towerTransform = tower.getComponent('Transform') as TransformComponent;

      if (!flamethrowerComp || !towerComp || !towerTransform || !towerComp.enabled) continue;

      // Find closest enemy to aim at
      let closestEnemy: Entity | null = null;
      let closestDistance = Infinity;

      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const enemyTransform = enemy.getComponent('Transform') as TransformComponent;
        if (!enemyTransform) continue;

        const distance = this._getDistance(
          towerTransform.x + 15, // Center of tower
          towerTransform.y + 15,
          enemyTransform.x + 10, // Center of enemy
          enemyTransform.y + 10
        );

        if (distance < closestDistance && distance <= flamethrowerComp.coneLength) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }

      // Update tower angle to face the closest enemy
      if (closestEnemy) {
        const enemyTransform = closestEnemy.getComponent('Transform') as TransformComponent;
        if (enemyTransform) {
          const dx = (enemyTransform.x + 10) - (towerTransform.x + 15);
          const dy = (enemyTransform.y + 10) - (towerTransform.y + 15);
          flamethrowerComp.currentAngle = Math.atan2(dy, dx);
        }
      }

      // Check which enemies are in cone (always, not just when shooting)
      const enemiesInCone = this._getEnemiesInCone(
        towerTransform.x + 15,
        towerTransform.y + 15,
        flamethrowerComp.currentAngle,
        flamethrowerComp.coneAngle,
        flamethrowerComp.coneLength,
        enemies
      );

      // Update current target for UI display (for cone visibility)
      towerComp.currentTarget = enemiesInCone.length > 0 ? enemiesInCone[0].id : null;

      // Flamethrower deals continuous damage to all enemies in cone
      if (enemiesInCone.length > 0) {
        console.log(`🔥 Flamethrower damaging ${enemiesInCone.length} enemies in cone`);
        
        // Damage all enemies in cone (continuous damage based on deltaTime)
        for (const enemy of enemiesInCone) {
          const enemyComp = enemy.getComponent('Enemy') as EnemyComponent;
          if (enemyComp) {
            const damage = flamethrowerComp.damagePerSecond * deltaTime;
            console.log(`  Dealing ${damage.toFixed(1)} damage to enemy ${enemy.id}. Health: ${enemyComp.stats.health.toFixed(1)} -> ${(enemyComp.stats.health - damage).toFixed(1)}`);
            const isDead = enemyComp.takeDamage(damage);
            if (isDead) {
              console.log(`  💀 Enemy ${enemy.id} killed by flamethrower!`);
            }
          }
        }
      }
    }
  }

  /**
   * Get all enemies within the cone area
   */
  private _getEnemiesInCone(
    towerX: number,
    towerY: number,
    coneDirection: number,
    coneAngle: number,
    coneLength: number,
    enemies: Entity[]
  ): Entity[] {
    const enemiesInCone: Entity[] = [];
    const halfConeAngle = (coneAngle * Math.PI / 180) / 2;

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      const enemyTransform = enemy.getComponent('Transform') as TransformComponent;
      if (!enemyTransform) continue;

      const enemyCenterX = enemyTransform.x + 10;
      const enemyCenterY = enemyTransform.y + 10;

      // Calculate distance from tower to enemy
      const distance = this._getDistance(towerX, towerY, enemyCenterX, enemyCenterY);
      
      if (distance > coneLength) continue;

      // Calculate angle from tower to enemy
      const dx = enemyCenterX - towerX;
      const dy = enemyCenterY - towerY;
      const angleToEnemy = Math.atan2(dy, dx);

      // Calculate angle difference (handle wrapping around -PI to PI)
      let angleDiff = angleToEnemy - coneDirection;
      
      // Normalize angle difference to [-PI, PI]
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Check if enemy is within cone angle
      if (Math.abs(angleDiff) <= halfConeAngle) {
        enemiesInCone.push(enemy);
      }
    }

    return enemiesInCone;
  }

  private _getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
