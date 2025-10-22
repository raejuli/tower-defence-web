/**
 * Core ECS Architecture - Entity
 */

import { Component } from './Component';
import type { World } from './World';

let nextEntityId = 0;

/**
 * Entity - Container for components with unique ID
 */
export class Entity {
  public readonly id: number;
  public name: string;
  public active: boolean = true;
  private _components: Map<string, Component> = new Map();
  private _componentsByType: Map<string, Component[]> = new Map();
  private _world: World | null = null;

  constructor(name: string = 'Entity') {
    this.id = nextEntityId++;
    this.name = name;
  }

  /**
   * Set the world reference (called by World when entity is added)
   */
  public setWorld(world: World): void {
    this._world = world;
    // Update all existing components
    for (const component of this._components.values()) {
      component.setWorld(world);
    }
  }

  /**
   * Add a component to this entity
   */
  public addComponent<T extends Component>(component: T): T {
    const type = component.getType();
    component.entityId = this.id;
    
    // Set world reference on component if we have one
    if (this._world) {
      component.setWorld(this._world);
    }
    
    this._components.set(component.id.toString(), component);
    
    if (!this._componentsByType.has(type)) {
      this._componentsByType.set(type, []);
    }
    this._componentsByType.get(type)!.push(component);
    
    return component;
  }

  /**
   * Get a component by type
   */
  public getComponent<T extends Component>(type: string): T | undefined {
    const components = this._componentsByType.get(type);
    return components?.[0] as T | undefined;
  }

  /**
   * Get all components of a specific type
   */
  public getComponents<T extends Component>(type: string): T[] {
    return (this._componentsByType.get(type) as T[]) || [];
  }

  /**
   * Check if entity has a component of type
   */
  public hasComponent(type: string): boolean {
    return this._componentsByType.has(type) && this._componentsByType.get(type)!.length > 0;
  }

  /**
   * Remove a component
   */
  public removeComponent(component: Component): void {
    const type = component.getType();
    this._components.delete(component.id.toString());
    
    const typeComponents = this._componentsByType.get(type);
    if (typeComponents) {
      const index = typeComponents.indexOf(component);
      if (index > -1) {
        typeComponents.splice(index, 1);
      }
    }
  }

  /**
   * Get all components
   */
  public getAllComponents(): Component[] {
    return Array.from(this._components.values());
  }

  /**
   * Destroy entity - cleanup all components
   */
  public destroy(): void {
    this._components.clear();
    this._componentsByType.clear();
    this.active = false;
  }
}
