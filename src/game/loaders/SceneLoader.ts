/**
 * Scene Loader
 * 
 * Utilities for loading and rendering scene entities.
 */

import { SerializedScene } from '@raejuli/core-engine-gdk/serialization';
import { World } from '@raejuli/core-engine-gdk/ecs';
import { StateMachineComponent } from '@raejuli/core-engine-gdk/components';
import { EntitySerializer } from '@raejuli/core-engine-gdk/serialization';
import { EntityIdRegistry } from './EntityIdRegistry';
import {
  WaveSpawnerIdleState,
  WaveSpawnerSpawningState,
  WaveSpawnerWaitingState,
  WaveSpawnerCompleteState
} from '../states/WaveSpawnerStates';

export class SceneLoader {
  /**
   * Instantiate game objects from a scene into a world
   */
  static instantiateGameObjects(world: World, serialized: SerializedScene, debug: boolean = false): void {
    console.log(`🎮 Instantiating ${serialized.entities.length} entities`);
    
    // Clear previous entity ID mappings
    EntityIdRegistry.clear();
    
    // Create a mapping from JSON entity IDs to actual entity instances
    const entityIdMap = new Map<string, any>();
    
    // First pass: Create all entities and build ID map
    for (const entityData of serialized.entities) {
      const entity = EntitySerializer.deserialize(world, entityData);
      if (entity) {
        console.log(`✅ Instantiated: ${entity.name} (${entityData.type})`);
        
        // Store mapping from JSON ID to entity
        entityIdMap.set(entityData.id, entity);
        
        // Register in global registry
        EntityIdRegistry.register(entityData.id, entity);
        
        // Post-process: Render path if it's a path entity
        if (entityData.type === 'path') {
          this.renderPathEntity(entity, debug);
        }
      }
    }
    
    // Second pass: Update spawner references to use actual entity IDs
    for (const entityData of serialized.entities) {
      if (entityData.type === 'spawner') {
        const spawnerEntity = entityIdMap.get(entityData.id);
        if (!spawnerEntity) continue;
        
        // Get the WaveSpawner component
        const spawnerComp = spawnerEntity.getComponent('WaveSpawner');
        if (spawnerComp && spawnerComp.config.pathEntityId) {
          // Find the actual path entity
          const pathEntity = entityIdMap.get(spawnerComp.config.pathEntityId);
          if (pathEntity) {
            // Update the config to use the numeric entity ID
            spawnerComp.config.pathEntityId = pathEntity.id;
            console.log(`  🔗 Linked spawner "${spawnerEntity.name}" to path entity ID ${pathEntity.id}`);
          } else {
            console.error(`  ❌ Path entity "${spawnerComp.config.pathEntityId}" not found for spawner "${spawnerEntity.name}"`);
          }
        }
        
        // Initialize state machine
        const stateMachineComponent = spawnerEntity.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachineComponent) {
          // Add all spawner states (entity is passed to each state constructor)
          stateMachineComponent.stateMachine.addState(new WaveSpawnerIdleState('idle', spawnerEntity));
          stateMachineComponent.stateMachine.addState(new WaveSpawnerSpawningState('spawning', spawnerEntity));
          stateMachineComponent.stateMachine.addState(new WaveSpawnerWaitingState('waiting', spawnerEntity));
          stateMachineComponent.stateMachine.addState(new WaveSpawnerCompleteState('complete', spawnerEntity));
          
          // Set initial state
          stateMachineComponent.stateMachine.setState('idle');
          
          // Ensure the component is enabled
          stateMachineComponent.enabled = true;
          
          console.log(`  ✅ Initialized spawner state machine with 4 states, enabled: ${stateMachineComponent.enabled}, current state: ${stateMachineComponent.getCurrentState()}`);
        } else {
          console.error(`  ❌ No StateMachine component found on spawner entity!`);
        }
      }
    }
  }

  /**
   * Render a path entity's graphics
   */
  private static renderPathEntity(entity: any, debug: boolean = false): void {
    const pathComp = entity.getComponent('Path');
    const renderable = entity.getComponent('Renderable');
    
    if (!pathComp || !renderable) {
      console.warn('⚠️ Path entity missing PathComponent or RenderableComponent');
      return;
    }

    // Draw path line
    renderable.graphics.moveTo(pathComp.waypoints[0].x, pathComp.waypoints[0].y);
    for (let i = 1; i < pathComp.waypoints.length; i++) {
      renderable.graphics.lineTo(pathComp.waypoints[i].x, pathComp.waypoints[i].y);
    }
    renderable.graphics.stroke({ width: pathComp.pathWidth, color: pathComp.color });

    // Debug mode: Visualize waypoint positions
    if (debug) {
      console.log('🐛 Drawing waypoint debug visualization');
      for (let i = 0; i < pathComp.waypoints.length; i++) {
        const point = pathComp.waypoints[i];

        // Color-code by position (red=start, blue=end, yellow=middle)
        const waypointColor = i === 0 ? 0xff0000 : (i === pathComp.waypoints.length - 1 ? 0x0000ff : 0xffff00);

        // Draw outer ring (white)
        renderable.graphics
          .circle(point.x, point.y, 8)
          .stroke({ width: 3, color: 0xffffff });

        // Draw inner filled circle (color-coded)
        renderable.graphics
          .circle(point.x, point.y, 6)
          .fill({ color: waypointColor, alpha: 1 });

        console.log(`  Waypoint ${i}: (${point.x}, ${point.y}) - Color: 0x${waypointColor.toString(16)}`);
      }
    }
  }
}
