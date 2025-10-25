/**
 * Wave Progression System
 * 
 * Manages wave-by-wave progression by:
 * - Reading WaveProgressionComponent configuration
 * - Creating/updating spawners for each wave
 * - Applying wave modifiers
 * - Coordinating wave transitions
 * 
 * This system translates the business-layer wave configuration
 * into runtime spawner entities and components.
 */

import { System } from '@raejuli/core-engine-gdk/ecs';
import { World, Entity } from '@raejuli/core-engine-gdk/ecs';
import { WaveProgressionComponent, WaveConfig, WaveSpawnerConfig } from '../components/general/WaveProgressionComponent';
import { WaveSpawnerComponent } from '../components/enemy/WaveSpawnerComponent';
import { TransformComponent, StateMachineComponent } from '@raejuli/core-engine-gdk/components';
import { EntityIdRegistry } from '../loaders/EntityIdRegistry';
import {
  WaveSpawnerIdleState,
  WaveSpawnerSpawningState,
  WaveSpawnerWaitingState,
  WaveSpawnerCompleteState
} from '../states/WaveSpawnerStates';

export class WaveProgressionSystem extends System {
  private progressionEntity: Entity | null = null;
  private activeSpawners: Map<string, Entity> = new Map();
  private currentWave: number = 0;
  private isWaveActive: boolean = false;

  constructor(world: World) {
    super(world);
  }

  public getRequiredComponents(): string[] {
    return ['WaveSpawnerComponent'];
  }

  public update(deltaTime: number): void {
    // Lazy initialization: Find progression entity on first update when entities are loaded
    // TODO improve this
    if (!this.progressionEntity) {
      const entities = this._world.getAllEntities();
      for (const entity of entities) {
        const progression = entity.getComponent('WaveProgression') as WaveProgressionComponent;
        if (progression) {
          this.progressionEntity = entity;
          console.log('🌊 Wave Progression System initialized');
          console.log(`   Total waves configured: ${progression.getTotalWaves()}`);
          console.log(`   Default enemy type: ${progression.defaultEnemyType}`);
          EntityIdRegistry.debug(); // Show all registered entities
          break;
        }
      }
      
      // If still no progression entity, just return (scene might not use wave progression)
      if (!this.progressionEntity) {
        return;
      }
    }

    const progression = this.progressionEntity.getComponent('WaveProgression') as WaveProgressionComponent;
    if (!progression) return;

    // Auto-start first wave if no wave is active and no spawners exist
    if (this.currentWave === 0 && this.activeSpawners.size === 0 && !progression.isComplete()) {
      console.log('🚀 Auto-starting first wave');
      this.startNextWave(progression);
      return;
    }

    // Check if we need to start a new wave
    if (!this.isWaveActive && !progression.isComplete()) {
      this.checkWaveTransition(progression);
    }

    // Monitor active spawners to detect wave completion
    this.monitorWaveCompletion(progression);
  }

  /**
   * Check if it's time to start the next wave
   */
  private checkWaveTransition(progression: WaveProgressionComponent): void {
    // Check if all current spawners are complete or idle
    const allSpawnersComplete = this.areAllSpawnersComplete();
    
    if (allSpawnersComplete && !progression.isComplete()) {
      // Start next wave
      this.startNextWave(progression);
    }
  }

  /**
   * Start the next wave based on progression configuration
   */
  private startNextWave(progression: WaveProgressionComponent): void {
    const nextWaveNumber = this.currentWave + 1;
    const waveConfig = progression.getWaveConfig(nextWaveNumber);

    if (!waveConfig) {
      console.log('🏁 No more waves to start');
      return;
    }

    console.log(`\n🌊 ========== STARTING WAVE ${nextWaveNumber} ==========`);
    
    // Update progression tracking
    progression.nextWave();
    this.currentWave = nextWaveNumber;
    this.isWaveActive = true;

    // Configure spawners for this wave
    this.configureWaveSpawners(waveConfig, progression);

    // Apply wave modifiers
    if (waveConfig.modifiers) {
      this.applyWaveModifiers(waveConfig.modifiers);
    }
  }

  /**
   * Configure spawners based on wave configuration
   */
  private configureWaveSpawners(waveConfig: WaveConfig, progression: WaveProgressionComponent): void {
    // First, disable all existing spawners
    for (const [id, spawnerEntity] of this.activeSpawners) {
      const spawner = spawnerEntity.getComponent('WaveSpawner') as WaveSpawnerComponent;
      if (spawner) {
        spawnerEntity.active = false;
      }
    }

    // Configure each spawner for this wave
    for (const spawnerConfig of waveConfig.spawners) {
      if (!spawnerConfig.enabled) {
        console.log(`  ⏸️  Spawner "${spawnerConfig.id}" disabled for wave ${waveConfig.waveNumber}`);
        continue;
      }

      this.configureSpawner(spawnerConfig, waveConfig, progression);
    }
  }

  /**
   * Configure or create a specific spawner
   */
  private configureSpawner(
    spawnerConfig: WaveSpawnerConfig,
    waveConfig: WaveConfig,
    progression: WaveProgressionComponent
  ): void {
    let spawnerEntity = this.activeSpawners.get(spawnerConfig.id);

    // Create spawner if it doesn't exist
    if (!spawnerEntity) {
      spawnerEntity = this.createSpawnerEntity(spawnerConfig, waveConfig, progression);
      this.activeSpawners.set(spawnerConfig.id, spawnerEntity);
    } else {
      // Update existing spawner
      this.updateSpawnerEntity(spawnerEntity, spawnerConfig, waveConfig, progression);
    }

    // Activate spawner
    spawnerEntity.active = true;

    // Reset and restart state machine
    const stateMachine = spawnerEntity.getComponent('StateMachine') as StateMachineComponent;
    if (stateMachine) {
      stateMachine.stateMachine.setState('idle');
    }

    const enemyType = progression.getEnemyType(spawnerConfig.enemyType);
    console.log(`  🎯 Spawner "${spawnerConfig.id}": ${spawnerConfig.enemyCount}x ${spawnerConfig.enemyType} (HP: ${enemyType?.health}, Speed: ${enemyType?.speed})`);
  }

  /**
   * Create a new spawner entity
   */
  private createSpawnerEntity(
    spawnerConfig: WaveSpawnerConfig,
    waveConfig: WaveConfig,
    progression: WaveProgressionComponent
  ): Entity {
    const entity = this._world.createEntity(`Spawner-${spawnerConfig.id}`);

    // Add transform
    const position = spawnerConfig.position || { x: 0, y: 0 };
    const transform = new TransformComponent(position.x, position.y);
    entity.addComponent(transform);

    // Add spawner component with configuration
    const enemyType = progression.getEnemyType(spawnerConfig.enemyType) || 
                     progression.getEnemyType(progression.defaultEnemyType)!;

    // Find the path entity by its JSON ID
    const pathEntity = this.findPathEntity(spawnerConfig.pathId);
    const pathEntityId = pathEntity ? pathEntity.id : spawnerConfig.pathId;

    if (!pathEntity) {
      console.error(`  ❌ Path entity "${spawnerConfig.pathId}" not found!`);
    } else {
      console.log(`  🔗 Linked spawner to path entity ID ${pathEntity.id} (${pathEntity.name})`);
    }

    const spawner = new WaveSpawnerComponent({
      maxWaves: progression.getTotalWaves(),
      enemiesPerWave: spawnerConfig.enemyCount,
      spawnInterval: spawnerConfig.spawnInterval,
      idleDuration: waveConfig.idleDuration,
      waveStartDelay: spawnerConfig.startDelay,
      enemyHealth: enemyType.health,
      enemySpeed: enemyType.speed,
      enemyDamage: enemyType.damage,
      enemyReward: enemyType.reward,
      pathEntityId: pathEntityId  // Use numeric ID
    });
    entity.addComponent(spawner);

    // Add state machine
    const stateMachine = new StateMachineComponent(entity);
    stateMachine.stateMachine.addState(new WaveSpawnerIdleState('idle', entity));
    stateMachine.stateMachine.addState(new WaveSpawnerSpawningState('spawning', entity));
    stateMachine.stateMachine.addState(new WaveSpawnerWaitingState('waiting', entity));
    stateMachine.stateMachine.addState(new WaveSpawnerCompleteState('complete', entity));
    stateMachine.stateMachine.setState('idle');
    entity.addComponent(stateMachine);

    console.log(`  ✨ Created new spawner entity: ${entity.name}`);

    return entity;
  }

  /**
   * Update an existing spawner entity
   */
  private updateSpawnerEntity(
    entity: Entity,
    spawnerConfig: WaveSpawnerConfig,
    waveConfig: WaveConfig,
    progression: WaveProgressionComponent
  ): void {
    const spawner = entity.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    const enemyType = progression.getEnemyType(spawnerConfig.enemyType) ||
                     progression.getEnemyType(progression.defaultEnemyType)!;

    // Find the path entity by its JSON ID
    const pathEntity = this.findPathEntity(spawnerConfig.pathId);
    const pathEntityId = pathEntity ? pathEntity.id : spawnerConfig.pathId;

    // Update spawner configuration
    (spawner.config as any).enemiesPerWave = spawnerConfig.enemyCount;
    (spawner.config as any).spawnInterval = spawnerConfig.spawnInterval;
    (spawner.config as any).idleDuration = waveConfig.idleDuration;
    (spawner.config as any).waveStartDelay = spawnerConfig.startDelay;
    (spawner.config as any).enemyHealth = enemyType.health;
    (spawner.config as any).enemySpeed = enemyType.speed;
    (spawner.config as any).enemyDamage = enemyType.damage;
    (spawner.config as any).enemyReward = enemyType.reward;
    (spawner.config as any).pathEntityId = pathEntityId; // Use numeric ID

    // Reset spawner state for new wave
    spawner.enemiesSpawnedThisWave = 0;
    spawner.spawnTimer = 0;
    spawner.idleTimer = 0;
    spawner.waveDelayTimer = 0;
    spawner.currentWave = this.currentWave - 1; // Will be incremented when wave starts

    console.log(`  🔄 Updated spawner entity: ${entity.name}`);
  }

  /**
   * Find a path entity by its JSON ID (searches by name)
   */
  private findPathEntity(pathJsonId: string): Entity | null {
    // Use the EntityIdRegistry to find the path entity
    const pathEntity = EntityIdRegistry.getEntity(pathJsonId);
    
    if (!pathEntity) {
      console.error(`  ❌ Could not find path entity for JSON ID: ${pathJsonId}`);
      console.error(`  Available entity IDs:`, EntityIdRegistry.getAllIds());
    }
    
    return pathEntity;
  }

  /**
   * Apply wave-level modifiers
   */
  private applyWaveModifiers(modifiers: any): void {
    if (modifiers.globalSpeedMultiplier) {
      console.log(`  ⚡ Global speed multiplier: ${modifiers.globalSpeedMultiplier}x`);
    }
    if (modifiers.globalHealthMultiplier) {
      console.log(`  💪 Global health multiplier: ${modifiers.globalHealthMultiplier}x`);
    }
    if (modifiers.globalRewardMultiplier) {
      console.log(`  💰 Global reward multiplier: ${modifiers.globalRewardMultiplier}x`);
    }
  }

  /**
   * Check if all active spawners finished spawning (not if wave is complete)
   */
  private areAllSpawnersFinishedSpawning(): boolean {
    if (this.activeSpawners.size === 0) {
      return true; // No spawners = ready for first wave
    }

    for (const [id, spawnerEntity] of this.activeSpawners) {
      if (!spawnerEntity.active) continue;

      const stateMachine = spawnerEntity.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        const currentState = stateMachine.getCurrentState();
        // Only consider spawning state - if any spawner is still spawning, return false
        if (currentState === 'spawning' || currentState === 'idle') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if all active spawners are complete (for wave transitions)
   */
  private areAllSpawnersComplete(): boolean {
    if (this.activeSpawners.size === 0) {
      return true; // No spawners = ready for first wave
    }

    for (const [id, spawnerEntity] of this.activeSpawners) {
      if (!spawnerEntity.active) continue;

      const stateMachine = spawnerEntity.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        const currentState = stateMachine.getCurrentState();
        if (currentState !== 'complete') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Monitor wave completion
   */
  private monitorWaveCompletion(progression: WaveProgressionComponent): void {
    if (!this.isWaveActive) return;

    // Check if all spawners finished spawning (not necessarily complete)
    const allSpawningComplete = this.areAllSpawnersFinishedSpawning();
    
    // Check if all enemies are defeated
    const allEnemiesDefeated = this.areAllEnemiesDefeated();
    
    if (allSpawningComplete && allEnemiesDefeated) {
      this.isWaveActive = false;
      console.log(`✅ Wave ${this.currentWave} complete (spawning done + all enemies defeated)\n`);
      
      // Mark all spawners as complete for this wave
      for (const [id, spawnerEntity] of this.activeSpawners) {
        const stateMachine = spawnerEntity.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine && stateMachine.getCurrentState() === 'waiting') {
          stateMachine.stateMachine.setState('complete');
        }
      }
      
      // Check if ALL waves in the progression are complete (not just this wave)
      if (progression.isComplete()) {
        console.log(`🎉 All waves complete! Game should transition to victory.`);
        // The game should now check for victory in PlayingState
      } else {
        console.log(`🔄 Wave ${this.currentWave} complete, preparing next wave...`);
        // The next wave will be started in checkWaveTransition on the next update
      }
    }
  }

  /**
   * Check if all enemies from this wave are defeated
   */
  private areAllEnemiesDefeated(): boolean {
    const enemies = this._world.getEntitiesWithComponents(['Enemy']);
    return enemies.length === 0;
  }

  public onDestroy(): void {
    this.activeSpawners.clear();
  }
}
