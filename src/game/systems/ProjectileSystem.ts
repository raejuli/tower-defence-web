/**
 * Game Systems - Projectile System
 * Core logic for projectile movement and collision
 */

import { System } from '../../engine/ecs/System';
import { World } from '../../engine/ecs/World';
import { Entity } from '../../engine/ecs/Entity';
import { ProjectileComponent } from '../components/ProjectileComponent';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { ChainLightningComponent } from '../components/ChainLightningComponent';

export class ProjectileSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 15;
  }

  public getRequiredComponents(): string[] {
    return ['Projectile', 'Transform'];
  }

  /**
   * Process all projectiles - moves them and handles collisions
   */
  public processProjectiles(deltaTime: number): Array<{projectile: Entity, hit: boolean, targetDead: boolean, target?: Entity, killed: boolean, reward: number}> {
    const projectiles = this.getEntities();
    const results: Array<{projectile: Entity, hit: boolean, targetDead: boolean, target?: Entity, killed: boolean, reward: number}> = [];

    for (const projectile of projectiles) {
      const projComp = projectile.getComponent('Projectile') as ProjectileComponent;
      const transform = projectile.getComponent('Transform') as TransformComponent;

      if (!projComp || !transform) continue;

      // Get target
      const target = this._world.getEntity(projComp.targetId);

      if (!target || !target.active) {
        // Target is dead, check if can chain
        const chainComp = projectile.getComponent('ChainLightning') as ChainLightningComponent;
        if (chainComp && chainComp.canChain()) {
          // Try to find next target
          const nextTarget = this._findNextChainTarget(projectile, chainComp);
          if (nextTarget) {
            projComp.targetId = nextTarget.id;
            chainComp.addHitTarget(nextTarget.id);
            chainComp.chainCount++;
            continue; // Keep projectile alive
          }
        }
        // No chain or no target found - mark for removal
        results.push({ projectile, hit: false, targetDead: true, killed: false, reward: 0 });
        continue;
      }

      const targetTransform = target.getComponent('Transform') as TransformComponent;
      if (!targetTransform) {
        results.push({ projectile, hit: false, targetDead: true, killed: false, reward: 0 });
        continue;
      }

      // Move towards target center (20x20 enemy)
      const dx = (targetTransform.x + 10) - transform.x;
      const dy = (targetTransform.y + 10) - transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // Hit target
        const enemyComp = target.getComponent('Enemy') as EnemyComponent;
        if (enemyComp) {
          const killed = enemyComp.takeDamage(projComp.damage); // State transition handled in takeDamage
          const reward = killed ? enemyComp.stats.reward : 0;
          
          // Check if projectile has chain lightning
          const chainComp = projectile.getComponent('ChainLightning') as ChainLightningComponent;
          if (chainComp) {
            chainComp.addHitTarget(target.id);
            
            if (chainComp.canChain()) {
              // Try to find next target
              const nextTarget = this._findNextChainTarget(projectile, chainComp);
              if (nextTarget) {
                projComp.targetId = nextTarget.id;
                chainComp.addHitTarget(nextTarget.id);
                chainComp.chainCount++;
                // Report hit but don't remove projectile
                results.push({ 
                  projectile, 
                  hit: true,
                  targetDead: false,
                  target,
                  killed, 
                  reward
                });
                continue; // Keep projectile alive for chain
              }
            }
          }
          
          // Normal hit or no more chains
          results.push({ 
            projectile, 
            hit: true,
            targetDead: false,
            target,
            killed, 
            reward
          });
        } else {
          results.push({ projectile, hit: true, targetDead: false, killed: false, reward: 0 });
        }
      } else {
        // Move towards target
        const speed = projComp.speed * deltaTime;
        transform.x += (dx / distance) * speed;
        transform.y += (dy / distance) * speed;
      }
    }

    return results;
  }

  /**
   * Find the closest enemy that hasn't been hit yet by this projectile
   */
  private _findNextChainTarget(projectile: Entity, chainComp: ChainLightningComponent): Entity | null {
    const projTransform = projectile.getComponent('Transform') as TransformComponent;
    if (!projTransform) return null;

    const enemies = this._world.getEntitiesWithComponents(['Enemy', 'Transform']);
    let closestEnemy: Entity | null = null;
    let closestDistance = chainComp.chainRange;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (chainComp.hasHitTarget(enemy.id)) continue; // Skip already hit targets

      const enemyTransform = enemy.getComponent('Transform') as TransformComponent;
      if (!enemyTransform) continue;

      const dx = enemyTransform.x - projTransform.x;
      const dy = enemyTransform.y - projTransform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }
}
