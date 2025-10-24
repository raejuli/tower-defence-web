/**
 * Entity ID Registry
 * 
 * Maintains a mapping from JSON entity IDs to runtime entity instances.
 * This allows systems to reference entities by their JSON IDs even though
 * the actual runtime entity IDs are auto-generated numbers.
 */

import { Entity } from '@raejuli/core-engine-gdk/ecs';

class EntityIdRegistry {
  private static idMap: Map<string, Entity> = new Map();

  /**
   * Register an entity with its JSON ID
   */
  static register(jsonId: string, entity: Entity): void {
    this.idMap.set(jsonId, entity);
  }

  /**
   * Get an entity by its JSON ID
   */
  static getEntity(jsonId: string): Entity | null {
    return this.idMap.get(jsonId) || null;
  }

  /**
   * Get the runtime entity ID for a JSON ID
   */
  static getEntityId(jsonId: string): number | null {
    const entity = this.idMap.get(jsonId);
    return entity ? entity.id : null;
  }

  /**
   * Check if a JSON ID is registered
   */
  static has(jsonId: string): boolean {
    return this.idMap.has(jsonId);
  }

  /**
   * Clear all registrations (call when loading a new scene)
   */
  static clear(): void {
    this.idMap.clear();
  }

  /**
   * Get all registered JSON IDs
   */
  static getAllIds(): string[] {
    return Array.from(this.idMap.keys());
  }

  /**
   * Get all registered entities
   */
  static getAllEntities(): Entity[] {
    return Array.from(this.idMap.values());
  }

  /**
   * Debug: Print all registered entities
   */
  static debug(): void {
    console.log('📋 Entity ID Registry:');
    for (const [jsonId, entity] of this.idMap) {
      console.log(`  ${jsonId} => Entity #${entity.id} (${entity.name})`);
    }
  }
}

export { EntityIdRegistry };
