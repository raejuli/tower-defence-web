/**
 * Component Factory Registry
 * 
 * Registers all component types with the serialization system.
 * This allows components to be created from JSON data.
 */

import { ComponentSerializer } from '@raejuli/core-engine-gdk/serialization';
import { PathComponent } from '../components/enemy/PathComponent';
import { TowerComponent } from '../components/tower/TowerComponent';
import { EnemyComponent } from '../components/enemy/EnemyComponent';
import { ProjectileComponent } from '../components/projectile/ProjectileComponent';
import { SelectableComponent } from '../components/enemy/SelectableComponent';
import { WaveSpawnerComponent } from '../components/enemy/WaveSpawnerComponent';
import { GameStateComponent } from '../components/general/GameStateComponent';
import { WaveProgressionComponent } from '../components/general/WaveProgressionComponent';
import { RenderableComponent, TransformComponent, StateMachineComponent } from '@raejuli/core-engine-gdk/components';
import {
  WaveSpawnerIdleState,
  WaveSpawnerSpawningState,
  WaveSpawnerWaitingState,
  WaveSpawnerCompleteState
} from '../states/WaveSpawnerStates';

/**
 * Initialize all component factories
 */
export function registerComponentFactories(): void {
  console.log('📦 Registering component factories...');

  // TransformComponent
  const transformFactory = (serialized: any) => {
    const { x, y, rotation, scaleX, scaleY } = serialized.data;
    const transform = new TransformComponent(x || 0, y || 0);
    if (rotation !== undefined) transform.rotation = rotation;
    if (scaleX !== undefined) transform.scaleX = scaleX;
    if (scaleY !== undefined) transform.scaleY = scaleY;
    return transform;
  };
  ComponentSerializer.register('TransformComponent', transformFactory);
  ComponentSerializer.register('Transform', transformFactory); // Alias

  // RenderableComponent
  const renderableFactory = (serialized: any) => {
    const renderable = new RenderableComponent();
    // Graphics will be recreated by the systems
    if (serialized.data.zIndex !== undefined) {
      renderable.zIndex = serialized.data.zIndex;
    }
    return renderable;
  };
  ComponentSerializer.register('RenderableComponent', renderableFactory);
  ComponentSerializer.register('Renderable', renderableFactory); // Alias

  // PathComponent
  ComponentSerializer.register('PathComponent', (serialized) => {
    const { waypoints, pathWidth, color } = serialized.data;
    return new PathComponent(waypoints || [], pathWidth || 30, color || 0x2a2a3e);
  });

  // TowerComponent
  ComponentSerializer.register('TowerComponent', (serialized) => {
    const { towerType, stats } = serialized.data;
    return new TowerComponent(towerType || 'basic', stats);
  });

  // EnemyComponent
  ComponentSerializer.register('EnemyComponent', (serialized) => {
    const { stats } = serialized.data;
    return new EnemyComponent(stats);
  });

  // ProjectileComponent
  ComponentSerializer.register('ProjectileComponent', (serialized) => {
    const { targetId, damage, speed, sourceEntity } = serialized.data;
    return new ProjectileComponent(targetId, damage || 10, speed || 200, sourceEntity);
  });

  // SelectableComponent
  ComponentSerializer.register('SelectableComponent', (serialized) => {
    const { selected } = serialized.data;
    const selectable = new SelectableComponent();
    if (selected !== undefined) selectable.selected = selected;
    return selectable;
  });

  // WaveSpawnerComponent
  ComponentSerializer.register('WaveSpawner', (serialized) => {
    const config = serialized.data as any;
    return new WaveSpawnerComponent(config);
  });

  // GameStateComponent
  ComponentSerializer.register('GameState', (serialized) => {
    const config = serialized.data as any;
    return new GameStateComponent(config);
  });

  // WaveProgressionComponent
  ComponentSerializer.register('WaveProgression', (serialized) => {
    const config = serialized.data as any;
    return new WaveProgressionComponent(config);
  });

  // StateMachineComponent - Create with entity as context
  // Note: The entity will be passed when the component is added to the entity
  // We'll initialize the states in a post-processing step after the entity exists
  ComponentSerializer.register('StateMachine', (serialized) => {
    // Create a placeholder component - states will be added in post-processing
    // Use empty object as temporary context (will use entity as context in states)
    return new StateMachineComponent({} as any);
  });

  console.log('✅ Component factories registered');
}
