/**
 * Core ECS Architecture - Component Base
 */

import { World } from './World';

let nextComponentId = 0;

/**
 * Base Component class - data containers with no logic
 */
export abstract class Component {
  public readonly id: number;
  public entityId: number = -1;
  public enabled: boolean = true;
  private _world: World | null = null;

  constructor() {
    this.id = nextComponentId++;
  }

  public abstract getType(): string;

  /**
   * Set the world reference (called by Entity when component is added)
   */
  public setWorld(world: World): void {
    this._world = world;
  }

  /**
   * Get a sibling component from the same entity
   */
  protected getSiblingComponent<T extends Component>(componentType: string): T | null {
    if (!this._world || this.entityId < 0) {
      return null;
    }
    
    const entity = this._world.getEntity(this.entityId);
    if (!entity) {
      return null;
    }
    
    return entity.getComponent(componentType) as T | null;
  }

  public toString(): string | undefined {
    return `Component ID: ${this.id}
Entity ID: ${this.entityId}
Enabled: ${this.enabled ? 'Yes' : 'No'}`;
  }
}
