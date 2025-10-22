/**
 * Core ECS Architecture - System Base
 */

import { Entity } from './Entity';
import { World } from './World';


/**
 * Base System class - contains logic that operates on entities with specific components
 */
export abstract class System {
  protected readonly _world: World;
  public enabled: boolean = true;
  public priority: number = 0;

  constructor(world: World) {
    this._world = world;
  }

  /**
   * Define which component types this system requires
   */
  public abstract getRequiredComponents(): string[];

  /**
   * Called once when system is initialized
   */
  public onInit(): void {}

  /**
   * Called every frame with delta time
   */
  public update(deltaTime: number): void {}

  /**
   * Called when system is destroyed
   */
  public onDestroy(): void {}

  /**
   * Get all entities that match this system's requirements
   */
  protected getEntities(): Entity[] {
    const required = this.getRequiredComponents();
    return this._world.getEntitiesWithComponents(required);
  }
}
