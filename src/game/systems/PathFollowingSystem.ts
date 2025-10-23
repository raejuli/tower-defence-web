/**
 * Game Systems - Path Following System
 * Core logic for enemy path movement
 */

import { System } from '../../engine/ecs/System';
import { World } from '../../engine/ecs/World';
import { Entity } from '../../engine/ecs/Entity';
import { PathFollowerComponent } from '../components/PathFollowerComponent';
import { PathComponent } from '../components/PathComponent';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { EnemyComponent } from '../components/EnemyComponent';

export class PathFollowingSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 5;
  }

  public getRequiredComponents(): string[] {
    return ['PathFollower', 'Transform', 'Enemy'];
  }

  /**
   * Process enemies following paths - returns array of results
   */
  public processEnemies(deltaTime: number): Array<{enemy: Entity, reachedEnd: boolean, damage: number}> {
    const entities = this.getEntities();
    const results: Array<{enemy: Entity, reachedEnd: boolean, damage: number}> = [];

    for (const entity of entities) {
      const pathFollower = entity.getComponent('PathFollower') as PathFollowerComponent;
      const transform = entity.getComponent('Transform') as TransformComponent;
      const enemy = entity.getComponent('Enemy') as EnemyComponent;

      if (!pathFollower || !transform || !enemy || !pathFollower.enabled) {
        continue;
      }

      // Get the path entity
      const pathEntity = this._world.getEntity(pathFollower.pathEntityId);
      if (!pathEntity) {
        console.warn(`Path entity ${pathFollower.pathEntityId} not found for enemy ${entity.name}`);
        continue;
      }

      const pathComponent = pathEntity.getComponent('Path') as PathComponent;
      if (!pathComponent) {
        console.warn(`Path component not found on entity ${pathEntity.name}`);
        continue;
      }

      // Get current target waypoint
      const target = pathComponent.getWaypoint(pathFollower.currentIndex);
      if (!target) {
        // Reached end of path
        enemy.reachedEnd(); // State transition handled in component
        results.push({ enemy: entity, reachedEnd: true, damage: enemy.stats.damage });
        continue;
      }

      // Move towards current waypoint (center of enemy to waypoint)
      const enemySize = 20;
      const enemyCenterX = transform.x + enemySize / 2;
      const enemyCenterY = transform.y + enemySize / 2;
      
      const dx = target.x - enemyCenterX;
      const dy = target.y - enemyCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // Reached waypoint
        pathFollower.nextWaypoint();
      } else {
        // Move towards waypoint
        const speed = pathFollower.speed * deltaTime;
        transform.x += (dx / distance) * speed;
        transform.y += (dy / distance) * speed;
      }

      results.push({ enemy: entity, reachedEnd: false, damage: 0 });
    }

    return results;
  }
}
